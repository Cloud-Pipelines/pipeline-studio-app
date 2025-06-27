// Manually converted from https://github.com/kubeflow/pipelines/blob/master/api/v2alpha1/pipeline_spec.proto

// The spec of a pipeline job.
export interface PipelineJob {
  // Name of the job.
  name?: string;

  // User friendly display name
  displayName?: string;
  // Definition of the pipeline that is being executed.
  pipelineSpec: PipelineSpec;

  // The labels with user-defined metadata to organize PipelineJob.
  labels?: { [k: string]: string };

  // Runtime config of the pipeline.
  runtimeConfig: RuntimeConfig;
}

// The runtime config of a PipelineJob.
export interface RuntimeConfig {
  // The runtime parameters of the PipelineJob. The parameters will be
  // passed into [PipelineJob.pipeline_spec][] to replace the placeholders
  // at runtime.
  parameters?: { [k: string]: MlmdValue };

  // A path in a Cloud Storage bucket which will be treated as the root
  // output directory of the pipeline. It is used by the system to
  // generate the paths of output artifacts.
  // This is a GCP-specific optimization.
  gcsOutputDirectory: string;
}

// The spec of a pipeline.
export interface PipelineSpec {
  // The metadata of the pipeline.
  pipelineInfo?: PipelineInfo;

  // The deployment config of the pipeline.
  // The deployment config can be extended to provide platform specific configs.
  deploymentSpec: PipelineDeploymentConfig;

  // The version of the sdk, which compiles the spec.
  sdkVersion?: string;

  // The version of the schema.
  schemaVersion?: string;

  // The map of name to definition of all components used in this pipeline.
  components: { [k: string]: ComponentSpec };

  // The definition of the main pipeline.  Execution of the pipeline is
  // completed upon the completion of this component.
  root: ComponentSpec;
}

// Definition of a component.
export interface ComponentSpec {
  // Definition of the input parameters and artifacts of the component.
  inputDefinitions?: ComponentInputsSpec;

  // Definition of the output parameters and artifacts of the component.
  outputDefinitions?: ComponentOutputsSpec;

  // Either a DAG or a single execution.
  //oneof implementation {
  dag?: DagSpec;
  executorLabel?: string;
  //}
}

// A DAG contains multiple tasks.
export interface DagSpec {
  // The tasks inside the dag.
  tasks: { [k: string]: PipelineTaskSpec };

  // Defines how the outputs of the dag are linked to the sub tasks.
  outputs?: DagOutputsSpec;
}

// Definition of the output artifacts and parameters of the DAG component.
export interface DagOutputsSpec {
  // Name to the output artifact channel of the DAG.
  artifacts?: { [k: string]: DagOutputArtifactSpec };

  // The name to the output parameter.
  parameters?: { [k: string]: DagOutputParameterSpec };
}

// Selects a defined output artifact from a sub task of the DAG.
export interface ArtifactSelectorSpec {
  // The name of the sub task which produces the output that matches with
  // the `output_artifact_key`.
  producerSubtask: string;

  // The key of [ComponentOutputsSpec.artifacts][] map of the producer task.
  outputArtifactKey: string;
}

// Selects a list of output artifacts that will be aggregated to the single
// output artifact channel of the DAG.
export interface DagOutputArtifactSpec {
  // The selected artifacts will be aggregated as output as a single
  // output channel of the DAG.
  artifactSelectors: ArtifactSelectorSpec[];
}

// Selects a defined output parameter from a sub task of the DAG.
export interface ParameterSelectorSpec {
  // The name of the sub task which produces the output that matches with
  // the `output_parameter_key`.
  producerSubtask: string;

  // The key of [ComponentOutputsSpec.parameters][] map of the producer task.
  outputParameterKey: string;
}

// Aggregate output parameters from sub tasks into a list object.
export interface ParameterSelectorsSpec {
  parameterSelectors: ParameterSelectorSpec[];
}

// Aggregates output parameters from sub tasks into a map object.
export interface MapParameterSelectorsSpec {
  mappedParameters: { [k: string]: ParameterSelectorSpec };
}

// We support four ways to fan-in output parameters from sub tasks to the DAG
// parent task.
// 1. Directly expose a single output parameter from a sub task,
// 2. (Conditional flow) Expose a list of output from multiple tasks
// (some might be skipped) but allows only one of the output being generated.
// 3. Expose a list of outputs from multiple tasks (e.g. iterator flow).
// 4. Expose the aggregation of output parameters as a name-value map.
export type DagOutputParameterSpec =
  // Returns the sub-task parameter as a DAG parameter.  The selected
  // parameter must have the same type as the DAG parameter type.
  | { valueFromParameter: ParameterSelectorSpec }
  // Returns one of the sub-task parameters as a DAG parameter. If there are
  // multiple values are available to select, the DAG will fail. All the
  // selected parameters must have the same type as the DAG parameter type.
  | { valueFromOneof: ParameterSelectorsSpec };

// Definition specification of the component input parameters and artifacts.
export interface ComponentInputsSpec {
  // Name to artifact input.
  artifacts?: { [k: string]: InputArtifactSpec };

  // Name to parameter input.
  parameters?: { [k: string]: InputParameterSpec };
}

// Definition of an artifact input.
export interface InputArtifactSpec {
  artifactType: ArtifactTypeSchema;
}

// Definition of a parameter input.
export interface InputParameterSpec {
  type: PrimitiveTypeEnum;
}

// Definition specification of the component output parameters and artifacts.
export interface ComponentOutputsSpec {
  // Name to artifact output.
  artifacts?: { [k: string]: OutputArtifactSpec };

  // Name to parameter output.
  parameters?: { [k: string]: OutputParameterSpec };
}

// Definition of an artifact output.
export interface OutputArtifactSpec {
  artifactType: ArtifactTypeSchema;

  // Properties of the Artifact.
  metadata?: { [k: string]: any };
}

// Definition of a parameter output.
export interface OutputParameterSpec {
  type: PrimitiveTypeEnum;
}

// The spec of task inputs.
//export interface TaskInputsSpec {
export interface TaskArgumentsSpec {
  // A map of input parameters which are small values, stored by the system and
  // can be queried.
  parameters?: { [k: string]: ParameterArgumentSpec };
  // A map of input artifacts.
  artifacts?: { [k: string]: ArtifactArgumentSpec };
}

// The specification of a task input artifact.
//export type InputArtifactSpec =
export type ArtifactArgumentSpec =
  // Pass the input artifact from another task within the same parent
  // component.
  | { taskOutputArtifact: TaskOutputArtifactSpec }
  // Pass the input artifact from parent component input artifact.
  | { componentInputArtifact: string };

export interface TaskOutputArtifactSpec {
  // The name of the upstream task which produces the output that matches
  // with the `output_artifact_key`.
  producerTask: string;

  // The key of [TaskOutputsSpec.artifacts][] map of the producer task.
  outputArtifactKey: string;
}

// Represents an input parameter. The value can be taken from an upstream
// task's output parameter (if specifying `producer_task` and
// `output_parameter_key`, or it can be a runtime value, which can either be
// determined at compile-time, or from a pipeline parameter.
//export interface InputParameterSpec {
export interface ParameterArgumentSpec {
  //oneof kind {
  // Output parameter from an upstream task.
  taskOutputParameter?: TaskOutputParameterSpec;
  // A constant value or runtime parameter.
  runtimeValue?: ValueOrRuntimeParameter;
  // Pass the input parameter from parent component input parameter.
  componentInputParameter?: string;
  // The final status of an upstream task.
  taskFinalStatus?: TaskFinalStatus;
  //}

  // Selector expression of Common Expression Language (CEL)
  // that applies to the parameter found from above kind.
  //
  // The expression is applied to the Value type
  // [Value][].  For example,
  // 'size(string_value)' will return the size of the Value.string_value.
  //
  // After applying the selection, the parameter will be returned as a
  // [Value][].  The type of the Value is either deferred from the input
  // definition in the corresponding
  // [ComponentSpec.input_definitions.parameters][], or if not found,
  // automatically deferred as either string value or double value.
  //
  // In addition to the builtin functions in CEL, The value.string_value can
  // be treated as a json string and parsed to the [google.protobuf.Value][]
  // proto message. Then, the CEL expression provided in this field will be
  // used to get the requested field. For examples,
  //  - if Value.string_value is a json array of "[1.1, 2.2, 3.3]",
  //  'parseJson(string_value)[i]' will pass the ith parameter from the list
  //  to the current task, or
  //  - if the Value.string_value is a json map of "{"a": 1.1, "b": 2.2,
  //  "c": 3.3}, 'parseJson(string_value)[key]' will pass the map value from
  //  the struct map to the current task.
  //
  // If unset, the value will be passed directly to the current task.
  parameterExpressionSelector?: string;
}

// Represents an upstream task's output parameter.
export interface TaskOutputParameterSpec {
  // The name of the upstream task which produces the output parameter that
  // matches with the `output_parameter_key`.
  producerTask: string;

  // The key of [TaskOutputsSpec.parameters][] map of the producer task.
  outputParameterKey: string;
}

// Represents an upstream task's final status. The field can only be set if
// the schema version is `2.0.0`. The resolved input parameter will be a
// json payload in string type.
export interface TaskFinalStatus {
  // The name of the upsteram task where the final status is coming from.
  producerTask: string;
}

// The spec of task outputs.
export interface TaskOutputsSpec {
  // A map of output parameters which are small values, stored by the system and
  // can be queried. The output key is used
  // by [TaskInputsSpec.InputParameterSpec][] of the downstream task to specify
  // the data dependency. The same key will also be used by
  // [ExecutorInput.Inputs][] to reference the output parameter.
  parameters?: { [k: string]: OutputParameterSpec };
  // A map of output artifacts. Keyed by output key. The output key is used
  // by [TaskInputsSpec.InputArtifactSpec][] of the downstream task to specify
  // the data dependency. The same key will also be used by
  // [ExecutorInput.Inputs][] to reference the output artifact.
  artifacts?: { [k: string]: OutputArtifactSpec };
}

// The specification of a task output artifact.
export interface OutputArtifactSpec {
  // The type of the artifact.
  artifactType: ArtifactTypeSchema;

  // The properties of the artifact, which are determined either at
  // compile-time, or at pipeline submission time through runtime parameters
  properties?: { [k: string]: ValueOrRuntimeParameter };

  // The custom properties of the artifact, which are determined either at
  // compile-time, or at pipeline submission time through runtime parameters
  customProperties?: { [k: string]: ValueOrRuntimeParameter };
}

// Specification for output parameters produced by the task.
export interface OutputParameterSpec {
  // Required field. The type of the output parameter.
  type: PrimitiveTypeEnum;
}

// Represent primitive types.
export enum PrimitiveTypeEnum {
  PRIMITIVE_TYPE_UNSPECIFIED = "PRIMITIVE_TYPE_UNSPECIFIED",
  INT = "INT",
  DOUBLE = "DOUBLE",
  STRING = "STRING",
}

// The spec of a pipeline task.
export interface PipelineTaskSpec {
  // Basic info of a pipeline task.
  taskInfo?: PipelineTaskInfo;

  // Specification for task inputs which contains parameters and artifacts.
  // <Alexey Volkov>: This should have been named: `arguments: TaskArguments`
  inputs?: TaskArgumentsSpec;

  // A list of names of upstream tasks that do not provide input
  // artifacts for this task, but nonetheless whose completion this task depends
  // on.
  dependentTasks?: string[];

  cachingOptions?: CachingOptions;

  // Reference to a component.  Use this field to define either a DAG or an
  // executor.
  componentRef: ComponentRef;

  // Trigger policy of the task.
  triggerPolicy?: TriggerPolicy;

  // Iterator supports fanning out the task into multiple sub-tasks based on the
  // values of input artifact or parameter. The current task will become the
  // parent of all the fan-out tasks. The output of the current task follows
  // the following conventions:
  // * Output artifacts with the same name of each iteration will be merged
  //   into one output artifact channel of the parent iterator task.
  // * Output parameters with the same name of each iteration will be merged
  //   into a string output parameter with the same name with content being a
  //   JSON array.
  //
  // For example, if an iterator starts two sub-tasks (t1 and t2) with the
  // following outputs.
  //
  // t1.outputs.parameters = { 'p': 'v1' }
  // t1.outputs.artifacts = { 'a': [a1] }
  // t2.outputs.parameters = { 'p': 'v2' }
  // t2.outputs.artifacts = { 'a': [a2] }
  // parent_task.outputs.parameters = { 'p': '["v1", "v2"]' }
  // parent_task.outputs.artifacts = { 'a': [a1, a2] }
  //oneof iterator {
  // Iterator to iterate over an artifact input.
  artifactIterator?: ArtifactIteratorSpec;
  // Iterator to iterate over a parameter input.
  parameterIterator?: ParameterIteratorSpec;
  //}
}

export interface CachingOptions {
  // Whether or not to enable cache for this task. Defaults to false.
  enableCache: boolean;
}

// Trigger policy defines how the task gets triggered. If a task is not
// triggered, it will run into SKIPPED state.
export interface TriggerPolicy {
  // An expression which will be evaluated into a boolean value. True to
  // trigger the task to run. The expression follows the language of
  // [CEL Spec][https://github.com/google/cel-spec]. It can access the data
  // from [ExecutorInput][] message of the task.
  // For example:
  // - `inputs.artifacts['model'][0].properties['accuracy']*100 > 90`
  // - `inputs.parameters['type'] == 'foo' && inputs.parameters['num'] == 1`
  condition: string;

  // The trigger strategy of this task.  The `strategy` and `condition` are
  // in logic "AND", as a task will only be tested for the `condition` when
  // the `strategy` is meet.
  // Unset or set to default value of TRIGGER_STRATEGY_UNSPECIFIED behaves the
  // same as ALL_UPSTREAM_TASKS_SUCCEEDED.
  strategy: TriggerStrategy;
}

// An enum defines the trigger strategy of when the task will be ready to be
// triggered.
// ALL_UPSTREAM_TASKS_SUCCEEDED - all upstream tasks in succeeded state.
// ALL_UPSTREAM_TASKS_COMPLETED - all upstream tasks in any final state.
// (Note that CANCELLED is also a final state but job will not trigger new
// tasks when job is in CANCELLING state, so that the task with the trigger
// policy at ALL_UPSTREAM_TASKS_COMPLETED will not start when job
// cancellation is in progress.)
enum TriggerStrategy {
  // Unspecified.  Behave the same as ALL_UPSTREAM_TASKS_SUCCEEDED.
  TRIGGER_STRATEGY_UNSPECIFIED = "TRIGGER_STRATEGY_UNSPECIFIED",
  // Specifies that all upstream tasks are in succeeded state.
  ALL_UPSTREAM_TASKS_SUCCEEDED = "ALL_UPSTREAM_TASKS_SUCCEEDED",
  // Specifies that all upstream tasks are in any final state.
  ALL_UPSTREAM_TASKS_COMPLETED = "ALL_UPSTREAM_TASKS_COMPLETED",
}

// The spec of an artifact iterator. It supports fan-out a workflow from a list
// of artifacts.
export interface ArtifactIteratorSpec {
  // The items to iterate.
  items: ArtifactItemsSpec;
  // The name of the input artifact channel which has the artifact item from the
  // [items][] collection.
  itemInput: string;
}
// Specifies the name of the artifact channel which contains the collection of
// items to iterate. The iterator will create a sub-task for each item of
// the collection and pass the item as a new input artifact channel as
// specified by [item_input][].
export interface ArtifactItemsSpec {
  // The name of the input artifact.
  inputArtifact: string;
}

// The spec of a parameter iterator. It supports fan-out a workflow from a
// string parameter which contains a JSON array.
export interface ParameterIteratorSpec {
  // The items to iterate.
  items: ParameterItemsSpec;
  // The name of the input parameter which has the item value from the
  // [items][] collection.
  itemInput: string;
}

// Specifies the spec to describe the parameter items to iterate.
export type ParameterItemsSpec =
  // Specifies where to get the collection of items to iterate. The iterator
  // will create a sub-task for each item of the collection and pass the item
  // as a new input parameter as specified by [item_input][].
  // The raw JSON array.
  | { raw: string }
  // The name of the input parameter whose value has the items collection.
  // The parameter must be in STRING type and its content can be parsed
  // as a JSON array.
  | { input_parameter: string };

export interface ComponentRef {
  // The name of a component. Refer to the key of the
  // [PipelineSpec.components][] map.
  name: string;
}

// Basic info of a pipeline.
export interface PipelineInfo {
  // Required field. The name of the pipeline.
  // The name will be used to create or find pipeline context in MLMD.
  name: string;
}

// The definition of a artifact type in MLMD.
export type ArtifactTypeSchema =
  // The name of the type. The format of the title must be:
  // `<namespace>.<title>.<version>`.
  // Examples:
  //  - `aiplatform.Model.v1`
  //  - `acme.CustomModel.v2`
  // When this field is set, the export type must be pre-registered in the MLMD
  // store.
  | { schemaTitle: string }

  // Points to a YAML file stored on Google Cloud Storage describing the
  // format.
  | { schemaUri: string }

  // Contains a raw YAML string, describing the format of
  // the properties of the type.
  | { instanceSchema: string };

// The basic info of a task.
export interface PipelineTaskInfo {
  // The unique name of the task within the pipeline definition. This name
  // will be used in downstream tasks to indicate task and data dependencies.
  // <Alexey Volkov>: This ^^^ does not seem to be true. This name seems to be used only as display name.
  name: string;
}

// Definition for a value or reference to a runtime parameter. A
// ValueOrRuntimeParameter instance can be either a field value that is
// determined during compilation time, or a runtime parameter which will be
// determined during runtime.
export type ValueOrRuntimeParameter =
  // Constant value which is determined in compile time.
  | { constantValue: MlmdValue }
  // The runtime parameter refers to the parent component input parameter.
  | { runtimeParameter: string };

export type MlmdValue =
  | {
      stringValue: string;
    }
  | {
      intValue: number;
    }
  | {
      doubleValue: number;
    };

// The definition of the deployment config of the pipeline. It contains the
// the platform specific executor configs for KFP OSS.
export interface PipelineDeploymentConfig {
  // Map from executor label to executor spec.
  executors: { [k: string]: ExecutorSpec };
}

// The specification on a container invocation.
// The string fields of the message support string based placeholder contract
// defined in [ExecutorInput](). The output of the container follows the
// contract of [ExecutorOutput]().
export interface PipelineContainerSpec {
  // The image uri of the container.
  image: string;
  // The main entrypoint commands of the container to run. If not provided,
  // fallback to use the entry point command defined in the container image.
  command?: string[];
  // The arguments to pass into the main entrypoint of the container.
  args?: string[];

  // The lifecycle hooks of the container executor.
  // lifecycle: Lifecycle;

  resources?: ResourceSpec;

  // Environment variables to be passed to the container.
  env?: EnvVar[];
}

// The specification on the resource requirements of a container execution.
// This can include specification of vCPU, memory requirements, as well as
// accelerator types and counts.
export interface ResourceSpec {
  // The limit of the number of vCPU cores. This container execution needs
  // at most cpu_limit vCPU to run.
  cpuLimit: number;

  // The memory limit in GB. This container execution needs at most
  // memory_limit RAM to run.
  memoryLimit: number;

  accelerator: AcceleratorConfig;
}

// Environment variables to be passed to the container.
// Represents an environment variable present in a container.
export interface EnvVar {
  // Name of the environment variable. Must be a valid C identifier. It can
  // be composed of characters such as uppercase, lowercase characters,
  // underscore, digits, but the leading character should be either a
  // letter or an underscore.
  name: string;

  // Variables that reference a $(VAR_NAME) are expanded using the previous
  // defined environment variables in the container and any environment
  // variables defined by the platform runtime that executes this pipeline.
  // If a variable cannot be resolved, the reference in the input string
  // will be unchanged. The $(VAR_NAME) syntax can be escaped with a double
  // $$, ie: $$(VAR_NAME). Escaped references will never be expanded,
  // regardless of whether the variable exists or not.
  value: string;
}

// The specification of the executor.
export type ExecutorSpec =
  // Starts a container.
  { container: PipelineContainerSpec };
// Import an artifact.
//| { importer: ImporterSpec }
// Resolves an existing artifact.
//| { resolver: ResolverSpec }
// Starts a Google Cloud AI Platform CustomJob.
//| { custom_job: AIPlatformCustomJobSpec };

// The specification on the accelerators being attached to this container.
export interface AcceleratorConfig {
  // The type of accelerators.
  type: string;
  // The number of accelerators.
  count: number;
}

// Missing: Lifecycle
// Missing: ImporterSpec
// Missing: ResolverSpec
// Missing: RuntimeArtifact
// Missing: ArtifactList
// Missing: ExecutorInput
// Missing: ExecutorOutput
