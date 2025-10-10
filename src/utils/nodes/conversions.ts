/* Conversion between names and IDs for tasks, inputs, and outputs. */
export const taskNameToTaskId = (taskName: string): string => taskName;
export const inputNameToInputId = (inputName: string): string => inputName;
export const outputNameToOutputId = (outputName: string): string => outputName;
export const taskIdToTaskName = (taskId: string): string => taskId;
export const inputIdToInputName = (inputId: string): string => inputId;
export const outputIdToOutputName = (outputId: string): string => outputId;

/* Conversion between IDs and ReactFlow NodeId. */
export const taskIdToNodeId = (taskId: string) => `task_${taskId}`;
export const inputIdToNodeId = (inputId: string) => `input_${inputId}`;
export const outputIdToNodeId = (outputId: string) => `output_${outputId}`;
export const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");
export const nodeIdToInputId = (id: string) => id.replace(/^input_/, "");
export const nodeIdToOutputId = (id: string) => id.replace(/^output_/, "");
