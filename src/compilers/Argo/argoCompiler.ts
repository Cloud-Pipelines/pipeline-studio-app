/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  type ArgumentType,
  type ComponentSpec,
  type InputSpec,
  isContainerImplementation,
  isGraphImplementation,
  type StringOrPlaceholder,
} from "../../utils/componentSpec";
import * as argo from "./argo-workflows/ui/src/models/workflows";
import { assertDefined, notUndefined } from "./utils";

export type {
  Workflow,
  WorkflowSpec,
} from "./argo-workflows/ui/src/models/workflows";

// # How to handle I/O:
// Rules (might have exceptions)
// output = output artifact
// inputValue => input parameter
// inputPath => input artifact
// # Fixing conflicts:
// 1) Artifact (may only come from task output) is consumed as value.
//   Solution 1): Change input from parameter to artifact and use the input.artifact.value placeholder.
//      Cons: The downstream component input definitions depend on arguments. (Some inputs are changed from parameter to artifact.)
//            Argo does not support artifact value placeholder.
//   Solution 2): Add parameter output (with the same name as the artifact output) to the upstream component. The paths should be the same, so a single file will be treated as both parameter and output.
//      Cons: The upstream component output definitions depend on downstream consumption style. (Although parameter outputs are added, not changed.)
//   Solution 3) (implemented): Insert a "Downloader" task (artifact to parameter) between upstream and downstream.
//      Cons: Extra container task
// 2) Parameter (pipeline input or constant value) is consumed as artifact (as file).
//   Solution 0) (used): Argo directly supports "raw" artifacts.
//   Solution 1): Insert an "Uploader" task to convert parameter to artifact.
//      Cons: Extra container task

// Argo directly supports pipeline artifact arguments.
// Argo supports raw artifacts. So consuming constant strings is trivial. (Also parameter task outputs if they existed)
// Argo does *not* support artifact.value placeholder.
//
// Problem: Artifact is consumed as parameter (as value):
//   In the Kubeflow Pipelines compiler I've implemented Solution 2: I modify the upstream template to produce output parameter in addition to output artifact
//   In this compiler I've implemented artifact-to-parameter converter task (~Solution 3)

// General compilation logic sequence to compile artifacts vs parameters:
// 1. Generate command line (in some cases (e.g. Vertex Pipelines) following hints about the argument source kind).
// 2. Generate input definitions based on how the arguments are consumed.
// 3. Generate task arguments based on task arguments and input definitions. Insert converters if incompatible.

// TODO: Include the KFP-compatible original component spec in the compiled workflow (as a template annotation).
// TODO: Include the KFP-compatible input/output name and type mapping in the compiled workflow (as a template annotation).

const CONTAINER_INPUTS_DIR = "/tmp/inputs";
const CONTAINER_OUTPUTS_DIR = "/tmp/outputs";
const IO_FILE_NAME = "data";

const sanitizeParameterOrArtifactName = (name: string) => {
  return name.replaceAll(/[^-a-zA-Z0-9_]/g, "-");
};

const sanitizeID = (name: string) => {
  const sanitized1 = name.replaceAll(/[^-a-zA-Z0-9]/g, "-");
  const sanitized2 =
    sanitized1.length === 0 || sanitized1[0].match(/[^a-zA-Z0-9]/g)
      ? "id" + sanitized1
      : sanitized1;
  return sanitized2;
};

type ResolvedCommandLineAndArgs = {
  command?: string[];
  args?: string[];
  inputsConsumedAsParameter: Set<string>;
  inputsConsumedAsArtifact: Set<string>;
};

const resolveCommandLine = (
  componentSpec: ComponentSpec,
  taskArguments: Record<string, ArgumentType>,
): ResolvedCommandLineAndArgs => {
  if (!isContainerImplementation(componentSpec.implementation)) {
    throw Error("resolveCommandLine only supports container components");
  }
  const containerSpec = componentSpec.implementation.container;

  const inputsConsumedAsParameter = new Set<string>();
  const inputsConsumedAsArtifact = new Set<string>();
  const convertArg = (arg: StringOrPlaceholder): string[] => {
    if (typeof arg == "string") {
      return [arg];
    } else if ("inputValue" in arg) {
      const inputName = arg.inputValue;
      // TODO: Replace with proper name mapping to prevent collisions after sanitization.
      const argoInputName = sanitizeParameterOrArtifactName(inputName);
      // Argo does not support {{inputs.artifacts.${inputName}.value}}, so there is only one way
      inputsConsumedAsParameter.add(inputName);
      return [`{{inputs.parameters.${argoInputName}}}`];
    } else if ("inputPath" in arg) {
      const inputName = arg.inputPath;
      // TODO: Replace with proper name mapping to prevent collisions after sanitization.
      const argoInputName = sanitizeParameterOrArtifactName(inputName);
      inputsConsumedAsArtifact.add(inputName);
      return [`{{inputs.artifacts.${argoInputName}.path}}`];
    } else if ("outputPath" in arg) {
      const outputName = arg.outputPath;
      // TODO: Replace with proper name mapping to prevent collisions after sanitization.
      const argoOutputName = sanitizeParameterOrArtifactName(outputName);
      return [`{{outputs.artifacts.${argoOutputName}.path}}`];
    } else if ("if" in arg) {
      const [ifCond, ifThen, ifElse] = [arg.if.cond, arg.if.then, arg.if.else];
      // TODO: Check false values, not just check for true
      let condEvaluatesToTrue = false;
      if (typeof ifCond === "string") {
        condEvaluatesToTrue = ifCond.toLowerCase() === "true";
      } else if (typeof ifCond === "boolean") {
        condEvaluatesToTrue = ifCond;
      } else if ("isPresent" in ifCond) {
        const inputName = ifCond.isPresent;
        condEvaluatesToTrue = inputName in taskArguments;
      } else if ("inputValue" in ifCond) {
        const inputName = ifCond.inputValue;
        if (!(inputName in taskArguments)) {
          condEvaluatesToTrue = false;
        } else {
          const taskArgument = taskArguments[inputName];
          if (typeof taskArgument === "string") {
            condEvaluatesToTrue = taskArgument.toLowerCase() === "true";
          } else {
            throw Error(
              "Using runtime conditions in component command line placeholders is not supported yet.",
            );
          }
        }
      } else {
        throw Error("Unexpected condition kind: " + ifCond);
      }
      const unresolvedArgs = condEvaluatesToTrue ? ifThen : ifElse;
      if (unresolvedArgs === undefined) {
        return [];
      }
      return unresolvedArgs.flatMap(convertArg);
    } else if ("concat" in arg) {
      const concatArgs = arg.concat;
      return [concatArgs.flatMap(convertArg).join("")];
    } else {
      throw Error(`Unknown kind of command-line argument: ${arg}`);
    }
  };

  const result = {
    command: containerSpec.command?.flatMap(convertArg),
    args: containerSpec.args?.flatMap(convertArg),
    inputsConsumedAsParameter: inputsConsumedAsParameter,
    inputsConsumedAsArtifact: inputsConsumedAsArtifact,
  };
  return result;
};

const MAKE_PARAMETER_TEMPLATE_ID = "Convert artifact to parameter";
const MAKE_PARAMETER_INPUT_NAME = "artifact";
const MAKE_PARAMETER_OUTPUT_NAME = "parameter";

const buildMakeParameterTaskSpec = (
  artifactArgument: argo.Artifact,
): argo.DAGTask => {
  const taskId = artifactArgument.from?.match(/{{tasks.([^.]+)./)?.[1];
  const taskSpec: argo.DAGTask = {
    name: "<to be set later>",
    template: MAKE_PARAMETER_TEMPLATE_ID,
    arguments: {
      artifacts: [
        // Setting the argument name
        { ...artifactArgument, name: MAKE_PARAMETER_INPUT_NAME },
      ],
    },
    dependencies: taskId === undefined ? undefined : [taskId],
  };
  return taskSpec;
};

const makeParameterTemplate: argo.Template = {
  name: MAKE_PARAMETER_TEMPLATE_ID,
  inputs: {
    artifacts: [
      {
        name: MAKE_PARAMETER_INPUT_NAME,
        path:
          CONTAINER_INPUTS_DIR +
          "/" +
          MAKE_PARAMETER_INPUT_NAME +
          "/" +
          IO_FILE_NAME,
      },
    ],
  },
  outputs: {
    parameters: [
      {
        name: MAKE_PARAMETER_OUTPUT_NAME,
        valueFrom: {
          path:
            CONTAINER_INPUTS_DIR +
            "/" +
            MAKE_PARAMETER_OUTPUT_NAME +
            "/" +
            IO_FILE_NAME,
        },
      },
    ],
  },
  container: {
    name: "main",
    image: "alpine",
    command: [
      "sh",
      "-ec",
      'mkdir -p "$(dirname "$1")"; cp "$0" "$1"',
      `{{inputs.artifacts.${MAKE_PARAMETER_INPUT_NAME}.path}}`,
      `{{outputs.parameters.${MAKE_PARAMETER_OUTPUT_NAME}.path}}`,
    ],
  },
};

function buildArgoParameterArgument(
  taskArgument: ArgumentType | undefined,
  inputSpec: InputSpec,
  upstreamCannotBeParameter: boolean,
  addMakeParameterTaskAndGetParameterArgument: (
    artifactArgument: argo.Artifact,
    namePrefix?: string,
  ) => argo.Parameter,
): argo.Parameter {
  if (taskArgument === undefined) {
    if (inputSpec.default !== undefined) {
      taskArgument = inputSpec.default;
    } else {
      if (inputSpec.optional === true) {
        // TODO: Decide what the behavior should be
        // throw Error(`Input "${inputSpec.name}" is optional, but command-line still uses it when when it's not present.`);
        console.error(
          `Input "${inputSpec.name}" is optional, but command-line still uses it when when it's not present.`,
        );
        taskArgument = "";
      } else {
        throw Error(
          `Argument was not provided for required input "${inputSpec.name}"`,
        );
      }
    }
  }
  const argoInputName = sanitizeParameterOrArtifactName(inputSpec.name);
  const result: argo.Parameter = {
    name: argoInputName,
  };
  if (typeof taskArgument === "string") {
    result.value = taskArgument;
    return result;
  } else if ("graphInput" in taskArgument) {
    const argoGraphInputName = sanitizeParameterOrArtifactName(
      taskArgument.graphInput.inputName,
    );
    if (upstreamCannotBeParameter) {
      const artifactArgument: argo.Artifact = {
        name: "<to be set later>",
        from: `{{inputs.artifacts.${argoGraphInputName}}}`,
      };
      const convertedParameterArgument =
        addMakeParameterTaskAndGetParameterArgument(
          artifactArgument,
          "Make parameter for " + taskArgument.graphInput.inputName,
        );
      result.value = convertedParameterArgument.value;
    } else {
      result.value = `{{inputs.parameters.${argoGraphInputName}}}`;
    }

    return result;
  } else if ("taskOutput" in taskArgument) {
    const taskOutputArgoOutputName = sanitizeParameterOrArtifactName(
      taskArgument.taskOutput.outputName,
    );
    // FIX: !! Sanitizing the ID here is not enough. There needs to be proper ID mapping.
    // FIX: Task IDs might conflict after sanitization
    const taskOutputArgoTaskId = sanitizeID(taskArgument.taskOutput.taskId);
    const artifactArgument: argo.Artifact = {
      name: "<to be set later>",
      from: `{{tasks.${taskOutputArgoTaskId}.outputs.artifacts.${taskOutputArgoOutputName}}}`,
    };
    // TODO: Maybe use the taskArgument as part of the name?
    const convertedParameterArgument =
      addMakeParameterTaskAndGetParameterArgument(
        artifactArgument,
        `Make parameter for ${taskArgument.taskOutput.taskId} output ${taskArgument.taskOutput.outputName}`,
      );
    result.value = convertedParameterArgument.value;
    return result;
  } else {
    throw Error(`Unknown kind of task argument: "${taskArgument}"`);
  }
}

function buildArgoArtifactArgument(
  taskArgument: ArgumentType | undefined,
  inputSpec: InputSpec,
) {
  //if (! (inputName in taskArguments)) {
  if (taskArgument === undefined) {
    // Checking for default value
    if (inputSpec.default !== undefined) {
      taskArgument = inputSpec.default;
    } else {
      if (inputSpec.optional === true) {
        // TODO: Decide what the behavior should be
        // throw Error(`Input "${inputSpec.name}" is optional, but command-line still uses it when when it's not present.`);
        console.error(
          `Input "${inputSpec.name}" is optional, but command-line still uses it when when it's not present.`,
        );
        taskArgument = "";
      } else {
        throw Error(
          `Argument was not provided for required input "${inputSpec.name}"`,
        );
      }
    }
  }
  const inputArgoName = sanitizeParameterOrArtifactName(inputSpec.name);
  const result: argo.Artifact = {
    name: inputArgoName,
  };
  if (typeof taskArgument === "string") {
    result.raw = {
      data: taskArgument,
    };
    return result;
  } else if ("graphInput" in taskArgument) {
    const graphInputArgoName = sanitizeParameterOrArtifactName(
      taskArgument.graphInput.inputName,
    );
    result.from = `{{inputs.artifacts.${graphInputArgoName}}}`;
    return result;
  } else if ("taskOutput" in taskArgument) {
    // FIX: Task IDs might conflict after sanitization
    // FIX: !! Need proper task ID mapping
    const upstreamTaskOutputArgoName = sanitizeParameterOrArtifactName(
      taskArgument.taskOutput.outputName,
    );
    const upstreamTaskArgoId = sanitizeID(taskArgument.taskOutput.taskId);
    result.from = `{{tasks.${upstreamTaskArgoId}.outputs.artifacts.${upstreamTaskOutputArgoName}}}`;
    return result;
  } else {
    throw Error(`Unknown kind of task argument: "${taskArgument}"`);
  }
}

function buildArgoContainerTemplateFromContainerComponentSpec(
  componentSpec: ComponentSpec,
  taskArguments: Record<string, ArgumentType>,
) {
  if (!isContainerImplementation(componentSpec.implementation)) {
    throw Error("Only container components are supported by this function");
  }

  const containerSpec = componentSpec.implementation.container;

  const resolvedCommandLine = resolveCommandLine(componentSpec, taskArguments);

  const argoTemplateInputs: argo.Inputs = {
    parameters: Array.from(
      resolvedCommandLine.inputsConsumedAsParameter.values(),
    ).map(
      (inputName): argo.Parameter => ({
        // TODO: Replace with proper name mapping to prevent collisions after sanitization.
        name: sanitizeParameterOrArtifactName(inputName),
        // TODO: Enable if needed (after verifying that it works).
        // default: inputMap.get(inputName)?.default,
        // TODO: Enable after verifying the required Argo version.
        // description: inputMap.get(inputName)?.description,
      }),
    ),
    artifacts: Array.from(
      resolvedCommandLine.inputsConsumedAsArtifact.values(),
    ).map(
      (inputName): argo.Artifact => ({
        // TODO: Replace with proper name mapping to prevent collisions after sanitization.
        name: sanitizeParameterOrArtifactName(inputName),
        // Sanitizing the output directory name to prevent potential issues.
        path:
          CONTAINER_INPUTS_DIR +
          "/" +
          inputName.replaceAll(/[/. ]/g, "_") +
          "/" +
          IO_FILE_NAME,
        // TODO: Enable this default value feature if needed (after verifying that it works).
        //raw: { data: inputMap.get(inputName)?.default },
      }),
    ),
  };

  const argoTemplateOutputs: argo.Outputs = {
    parameters: [],
    artifacts: (componentSpec.outputs ?? []).map(
      (outputSpec): argo.Artifact => ({
        // TODO: Replace with proper name mapping to prevent collisions after sanitization.
        name: sanitizeParameterOrArtifactName(outputSpec.name),
        // I've encountered a bug where Argo fails to capture output from a directory with spaces.
        // So I'm sanitizing the output directory name.
        path:
          CONTAINER_OUTPUTS_DIR +
          "/" +
          outputSpec.name.replaceAll(/[/. ]/g, "_") +
          "/" +
          IO_FILE_NAME,
      }),
    ),
  };

  const argoTemplate: argo.Template = {
    name: "<to be set later>",
    inputs: argoTemplateInputs,
    outputs: argoTemplateOutputs,
    container: {
      name: "main",
      image: containerSpec.image,
      command: resolvedCommandLine.command,
      args: resolvedCommandLine.args,
      // TODO: env:
    },
  };
  return argoTemplate;
}

function buildArgoDagTemplateFromGraphComponentSpec(
  componentSpec: ComponentSpec,
  inputsThatHaveParameterArguments: Set<string>,
  addTemplateAndGetId: (template: argo.Template, namePrefix?: string) => string,
) {
  if (!isGraphImplementation(componentSpec.implementation)) {
    throw Error("Only graph components are supported by this function");
  }

  const graphSpec = componentSpec.implementation.graph;

  const argoTasks: Record<string, argo.DAGTask> = {};
  const taskStringToTaskId = new Map<string, string>();

  // Only used in addMakeParameterTaskAndGetParameterArgument
  // We probably should not de-duplicate any user tasks (some components might be volatile).
  // TODO: Refactor away this code.
  const addTaskAndGetId = (task: argo.DAGTask, namePrefix: string = "Task") => {
    // Erasing the name, so that the structure can be used for lookup.
    // We will generate the ID in this function and set name to it.
    const taskCopyForHash: argo.DAGTask = { ...task, name: "" };
    const serializedSpec = JSON.stringify(taskCopyForHash);
    const existingId = taskStringToTaskId.get(serializedSpec);
    if (existingId !== undefined) {
      return existingId;
    }
    const usedIds = new Set(Object.keys(argoTasks));
    const id = makeNameUniqueByAddingIndex(namePrefix, usedIds, sanitizeID);
    taskStringToTaskId.set(serializedSpec, id);
    argoTasks[id] = task;
    // Setting the task name to the generated ID
    task.name = id;
    return id;
  };

  const addMakeParameterTaskAndGetParameterArgument = (
    artifactArgument: argo.Artifact,
    namePrefix: string = "Make artifact",
  ) => {
    // These system names are expected to not conflict with user task names
    const makeArtifactTemplateId = addTemplateAndGetId(
      makeParameterTemplate,
      MAKE_PARAMETER_TEMPLATE_ID,
    );
    const makeArtifactTaskSpec = buildMakeParameterTaskSpec(artifactArgument);
    makeArtifactTaskSpec.template = makeArtifactTemplateId;
    const taskId = addTaskAndGetId(makeArtifactTaskSpec, namePrefix);
    const parameterArgument: argo.Parameter = {
      name: "<to be set later>",
      value: `{{tasks.${taskId}.outputs.parameters.${MAKE_PARAMETER_OUTPUT_NAME}}}`,
    };
    return parameterArgument;
  };

  for (const [taskId, taskSpec] of Object.entries(graphSpec.tasks)) {
    if (taskSpec.componentRef.spec === undefined) {
      throw Error(`Task "${taskId}" does not have taskSpec.componentRef.spec.`);
    }
    try {
      const argoTask = buildArgoDagTaskFromTaskSpec(
        taskSpec.componentRef.spec,
        taskSpec.arguments ?? {},
        inputsThatHaveParameterArguments,
        addTemplateAndGetId,
        addMakeParameterTaskAndGetParameterArgument,
      );
      if (taskId in argoTasks) {
        throw Error(
          `Task ID "${taskId}" is not unique. This cannot happen (unless user task ID clashes with special task ID).`,
        );
      }
      // FIX: Need to establish task id->name mappings
      // We should establish the mapping before processing any tasks and then pass it to buildArgoDagTaskFromTaskSpec calls.
      // Without prior mapping, de-duplicating tasks breaks task output references.
      const argoTaskId = sanitizeID(taskId);
      argoTask.name = argoTaskId;
      argoTasks[argoTaskId] = argoTask;
    } catch (err) {
      if (err instanceof Error) {
        err.message = `Error compiling task ${taskId}: ` + err.message;
      }
      throw err;
    }
  }

  // Scanning the compiled tasks to understand how the inputs are consumed.
  const argoInputsConsumedAsParameter = new Set<string>();
  const argoInputsConsumedAsArtifact = new Set<string>();
  for (const argoTask of Object.values(argoTasks)) {
    for (const argument of Object.values(
      argoTask.arguments?.parameters ?? {},
    )) {
      const argoInputName = argument.value?.match(
        /\{\{inputs\.parameters\.([^}]+)}}/,
      )?.[1];
      if (argoInputName !== undefined) {
        // TODO: Input name mapping
        argoInputsConsumedAsParameter.add(argoInputName);
      }
    }
    for (const argument of Object.values(argoTask.arguments?.artifacts ?? {})) {
      const argoInputName = argument.from?.match(
        /\{\{inputs\.artifacts\.([^}]+)}}/,
      )?.[1];
      if (argoInputName !== undefined) {
        argoInputsConsumedAsArtifact.add(argoInputName);
      }
    }
  }

  // Sanity checks
  // This is probably not an error for this Argo compiler.
  // There are two options when dealing with inputs consumed both ways: Deal with at the lowest level it happens or let it propagate upstream (using this strategy for now).
  // const inputNamesThatAreUsedBothAsParameterAndArtifact = Array.from(
  //   inputsConsumedAsParameter
  // ).filter((x) => inputsConsumedAsArtifact.has(x));
  // if (inputNamesThatAreUsedBothAsParameterAndArtifact.length > 0) {
  //   throw Error(
  //     `Compiler error: When compiling component "${componentSpec.name}" some inputs are used both as parameter and artifact: "${inputNamesThatAreUsedBothAsParameterAndArtifact}". Please file a bug report.`
  //   );
  // }
  // const inputNamesThatAreParametersButAreConsumedAsArtifacts = Array.from(
  //   inputsThatHaveParameterArguments
  // ).filter((x) => inputsConsumedAsArtifact.has(x));
  // if (inputNamesThatAreParametersButAreConsumedAsArtifacts.length > 0) {
  //   throw Error(
  //     `Compiler error: When compiling component "${componentSpec.name}" some parameter arguments are consumed as artifact: "${inputNamesThatAreParametersButAreConsumedAsArtifacts}". Please file a bug report.`
  //   );
  // }

  // We assume that the graphSpec.outputValues has same set of keys as component outputs.
  // However even if there is discrepancy, the graphSpec.outputValues is the "practical" source of truth.
  const dagOutputArtifactSources = Object.entries(
    graphSpec.outputValues ?? {},
  ).map(([outputName, taskOutputArgument]) => {
    const outputArgoName = sanitizeParameterOrArtifactName(outputName);
    const upstreamTaskOutputArgoName = sanitizeParameterOrArtifactName(
      taskOutputArgument.taskOutput.outputName,
    );
    // FIX: !! Need proper id mapping
    const upstreamTaskArgoId = sanitizeID(taskOutputArgument.taskOutput.taskId);
    const result: argo.Artifact = {
      name: outputArgoName,
      from: `{{tasks.${upstreamTaskArgoId}.outputs.artifacts.${upstreamTaskOutputArgoName}}}`,
    };
    return result;
  });

  const argoTemplateInputs: argo.Inputs = {
    parameters: Array.from(argoInputsConsumedAsParameter.values()).map(
      (argoInputName): argo.Parameter => ({
        name: argoInputName,
      }),
    ),
    artifacts: Array.from(argoInputsConsumedAsArtifact.values()).map(
      (argoInputName): argo.Artifact => ({ name: argoInputName }),
    ),
  };

  const argoTemplateOutputs: argo.Outputs = {
    // parameters: [], // ! Dag output parameters use .valueFrom.parameter
    artifacts: dagOutputArtifactSources,
  };

  const vertexComponentSpec: argo.Template = {
    name: "<to be set later>",
    inputs: argoTemplateInputs,
    outputs: argoTemplateOutputs,
    // Argo also supports containerSet. It's like a DAG template, but runs in a single Pod and can share data via shared volume.
    dag: {
      // TODO: Stabilize the ordering
      tasks: Object.values(argoTasks),
    },
  };
  return vertexComponentSpec;
}

function buildArgoTemplateFromComponentSpec(
  componentSpec: ComponentSpec,
  taskArguments: Record<string, ArgumentType>,
  inputsThatHaveParameterArguments: Set<string>,
  addTemplateAndGetId: (template: argo.Template, namePrefix?: string) => string,
) {
  if (isContainerImplementation(componentSpec.implementation)) {
    return buildArgoContainerTemplateFromContainerComponentSpec(
      componentSpec,
      taskArguments,
    );
  } else if (isGraphImplementation(componentSpec.implementation)) {
    return buildArgoDagTemplateFromGraphComponentSpec(
      componentSpec,
      inputsThatHaveParameterArguments,
      addTemplateAndGetId,
    );
  } else {
    throw Error(
      `Unsupported component implementation kind: ${componentSpec.implementation}`,
    );
  }
}

const buildArgoDagTaskFromTaskSpec = (
  componentSpec: ComponentSpec,
  //passedArgumentNames: string[],
  taskArguments: Record<string, ArgumentType>,
  graphInputsWithParameterArguments: Set<string>,
  addTemplateAndGetId: (template: argo.Template, namePrefix?: string) => string,
  addMakeParameterTaskAndGetParameterArgument: (
    artifactArgument: argo.Artifact,
    namePrefix?: string,
  ) => argo.Parameter,
) => {
  // FIX: !! This part is likely broken or not needed.
  // So-called "parameter" arguments can either be constant arguments
  // or come from the arguments to the graph component of the current task.
  // In the current implementation the parameter arguments cannot come from task outputs since all task outputs are artifacts.
  const inputsThatHaveParameterArguments = new Set(
    (componentSpec.inputs ?? [])
      .map((inputSpec) => inputSpec.name)
      .filter((inputName) => {
        const taskArgument = taskArguments[inputName];
        if (taskArgument === undefined) {
          // Missing arguments fall back to default values which are constant strings which are parameters.
          return true;
        }
        if (typeof taskArgument === "string") {
          return true;
        }
        if ("graphInput" in taskArgument) {
          if (
            graphInputsWithParameterArguments.has(
              taskArgument.graphInput.inputName,
            )
          ) {
            return true;
          }
        }
        return false;
      }),
  );

  const inputMap = new Map(
    (componentSpec.inputs ?? []).map((inputSpec) => [
      inputSpec.name,
      inputSpec,
    ]),
  );

  const inputNameToArgoInputName = new Map(
    Array.from(inputMap.keys()).map((name) => [
      name,
      sanitizeParameterOrArtifactName(name),
    ]),
  );

  const argoInputNameToInputName = new Map(
    Array.from(inputNameToArgoInputName.entries()).map(([name, argoName]) => [
      argoName,
      name,
    ]),
  );

  const argoTemplate: argo.Template = buildArgoTemplateFromComponentSpec(
    componentSpec,
    taskArguments,
    inputsThatHaveParameterArguments,
    addTemplateAndGetId,
  );

  const argoTemplateId = addTemplateAndGetId(
    argoTemplate,
    componentSpec.name ?? "Component",
  );

  const argoTaskParameterArguments: argo.Parameter[] = (
    argoTemplate.inputs?.parameters ?? []
  ).map((parameter) => {
    const argoInputName = parameter.name;
    const inputName = assertDefined(
      argoInputNameToInputName.get(argoInputName),
    );
    const inputSpec = assertDefined(inputMap.get(inputName));
    return {
      ...buildArgoParameterArgument(
        taskArguments[inputName],
        inputSpec,
        inputsThatHaveParameterArguments.has(inputName),
        addMakeParameterTaskAndGetParameterArgument,
      ),
      // buildArgoParameterArgument does not set parameter name, so we set it here.
      name: argoInputName,
    };
  });

  const argoTaskArtifactArguments: argo.Artifact[] = (
    argoTemplate.inputs?.artifacts ?? []
  ).map((artifact) => {
    const argoInputName = artifact.name;
    const inputName = assertDefined(
      argoInputNameToInputName.get(argoInputName),
    );
    const inputSpec = assertDefined(inputMap.get(inputName));
    return {
      ...buildArgoArtifactArgument(taskArguments[inputName], inputSpec),
      // buildArgoArtifactArgument does not set artifact name, so we set it here.
      name: argoInputName,
    };
  });
  // We need to scan compiled arguments: The upstream could have been changed to a "convert artifact to parameter" task.
  // So it's better to extract the dependency data from the compiled arguments instead of using the original argument map.
  // const upstreamTaskIds = new Set(
  //   Object.values(taskArguments)
  //     .map((argument) => {
  //       if (typeof argument !== "string" && "taskOutput" in argument) {
  //         return argument.taskOutput.taskId;
  //       } else {
  //         return undefined;
  //       }
  //     })
  //     .filter(notUndefined)
  // );
  // // FIX: !! Need proper id mapping
  // const upstreamArgoTaskIds = Array.from(upstreamTaskIds.keys()).map(
  //   sanitizeID
  // );
  const argoArgumentValues = argoTaskParameterArguments
    .map((arg) => arg.value)
    .concat(argoTaskArtifactArguments.map((arg) => arg.from))
    .filter(notUndefined);
  // Dependencies should be unique. Otherwise Argo considers the workflow to be invalid.
  const upstreamArgoTaskIds = new Set(
    argoArgumentValues
      .map((arg) => arg.match(/{{tasks.([^.]+).outputs./)?.[1])
      .filter(notUndefined),
  );

  const argoDagTask: argo.DAGTask = {
    name: "<to be set later>",
    template: argoTemplateId,
    arguments: {
      parameters: argoTaskParameterArguments,
      artifacts: argoTaskArtifactArguments,
    },
    // FIX: Fix Argo's behavior when depending on conditionally skipped tasks
    dependencies: Array.from(upstreamArgoTaskIds.values()).sort(),
  };

  return argoDagTask;
};

const makeNameUniqueByAddingIndex = (
  name: string,
  existingNames: Set<string>,
  sanitizer: (name: string) => string = (x) => x,
  delimiter: string = "-",
): string => {
  let finalName = sanitizer(name);
  let index = 1;
  while (existingNames.has(finalName)) {
    index++;
    const newFinalName = sanitizer(name + delimiter + index.toString());
    if (newFinalName === finalName) {
      throw Error(
        `The name sanitizer seems to truncate the name which makes it impossible to make the name unique. ${newFinalName}`,
      );
    }
    finalName = newFinalName;
  }
  return finalName;
};

export const buildArgoWorkflowSpecFromGraphComponentSpec = (
  componentSpec: ComponentSpec,
) => {
  const argoTemplates: Record<string, argo.Template> = {};

  const templateStringToTemplateId = new Map<string, string>();

  const addTemplateAndGetId = (
    template: argo.Template,
    namePrefix: string = "Component",
  ) => {
    // Erasing the name, so that the structure can be used for lookup.
    // We will generate the ID in this function and set name to it.
    const templateCopyForHash: argo.Template = { ...template, name: "" };
    const serializedSpec = JSON.stringify(templateCopyForHash);
    const existingId = templateStringToTemplateId.get(serializedSpec);
    if (existingId !== undefined) {
      return existingId;
    }
    const usedIds = new Set(Object.keys(argoTemplates));
    // Note: The generated ID should be used without changes (e.g. sanitization).
    // Otherwise the result of de-duplication will be incorrect.
    const id = makeNameUniqueByAddingIndex(namePrefix, usedIds, sanitizeID);
    templateStringToTemplateId.set(serializedSpec, id);
    argoTemplates[id] = template;
    // Setting the template name to the generated ID
    template.name = id;
    return id;
  };

  // Argo supports both pipeline and artifact arguments for pipeline.
  const graphInputsWithParameterArguments = new Set<string>();

  const pipelineArguments: Record<string, ArgumentType> = Object.fromEntries(
    (componentSpec.inputs ?? []).map((inputSpec) => {
      const argument: ArgumentType = {
        graphInput: { inputName: inputSpec.name },
      };
      return [inputSpec.name, argument];
    }),
  );
  const rootArgoTemplate = buildArgoTemplateFromComponentSpec(
    componentSpec,
    pipelineArguments,
    graphInputsWithParameterArguments,
    addTemplateAndGetId,
  );

  const rootArgoTemplateId = addTemplateAndGetId(
    rootArgoTemplate,
    componentSpec.name ?? "Root",
  );

  const workflowSpec: argo.WorkflowSpec = {
    // Arguments will be set later
    // arguments: {
    //   parameters: [],
    //   artifacts: [],
    // },
    entrypoint: rootArgoTemplateId,
    // FIX: ! Stabilize template order
    templates: Object.values(argoTemplates),
  };
  return workflowSpec;
};

export const buildArgoWorkflowFromGraphComponent = (
  componentSpec: ComponentSpec,
  pipelineArguments: Map<string, string>,
) => {
  const workflowSpec =
    buildArgoWorkflowSpecFromGraphComponentSpec(componentSpec);

  // Adding the default values
  const defaultInputValuePairs = (componentSpec.inputs ?? [])
    .filter((inputSpec) => inputSpec.default !== undefined)
    .map((inputSpec): [string, string] => [
      inputSpec.name,
      String(inputSpec.default),
    ]);
  // TODO: Throw exception when non-default arguments are missing.
  const allPipelineArguments = new Map(
    defaultInputValuePairs.concat(Array.from(pipelineArguments.entries())),
  );

  // Converting the pipeline arguments
  const templateMap = new Map(
    workflowSpec.templates?.map((template) => [template.name, template]),
  );
  const rootTemplate = assertDefined(
    templateMap.get(assertDefined(workflowSpec.entrypoint)),
  );
  const inputParameterNames =
    rootTemplate?.inputs?.parameters?.map((parameter) => parameter.name) ?? [];
  const inputArtifactsNames =
    rootTemplate?.inputs?.artifacts?.map((artifact) => artifact.name) ?? [];

  const pipelineArgumentsWithArgoNames = new Map(
    Array.from(allPipelineArguments.entries()).map(([key, value]) => [
      sanitizeParameterOrArtifactName(key),
      value,
    ]),
  );
  const convertedPipelineArguments: argo.Arguments = {
    parameters: inputParameterNames
      .filter((name) => pipelineArgumentsWithArgoNames.has(name))
      .map(
        (argoInputName): argo.Parameter => ({
          name: argoInputName,
          value: pipelineArgumentsWithArgoNames.get(argoInputName),
        }),
      ),
    artifacts: inputArtifactsNames
      .filter((name) => pipelineArgumentsWithArgoNames.has(name))
      .map(
        (argoInputName): argo.Artifact => ({
          name: argoInputName,
          raw: {
            data: assertDefined(
              pipelineArgumentsWithArgoNames.get(argoInputName),
            ),
          },
        }),
      ),
  };

  // Setting the pipeline arguments
  workflowSpec.arguments = convertedPipelineArguments;

  // TODO: Sanitize better
  const workflowKubernetesName = (
    componentSpec.name?.toLowerCase().replace(/[^-a-z0-9.]/g, "-") || "Pipeline"
  ).substring(0, 240); // 253 max

  const workflow: argo.Workflow = {
    apiVersion: "argoproj.io/v1alpha1",
    kind: "Workflow",
    metadata: {
      generateName: workflowKubernetesName,
      annotations: {
        "cloud-pipelines.net/pipeline-editor": "true",
      },
    },
    spec: workflowSpec,
  };
  return workflow;
};
