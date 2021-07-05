import { ComponentSpec, ContainerImplementation, ImplementationType, StringOrPlaceholder, ArgumentType, TypeSpecType } from "../componentSpec";

// # How to handle I/O:
// output = output artifact
// inputValue => input parameter
// inputPath => input artifact
// [ ] downstream input parameter => spread "parameterness" upstream - add output parameters when needed (AFAIK, the paths are the same - required)
// [ ] const argument or pipeline parameter + artifact input => need to insert uploader task

const sanitizePipelineInfoName = (componentName: string) => {
    return componentName.toLowerCase().replace(/\W/, '-')
}

type ResolvedCommandLineAndArgs = {
    command?: string[],
    args?: string[],
    inputsConsumedAsValue: Set<string>,
    inputsConsumedAsPath: Set<string>,
};

const resolveCommandLine = (componentSpec: ComponentSpec, taskArguments: Record<string, ArgumentType>): ResolvedCommandLineAndArgs => {
    if (! ('container' in componentSpec.implementation)) {
      throw Error("resolveCommandLine only supports container components");
    }
    const containerSpec = componentSpec.implementation.container;

    const inputsConsumedAsValue = new Set<string>();
    const inputsConsumedAsPath = new Set<string>();
    const convertArg = (arg: StringOrPlaceholder): string[] => {
        if (typeof arg == "string") {
            return [arg];
        } else if ('inputValue' in arg) {
            const inputName = arg.inputValue;
            inputsConsumedAsValue.add(inputName);
            return [`{{$.inputs.parameters['${inputName}']}}`];
        } else if ('inputPath' in arg) {
            const inputName = arg.inputPath;
            inputsConsumedAsPath.add(inputName);
            return [`{{$.inputs.artifacts['${inputName}'].path}}`];
        } else if ('outputPath' in arg) {
            const outputName = arg.outputPath;
            return [`{{$.outputs.artifacts['${outputName}'].path}}`];
        } else if ('if' in arg) {
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
              if (! (inputName in taskArguments)) {
                condEvaluatesToTrue = false;
              } else {
                const taskArgument = taskArguments[inputName];
                if (typeof taskArgument === "string") {
                    condEvaluatesToTrue = taskArgument.toLowerCase() === "true";
                } else {
                    throw Error("Using runtime conditions in component command line placeholders is not supported yet.")
                }
              }
            } else {
                throw Error("Unexpected contition kind: " + ifCond);
            }
            const unresolvedArgs = condEvaluatesToTrue ? ifThen : ifElse;
            if (unresolvedArgs === undefined) {
                return [];
            }
            return unresolvedArgs.flatMap(convertArg);
        } else if ('concat' in arg) {
            const concatArgs = arg.concat;
            return concatArgs.flatMap(convertArg);
        } else {
            throw Error(`Unknown kind of command-line argument: ${arg}`);
        }
    };

    const result = {
        command: containerSpec.command?.flatMap(convertArg),
        args: containerSpec.args?.flatMap(convertArg),
        inputsConsumedAsValue: inputsConsumedAsValue,
        inputsConsumedAsPath: inputsConsumedAsPath,
    };
    return result;
}

function isContainerImplementation(implementationType: ImplementationType): implementationType is ContainerImplementation {
    return 'container' in implementationType;
}

const typeSpecToVertexPrimitiveTypeEnum = (typeSpec: TypeSpecType | undefined) => {
    if (typeof typeSpec === "string") {
        if (["integer"].includes(typeSpec.toLowerCase())) {
            return "INT";
        }
        if (["float", "double"].includes(typeSpec.toLowerCase())) {
            return "DOUBLE";
        }
    }
    return "STRING";
}

const typeSpecToVertexParameterSpec = (typeSpec: TypeSpecType | undefined) => {
    return {
        type: typeSpecToVertexPrimitiveTypeEnum(typeSpec)
    }
}

const typeSpecToVertexArtifactTypeSchema = (typeSpec: TypeSpecType | undefined) => {
    // TODO: Implement better mapping
    const artifactTypeSchema = {
        schemaTitle: "system.Artifact"
    }
    return artifactTypeSchema
}

const typeSpecToVertexArtifactSpec = (typeSpec: TypeSpecType | undefined) => {
    return {
        artifactType: typeSpecToVertexArtifactTypeSchema(typeSpec)
    }
}
// const typeSpecToVertexArtifactType(typeSpec: TypeSpecType) => {
//     return typeof typeSpec === "string" && ["String", "Integer", "Float", "Double", "Boolean", ]
// }


const taskSpecToVertexTaskSpecComponentSpecAndExecutorSpec = (
    componentSpec: ComponentSpec,
    //passedArgumentNames: string[],
    taskArguments: Record<string, ArgumentType>
) => {
    // TODO: Investigate how to properly narrow the ImplementationTyppe union type
    // Type guard!

    if (!isContainerImplementation(componentSpec.implementation)) {
        throw Error("Nested graph components are not supported yet");
    }
    // Also works
    // if ('container' in componentSpec.implementation) {
    //     componentSpec.implementation
    // }

    const containerSpec = componentSpec.implementation.container;


    const resolvedCommandLine = resolveCommandLine(componentSpec, taskArguments);

    const vertexExecutorSpec = {
        container: {
            image: containerSpec.image,
            command: resolvedCommandLine.command,
            args: resolvedCommandLine.args,
        }
    };

    // resolvedCommandLine.inputsConsumedAsPath

    const inputMap = new Map((componentSpec.inputs ?? []).map(inputSpec => [inputSpec.name, inputSpec]));

    // Array.from(inputMap.keys()).filter(resolvedCommandLine.inputsConsumedAsValue.has)

    const vertexComponentInputsSpec = {
      parameters: Object.fromEntries(
        Array.from(resolvedCommandLine.inputsConsumedAsValue.values()).map(
          (inputName) => [
            inputName,
            typeSpecToVertexParameterSpec(inputMap.get(inputName)?.type),
          ]
        )
      ),
      artifacts: Object.fromEntries(
        Array.from(resolvedCommandLine.inputsConsumedAsPath.values()).map(
          (inputName) => [
            inputName,
            typeSpecToVertexArtifactSpec(inputMap.get(inputName)?.type)
          ]
        )
      ),
    };

    const vertexComponentOutputsSpec = {
      parameters: {}, // Parameters will be added later as needed
      artifacts: Object.fromEntries(
        (componentSpec.outputs ?? []).map((outputSpec) => [
          outputSpec.name,
          typeSpecToVertexArtifactSpec(outputSpec.type)
        ])
      ),
    };

    const vertexComponentSpec = {
        inputDefinitions: vertexComponentInputsSpec,
        outputDefinitions: vertexComponentOutputsSpec,
        // dag
        executorLabel: "<set later>",
    };

    const vertexTaskParameterArguments = Object.fromEntries(Array.from(resolvedCommandLine.inputsConsumedAsValue.values()).map(inputName => [inputName, (inputName => {
        // TODO: Check that this works
        let taskArgument = taskArguments[inputName];
        //if (! (inputName in taskArguments)) {
        if (taskArgument === undefined) {
            // Checking for default value
            const inputSpec = inputMap.get(inputName);
            if (inputSpec === undefined) {
                throw Error(`Cannot happen: vertexTaskParameterArguments - inputMap.get(${inputName}) === undefined`)
            }
            if (inputSpec.default !== undefined) {
                taskArgument = inputSpec.default;
            } else {
                if (inputSpec.optional === true) {
                    // TODO: Decide what the behavior should be
                    // throw Error(`Input "${inputName}" is optional, but command-line still uses it when when it's not present.`);
                    console.error(`Input "${inputName}" is optional, but command-line still uses it when when it's not present.`);
                    taskArgument = "";
                } else {
                    throw Error(`Argument was not provided for required input "${inputName}"`);
                }
            }
        }
        if (typeof taskArgument === "string" ) {
            return {
                runtimeValue: {
                    constantValue: {
                        // TODO: Fix constant arguments for non-string inputs
                        stringValue: taskArgument,
                    }
                }
            }
        } else if ('graphInput' in taskArgument) {
            return {
                componentInputParameter: taskArgument.graphInput.inputName,
            }
        } else if ('taskOutput' in taskArgument) {
            return {
                taskOutputParameter: {
                    producerTask: taskArgument.taskOutput.taskId,
                    outputParameterKey: taskArgument.taskOutput.outputName,
                }
            };
        } else {
            throw Error(`Unknown kind of task argument: "${taskArgument}"`);
        }
    })(inputName)]));

    const vertexTaskArtifactArguments = Object.fromEntries(Array.from(resolvedCommandLine.inputsConsumedAsPath.values()).map(inputName => [inputName, (inputName => {
        // TODO: Check that this works
        let taskArgument = taskArguments[inputName];
        //if (! (inputName in taskArguments)) {
        if (taskArgument === undefined) {
            // Checking for default value
            const inputSpec = inputMap.get(inputName);
            if (inputSpec === undefined) {
                throw Error(`Cannot happen: vertexTaskParameterArguments - inputMap.get(${inputName}) === undefined`)
            }
            if (inputSpec.default !== undefined) {
                taskArgument = inputSpec.default;
            } else {
                if (inputSpec.optional === true) {
                    // TODO: Decide what the behavior should be
                    // throw Error(`Input "${inputName}" is optional, but command-line still uses it when when it's not present.`);
                    console.error(`Input "${inputName}" is optional, but command-line still uses it when when it's not present.`);
                    taskArgument = "";
                } else {
                    throw Error(`Argument was not provided for required input "${inputName}"`);
                }
            }
        }
        if (typeof taskArgument === "string" ) {
            // TODO: Work around and make this possible
            throw Error("Constant arguments for artifact inputs are not supported yet.");
        } else if ('graphInput' in taskArgument) {
            return {
                componentInputArtifact: taskArgument.graphInput.inputName,
            }
        } else if ('taskOutput' in taskArgument) {
            return {
                taskOutputArtifact: {
                    producerTask: taskArgument.taskOutput.taskId,
                    outputArtifactKey: taskArgument.taskOutput.outputName,
                }
            };
        } else {
            throw Error(`Unknown kind of task argument: "${taskArgument}"`);
        }
    })(inputName)]));
    
    const vertexTaskSpec = {
        taskInfo: {
            name: "<set later>",
        },
        inputs: {
            parameters: vertexTaskParameterArguments,
            artifacts: vertexTaskArtifactArguments,
        },
        // dependent_tasks: [],
        cachingOptions: {
            enableCache: true,
        },
        componentRef: {
          name: "<set later>"
        },
        // triggerPolicy: {
        //     condition: "...",
        //     strategy: "ALL_UPSTREAM_TASKS_SUCCEEDED",
        // },
        // iterator: {
        //     artifactIterator: {...},
        //     parameterIterator: {...},
        // },
    }
    
    return { vertexTaskSpec, vertexComponentSpec, vertexExecutorSpec };
}

const graphComponentSpecToVertexPipelineSpec = (componentSpec: ComponentSpec) => {
    if (! ('graph' in componentSpec.implementation)) {
        throw Error("Only graph components are supported for now")
    }

    // TODO: Fix case when these inputs are passed to tasks as artifacts
    const vertexComponentInputsSpec = {
        parameters: Object.fromEntries(
          (componentSpec.inputs ?? []).map(
            (inputSpec) => [inputSpec.name, typeSpecToVertexParameterSpec(inputSpec.type)]
          )
        ),
        // Pipeline does not support artifact inputs
        // artifacts: {},
    };

    const graphSpec = componentSpec.implementation.graph;

    let vertexExecutors: Record<string, any> = {};
    let vertexComponents: Record<string, any> = {};
    let vertexTasks: Record<string, any> = {};

    for (const [taskId, taskSpec] of Object.entries(graphSpec.tasks)) {
        if (taskSpec.componentRef.spec === undefined) {
            throw Error(`Task "${taskId}" does not have taskSpec.componentRef.spec.`)
        }
        const {vertexTaskSpec, vertexComponentSpec, vertexExecutorSpec} = taskSpecToVertexTaskSpecComponentSpecAndExecutorSpec(taskSpec.componentRef.spec, taskSpec.arguments ?? {});
        // task IDs are expected to be unique
        // TODO: Fix  this to work for multi-dag pipelines where task IDs are not globally unique
        const vertexExecutorId = taskId + "_executor";
        const vertexComponentId = taskId + "_component";
        const vertexTaskId = taskId; // + "_task";
        vertexExecutors[vertexExecutorId] = vertexExecutorSpec;
        vertexComponentSpec.executorLabel = vertexExecutorId;
        vertexComponents[vertexComponentId] = vertexComponentSpec;
        vertexTaskSpec.componentRef.name = vertexComponentId;
        vertexTaskSpec.taskInfo.name = vertexTaskId;
        vertexTasks[vertexTaskId] = vertexTaskSpec;
    }

    const pipelineName = componentSpec.name ?? "pipeline";

    const vertexPipelineSpec = {
        pipelineInfo: {
            name: sanitizePipelineInfoName(pipelineName)
        },
        sdkVersion: "Cloud-Pipelines",
        schemaVersion: "2.0.0",
        deploymentSpec: {
            executors: vertexExecutors,
        },
        components: vertexComponents,
        root: {
          inputDefinitions: vertexComponentInputsSpec,
          dag: {
            tasks: vertexTasks,
          }
        },
    };
    return vertexPipelineSpec;
};

const generateVertexPipelineJobFromGraphComponent = (
  componentSpec: ComponentSpec,
  gcsOutputDirectory: string,
  pipelineArguments?: Map<string, string>
) => {
  // TODO: FIX: Do proper conversion of integers
  //let convertedPipelineArguments = new Map<String, object>(Array.from(pipelineArguments.entries()).map((key, value) => [key, value]));
  let convertedPipelineArguments: Record<string, any> = {};
  if (pipelineArguments !== undefined) {
    for (const [key, value] of Array.from(pipelineArguments.entries())) {
      convertedPipelineArguments[key] = {
        stringValue: value,
        //intValue
        //doubleValue
      };
    }
  }

  const pipelineSpec = graphComponentSpecToVertexPipelineSpec(componentSpec);

  const pipelineJob = {
    // name: "<>",
    // displayName: "<>",
    // labels: {},
    runtimeConfig: {
      parameters: convertedPipelineArguments,
      gcsOutputDirectory: gcsOutputDirectory,
    },
    pipelineSpec: pipelineSpec,
    // encryptionSpec: {},
    // serviceAccount: "<>",
    // network: {},
  };
  return pipelineJob;
};

export { graphComponentSpecToVertexPipelineSpec, generateVertexPipelineJobFromGraphComponent };
