import type { ArgumentType, GraphSpec } from "@/utils/componentSpec";

import replaceTaskArgumentsInGraphSpec from "./replaceTaskArgumentsInGraphSpec";

export const setTaskArgument = (
  graphSpec: GraphSpec,
  taskId: string,
  inputName: string,
  argument?: ArgumentType,
) => {

  console.log('here?')
  const oldTaskSpec = graphSpec.tasks[taskId];
  const oldTaskSpecArguments = oldTaskSpec.arguments || {};

  const nonNullArgumentObject = argument ? { [inputName]: argument } : {};
  const newTaskSpecArguments = {
    ...Object.fromEntries(
      Object.entries(oldTaskSpecArguments).filter(([key]) => key !== inputName),
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
