import type { ArgumentType, GraphSpec } from "@/utils/componentSpec";

import replaceTaskArgumentsInGraphSpec from "./replaceTaskArgumentsInGraphSpec";

export const setTaskArgument = (
  graphSpec: GraphSpec,
  taskId: string,
  inputId: string,
  argument?: ArgumentType,
) => {
  const oldTaskSpec = graphSpec.tasks[taskId];
  const oldTaskSpecArguments = oldTaskSpec.arguments || {};

  const nonNullArgumentObject = argument ? { [inputId]: argument } : {};
  const newTaskSpecArguments = {
    ...Object.fromEntries(
      Object.entries(oldTaskSpecArguments).filter(([key]) => key !== inputId),
    ),
    ...nonNullArgumentObject,
  };

  const newGraphSpec = replaceTaskArgumentsInGraphSpec(
    taskId,
    graphSpec,
    newTaskSpecArguments,
  );

  return newGraphSpec;
};
