import { useQuery } from "@tanstack/react-query";

import { hydrateComponentReference } from "@/services/componentService";
import type { TaskNodeData } from "@/types/nodes";
import type { HydratedComponentReference } from "@/utils/componentSpec";
import { generateTaskSpec } from "@/utils/nodes/generateTaskSpec";
import { createEmptyTaskCallbacks } from "@/utils/nodes/taskCallbackUtils";

export const usePreviewTaskNodeData = (componentText: string) => {
  const { data: componentRef, isLoading } = useQuery({
    queryKey: ["componentRef", componentText],
    queryFn: async () => {
      const ref = await hydrateComponentReference({ text: componentText });
      if (!ref) return false;

      return generatePreviewTaskNodeData(ref);
    },
  });

  return isLoading ? false : componentRef;
};

const generatePreviewTaskNodeData = (
  componentRef: HydratedComponentReference,
): TaskNodeData => {
  const previewTaskId = `preview-${componentRef.name}`;
  const taskSpec = generateTaskSpec(componentRef);

  return {
    taskSpec,
    taskId: previewTaskId,
    isGhost: false,
    readOnly: true,
    connectable: false,
    highlighted: false,
    callbacks: createEmptyTaskCallbacks(),
  };
};
