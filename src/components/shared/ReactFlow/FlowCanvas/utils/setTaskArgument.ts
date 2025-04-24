import type { ArgumentType, GraphSpec } from "@/utils/componentSpec";

import replaceTaskArgumentsInGraphSpec from "./replaceTaskArgumentsInGraphSpec";

export const setTaskArgument = (
  graphSpec: GraphSpec,
  taskId: string,
  inputName: string,
  argument?: ArgumentType,
) => {
  const oldTaskSpec = graphSpec.tasks[taskId];
  const oldTaskSpecArguments = oldTaskSpec.arguments || {};

  const nonNullArgumentObject = argument ? { [inputName]: argument } : {};
  const newTaskSpecArguments = {
    ...oldTaskSpecArguments,
    ...nonNullArgumentObject,
  };

  const newGraphSpec = replaceTaskArgumentsInGraphSpec(
    taskId,
    graphSpec,
    newTaskSpecArguments,
  );

  return newGraphSpec;
};
