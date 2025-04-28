import yaml from "js-yaml";

import CodeViewer from "@/components/shared/CodeViewer";
import type { ComponentSpec } from "@/utils/componentSpec";

interface ImplementationTabProps {
  displayName: string;
  componentSpec: ComponentSpec;
}

const ImplementationTab = ({
  displayName,
  componentSpec,
}: ImplementationTabProps) => {
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
        />
      ) : (
        <div className="text-sm text-gray-500 p-4 border rounded-md">
          No implementation code found for this component.
        </div>
      )}
    </>
  );
};

export default ImplementationTab;
