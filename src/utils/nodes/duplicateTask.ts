import type { GraphSpec } from "../componentSpec";
import { getUniqueTaskName } from "../unique";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { setPositionInAnnotations } from "./setPositionInAnnotations";

/* DEPRECATED: to be removed in future versions - Please use duplicateNodes.ts */

const OFFSET = 10;

/* This is direct duplication of a singular Task */
export const duplicateTask = (taskId: string, graphSpec: GraphSpec) => {
  const updatedGraphSpec = { ...graphSpec };

  const taskSpec = updatedGraphSpec.tasks[taskId];
  const annotations = taskSpec.annotations || {};

  const newTaskId = getUniqueTaskName(
    updatedGraphSpec,
    taskSpec.componentRef.spec?.name,
  );

  const position = extractPositionFromAnnotations(taskSpec.annotations);

  const newAnnotations = setPositionInAnnotations(annotations, {
    x: position.x + OFFSET,
    y: position.y + OFFSET,
  });

  const newTaskSpec = {
    ...taskSpec,
    annotations: { ...newAnnotations },
  };

  updatedGraphSpec.tasks = {
    ...updatedGraphSpec.tasks,
    [newTaskId]: newTaskSpec,
  };

  return { updatedGraphSpec, newTaskId };
};
