import { BlockStack } from "@/components/ui/layout";
import { Separator } from "@/components/ui/separator";
import { Paragraph } from "@/components/ui/typography";
import { type TaskNodeContextType } from "@/providers/TaskNodeProvider";
import { isGraphImplementation } from "@/utils/componentSpec";

import { AnnotationsSection } from "../AnnotationsEditor/AnnotationsSection";
import TaskConfiguration from "./TaskConfiguration";

interface ConfigurationSectionProps {
  taskNode: TaskNodeContextType;
}

const ConfigurationSection = ({ taskNode }: ConfigurationSectionProps) => {
  const { taskSpec, callbacks } = taskNode;

  const componentSpec = taskSpec.componentRef.spec;

  if (!componentSpec) {
    console.error(
      "TaskOverview called with missing taskSpec.componentRef.spec",
    );
    return null;
  }

  const isSubgraph = isGraphImplementation(componentSpec.implementation);

  return (
    <BlockStack gap="4">
      <Paragraph tone="subdued" size="sm">
        Configure task annotations, resources and custom data.
      </Paragraph>

      {!isSubgraph && (
        <>
          <TaskConfiguration taskNode={taskNode} />
          <Separator />
        </>
      )}

      <AnnotationsSection
        taskSpec={taskSpec}
        onApply={callbacks.setAnnotations}
      />
    </BlockStack>
  );
};

export default ConfigurationSection;
