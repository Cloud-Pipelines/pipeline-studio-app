import { Skeleton } from "@/components/ui/skeleton";
import { TaskNodeProvider } from "@/providers/TaskNodeProvider";

import { TaskNodeCard } from "../../ReactFlow/FlowCanvas/TaskNode/TaskNodeCard";
import { usePreviewTaskNodeData } from "../usePreviewTaskNodeData";
import { PointersEventBlock } from "./PointersEventBlock";

export const PreviewTaskNodeCard = ({
  componentText,
}: {
  componentText: string;
}) => {
  const previewNodeData = usePreviewTaskNodeData(componentText);

  if (!previewNodeData) {
    return <Skeleton size="lg" shape="square" />;
  }

  return (
    <PointersEventBlock>
      <TaskNodeProvider data={previewNodeData} selected={false}>
        <TaskNodeCard />
      </TaskNodeProvider>
    </PointersEventBlock>
  );
};
