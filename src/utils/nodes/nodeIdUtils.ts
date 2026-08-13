export const nodeIdToTaskId = (id: string) => id.replace(/^task_/, "");

export const nodeIdToInputName = (id: string) => id.replace(/^input_/, "");

export const nodeIdToOutputName = (id: string) => id.replace(/^output_/, "");

export const taskIdToNodeId = (taskId: string) => `task_${taskId}`;

export const inputNameToNodeId = (inputName: string) => `input_${inputName}`;

export const outputNameToNodeId = (outputName: string) =>
  `output_${outputName}`;
