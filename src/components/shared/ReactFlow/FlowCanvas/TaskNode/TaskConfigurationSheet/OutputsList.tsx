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
          <span className="text-xs text-muted-foreground italic">
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
    <div className="flex-1 overflow-y-auto p-2">
      <h3>Outputs</h3>
      {outputsMarkup}
    </div>
  );
};

export default OutputsList;
