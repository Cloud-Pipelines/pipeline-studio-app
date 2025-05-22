import type { Annotations } from "@/types/annotations";
import type { GraphSpec } from "@/utils/componentSpec";

const replaceTaskAnnotationsInGraphSpec = (
  taskId: string,
  graphSpec: GraphSpec,
  taskAnnotations: Annotations,
) => {
  if (!taskAnnotations) {
    return graphSpec;
  }

  const newGraphSpec: GraphSpec = {
    ...graphSpec,
    tasks: {
      ...graphSpec.tasks,
      [taskId]: {
        ...graphSpec.tasks[taskId],
        annotations: taskAnnotations,
      },
    },
  };

  return newGraphSpec;
};

export default replaceTaskAnnotationsInGraphSpec;
