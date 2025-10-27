import { BlockStack } from "@/components/ui/layout";
import { Heading } from "@/components/ui/typography";
import type { TaskSpec } from "@/utils/componentSpec";

interface OutputsListProps {
  taskSpec: TaskSpec;
}

const OutputsList = ({ taskSpec }: OutputsListProps) => {
  const componentSpec = taskSpec.componentRef.spec;

  const outputs = componentSpec?.outputs;

  const outputsMarkup = outputs?.map((output) => (
    <div key={output.name} className="flex items-center p-2">
      <span className="text-sm">
        <span className="font-medium">{output.name}</span>
        {output.type && (
          <span className="text-xs text-muted-foreground italic ml-1">
            ({output.type as string})
          </span>
        )}
        {output.description && (
          <span
            className="text-xs max-w-3/4 truncate"
            title={output.description}
          >
            : {output.description}
          </span>
        )}
      </span>
    </div>
  ));

  return (
    <BlockStack className="overflow-y-auto p-2">
      <Heading level={1}>Outputs</Heading>
      {outputsMarkup}
    </BlockStack>
  );
};

export default OutputsList;
