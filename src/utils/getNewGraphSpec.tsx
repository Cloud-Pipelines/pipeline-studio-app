import type { ArgumentType, GraphSpec } from "../componentSpec";

const getNewGraphSpec = (
    taskId: string,
    graphSpec: GraphSpec,
    taskArguments?: Record<string, ArgumentType>,
  ) => {
    const newGraphSpec: GraphSpec = {
      ...graphSpec,
      tasks: {
        ...graphSpec.tasks,
        [taskId]: {
          ...graphSpec.tasks[taskId],
          arguments: taskArguments,
        }
      }
    };

    return newGraphSpec;
  };

export default getNewGraphSpec;

