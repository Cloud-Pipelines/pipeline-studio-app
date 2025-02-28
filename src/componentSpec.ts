/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

export type MySchema = ComponentSpec;
export type TypeSpecType =
  | string
  | {
      [k: string]: TypeSpecType;
    };
export interface InputOutputSpec {
  name: string;
  type?: TypeSpecType;
  description?: string;
  annotations?: {
    [k: string]: unknown;
  };
}
/**
 * Describes the component input specification
 */
export interface InputSpec extends InputOutputSpec {
  name: string;
  type?: TypeSpecType;
  description?: string;
  default?: string;
  optional?: boolean;
  annotations?: {
    [k: string]: unknown;
  };
}
/**
 * Describes the component output specification
 */
export interface OutputSpec extends InputOutputSpec {
  name: string;
  type?: TypeSpecType;
  description?: string;
  annotations?: {
    [k: string]: unknown;
  };
}
/**
 * Represents the command-line argument placeholder that will be replaced at run-time by the input argument value.
 */
export interface InputValuePlaceholder {
  /**
   * Name of the input.
   */
  inputValue: string;
}
/**
 * Represents the command-line argument placeholder that will be replaced at run-time by a local file path pointing to a file containing the input argument value.
 */
export interface InputPathPlaceholder {
  /**
   * Name of the input.
   */
  inputPath: string;
}
/**
 * Represents the command-line argument placeholder that will be replaced at run-time by a local file path pointing to a file where the program should write its output data.
 */
export interface OutputPathPlaceholder {
  /**
   * Name of the output.
   */
  outputPath: string;
}
export type StringOrPlaceholder =
  | string
  | InputValuePlaceholder
  | InputPathPlaceholder
  | OutputPathPlaceholder
  | ConcatPlaceholder
  | IfPlaceholder;
/**
 * Represents the command-line argument placeholder that will be replaced at run-time by the concatenated values of its items.
 */
export interface ConcatPlaceholder {
  /**
   * Items to concatenate
   */
  concat: StringOrPlaceholder[];
}
/**
 * Represents the command-line argument placeholder that will be replaced at run-time by a boolean value specifying whether the caller has passed an argument for the specified optional input.
 */
export interface IsPresentPlaceholder {
  /**
   * Name of the input.
   */
  isPresent: string;
}
export type IfConditionArgumentType =
  | IsPresentPlaceholder
  | boolean
  | string
  | InputValuePlaceholder;
export type ListOfStringsOrPlaceholders = StringOrPlaceholder[];
/**
 * Represents the command-line argument placeholder that will be replaced at run-time by a boolean value specifying whether the caller has passed an argument for the specified optional input.
 */
export interface IfPlaceholder {
  if: {
    cond: IfConditionArgumentType;
    then: ListOfStringsOrPlaceholders;
    else?: ListOfStringsOrPlaceholders;
  };
}
export interface ContainerSpec {
  /**
   * Docker image name.
   */
  image: string;
  /**
   * Entrypoint array. Not executed within a shell. The docker image's ENTRYPOINT is used if this is not provided.
   */
  command?: StringOrPlaceholder[];
  /**
   * Arguments to the entrypoint. The docker image's CMD is used if this is not provided.
   */
  args?: StringOrPlaceholder[];
  /**
   * List of environment variables to set in the container.
   */
  env?: {
    [k: string]: StringOrPlaceholder;
  };
}
/**
 * Represents the container component implementation.
 */
export interface ContainerImplementation {
  container: ContainerSpec;
}
export type ImplementationType = ContainerImplementation | GraphImplementation;
export interface MetadataSpec {
  annotations?: {
    [k: string]: unknown;
  };
}
/**
 * Component specification. Describes the metadata (name, description, source), the interface (inputs and outputs) and the implementation of the component.
 */
export interface ComponentSpec {
  name?: string;
  description?: string;
  inputs?: InputSpec[];
  outputs?: OutputSpec[];
  implementation: ImplementationType;
  metadata?: MetadataSpec;
}
/**
 * Component reference. Contains information that can be used to locate and load a component by name, digest or URL
 */
export interface ComponentReference {
  name?: string;
  digest?: string;
  tag?: string;
  url?: string;
  spec?: ComponentSpec;
  // Holds unparsed component text. An alternative to spec.
  // url -> data -> text -> spec
  // This simplifies code due to ability to preserve the original component data corresponding to the hash digest.
  // I debated whether to use data (binary) or text here and decided on text.
  // ComponentSpec is usually serialized to YAML or JSON formats that are text based
  // and have better support for text compared to binary data.
  // Not yet in the standard.
  text?: string;
}
/**
 * Represents the component argument value that comes from the graph component input.
 */
export interface GraphInputArgument {
  /**
   * References the input of the graph/pipeline.
   */
  graphInput: {
    inputName: string;
    type?: TypeSpecType;
  };
}
/**
 * Represents the component argument value that comes from the output of a sibling task.
 */
export interface TaskOutputArgument {
  /**
   * References the output of a sibling task.
   */
  taskOutput: {
    taskId: string;
    outputName: string;
    type?: TypeSpecType;
  };
}
export type ArgumentType = string | GraphInputArgument | TaskOutputArgument;
/**
 * Pair of operands for a binary operation.
 */
export interface TwoArgumentOperands {
  op1: ArgumentType;
  op2: ArgumentType;
}
/**
 * Pair of operands for a binary logical operation.
 */
export interface TwoLogicalOperands {
  op1: PredicateType;
  op2: PredicateType;
}
/**
 * Optional configuration that specifies how the task should be executed. Can be used to set some platform-specific options.
 */
export type PredicateType =
  | {
      "==": TwoArgumentOperands;
    }
  | {
      "!=": TwoArgumentOperands;
    }
  | {
      ">": TwoArgumentOperands;
    }
  | {
      ">=": TwoArgumentOperands;
    }
  | {
      "<": TwoArgumentOperands;
    }
  | {
      "<=": TwoArgumentOperands;
    }
  | {
      and: TwoLogicalOperands;
    }
  | {
      or: TwoLogicalOperands;
    }
  | {
      not: PredicateType;
    };

/**
 * Optional configuration that specifies how the task should be retried if it fails.
 */
export interface RetryStrategySpec {
  maxRetries?: number;
}
/**
 * Optional configuration that specifies how the task execution may be skipped if the output data exist in cache.
 */
export interface CachingStrategySpec {
  maxCacheStaleness?: string;
}

export interface ExecutionOptionsSpec {
  retryStrategy?: RetryStrategySpec;
  cachingStrategy?: CachingStrategySpec;
}
/**
 * 'Task specification. Task is a configured component - a component supplied with arguments and other applied configuration changes.
 */
export interface TaskSpec {
  componentRef: ComponentReference;
  arguments?: {
    [k: string]: ArgumentType;
  };
  isEnabled?: PredicateType;
  executionOptions?: ExecutionOptionsSpec;
  annotations?: {
    [k: string]: unknown;
  };
}
/**
 * Describes the graph component implementation. It represents a graph of component tasks connected to the upstream sources of data using the argument specifications. It also describes the sources of graph output values.
 */
export interface GraphSpec {
  tasks: {
    [k: string]: TaskSpec;
  };
  outputValues?: {
    [k: string]: TaskOutputArgument;
  };
}
/**
 * Represents the graph component implementation.
 */
export interface GraphImplementation {
  graph: GraphSpec;
}

// Type guards
export const isValidComponentSpec = (obj: any): obj is ComponentSpec =>
  typeof obj === "object" && "implementation" in obj;

export const isContainerImplementation = (
  implementation: ImplementationType,
): implementation is ContainerImplementation => "container" in implementation;

export const isGraphImplementation = (
  implementation: ImplementationType,
): implementation is GraphImplementation => "graph" in implementation;
