import type { ArgumentType, GraphSpec } from "../componentSpec";

const replaceTaskArgumentsInGraphSpec = (
  taskId: string,
  graphSpec: GraphSpec,
  taskArguments?: Record<string, ArgumentType>,
) => {
  if (!taskArguments) {
    return graphSpec;
  }
  // replaceTaskArgumentsInGraphSpec
  const newGraphSpec: GraphSpec = {
    ...graphSpec,
    tasks: {
      ...graphSpec.tasks,
      [taskId]: {
        ...graphSpec.tasks[taskId],
        arguments: taskArguments,
      },
    },
  };

  return newGraphSpec;
};

export default replaceTaskArgumentsInGraphSpec;
