import yaml from "js-yaml";

import CodeViewer from "@/components/shared/CodeViewer";
import type { ComponentSpec } from "@/utils/componentSpec";
import { getComponentFilename } from "@/utils/getComponentFilename";

interface TaskImplementationProps {
  displayName: string;
  componentSpec: ComponentSpec;
}

const TaskImplementation = ({
  displayName,
  componentSpec,
}: TaskImplementationProps) => {
  const filename = getComponentFilename(componentSpec);

  return (
    <>
      {componentSpec?.implementation ? (
        <CodeViewer
          code={yaml.dump(componentSpec?.implementation, {
            lineWidth: 80,
            noRefs: true,
            indent: 2,
          })}
          language="yaml"
          title={`${displayName} Implementation (read-only)`}
          filename={filename}
        />
      ) : (
        <div className="text-sm text-gray-500 p-4 border rounded-md">
          No implementation code found for this component.
        </div>
      )}
    </>
  );
};

export default TaskImplementation;
