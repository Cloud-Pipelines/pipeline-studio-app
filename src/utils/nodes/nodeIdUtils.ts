/* Conversions between names and IDs for tasks, inputs, and outputs. */
/* Conversion between IDs and ReactFlow NodeId is done via the Node Manager. */

export const taskNameToTaskId = (taskName: string): string => taskName;
export const inputNameToInputId = (inputName: string): string => inputName;
export const outputNameToOutputId = (outputName: string): string => outputName;
export const taskIdToTaskName = (taskId: string): string => taskId;
export const inputIdToInputName = (inputId: string): string => inputId;
export const outputIdToOutputName = (outputId: string): string => outputId;
