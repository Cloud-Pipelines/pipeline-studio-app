import yaml from "js-yaml";
import { useMemo } from "react";

import { CodeViewer } from "@/components/shared/CodeViewer";
import type { ComponentSpec } from "@/utils/componentSpec";
import { getComponentFilename } from "@/utils/getComponentFilename";

interface TaskImplementationProps {
  displayName: string;
  componentSpec: ComponentSpec;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const TaskImplementation = ({
  displayName,
  componentSpec,
  onFullscreenChange = () => {},
}: TaskImplementationProps) => {
  const filename = getComponentFilename(componentSpec);

  const code = useMemo(() => {
    return yaml.dump(componentSpec, {
      lineWidth: 80,
      noRefs: true,
      indent: 2,
    });
  }, [componentSpec]);

  if (!componentSpec?.implementation) {
    return (
      <div className="text-sm text-gray-500 p-4 border rounded-md">
        No implementation code found for this component.
      </div>
    );
  }

  return (
    <CodeViewer
      code={code}
      language="yaml"
      title={`${displayName} Implementation (read-only)`}
      filename={filename}
      onFullscreenChange={onFullscreenChange}
    />
  );
};

export default TaskImplementation;
