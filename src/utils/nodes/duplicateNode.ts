import type { GraphSpec } from "../componentSpec";
import { getUniqueTaskName } from "../unique";
import { extractPositionFromAnnotations } from "./extractPositionFromAnnotations";
import { setPositionInAnnotations } from "./setPositionInAnnotations";

const OFFSET = 10;

/* This is direct duplication of a singular node */
export const duplicateNode = (
  taskId: string,
  graphSpec: GraphSpec,
  selected: boolean,
) => {
  const updatedGraphSpec = { ...graphSpec };

  const taskSpec = updatedGraphSpec.tasks[taskId];
  const annotations = taskSpec.annotations || {};
  annotations.selected = false; // deselect the original task

  const newTaskId = getUniqueTaskName(
    updatedGraphSpec,
    taskSpec.componentRef.spec?.name,
  );

  const position = extractPositionFromAnnotations(taskSpec.annotations);

  const updatedTaskSpec = {
    ...taskSpec,
    annotations: annotations,
  };

  const newAnnotations = setPositionInAnnotations(annotations, {
    x: position.x + OFFSET,
    y: position.y + OFFSET,
  });

  newAnnotations.selected = selected; // new duplicate tasks are selected by default

  const newTaskSpec = {
    ...taskSpec,
    annotations: { ...newAnnotations },
  };

  updatedGraphSpec.tasks = {
    ...updatedGraphSpec.tasks,
    [taskId]: updatedTaskSpec,
    [newTaskId]: newTaskSpec,
  };

  return updatedGraphSpec;
};
