import { Badge } from "@/components/ui/badge";
import type { InputSpec, OutputSpec, TaskSpec } from "@/utils/componentSpec";
import { formatBytes } from "@/utils/string";
import { transformGcsUrl } from "@/utils/URL";

interface IoCellProps {
  io: InputSpec | OutputSpec;
  taskSpec: TaskSpec;
  artifacts: any;
}

const IoCell = ({ io, taskSpec, artifacts }: IoCellProps) => {
  return (
    <div
      key={io.name}
      className="px-3 py-2 flex flex-col gap-2 even:bg-gray-50"
    >
      <span className="font-medium text-sm">{io.name}</span>

      {io.type && (
        <div className="flex text-xs items-center">
          <span className="text-gray-500 w-14 flex-shrink-0">Type:</span>
          <Badge>{io.type?.toString()}</Badge>
        </div>
      )}

      {io.description && (
        <div className="flex text-xs">
          <span className="text-gray-500 w-14 flex-shrink-0">Desc:</span>
          <span className="font-mono break-words text-xs">
            {io.description}
          </span>
        </div>
      )}

      {taskSpec.arguments?.[io.name] && (
        <div className="flex text-xs">
          <span className="text-gray-500 w-14 flex-shrink-0">Default:</span>
          <span className="font-mono break-all text-xs">
            {JSON.stringify(taskSpec.arguments?.[io.name])}
          </span>
        </div>
      )}

      {artifacts?.artifact_data && (
        <>
          <hr className="my-2 border-gray-200" />
          <span className="font-medium text-sm">Artifact</span>
          <div className="space-y-0.5">
            {artifacts.artifact_data.value !== undefined && (
              <div className="flex text-xs">
                <span className="text-gray-500 w-14 flex-shrink-0">Value:</span>
                <span className="font-mono break-all">
                  {artifacts.artifact_data.value || "-"}
                </span>
              </div>
            )}

            {artifacts.artifact_data.uri !== undefined && (
              <div className="flex text-xs">
                <span className="text-gray-500 w-14 flex-shrink-0">URI:</span>
                <a
                  href={transformGcsUrl(artifacts.artifact_data.uri)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono break-all text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {artifacts.artifact_data.uri || "-"}
                </a>
              </div>
            )}

            {artifacts.artifact_data.total_size !== undefined && (
              <div className="flex text-xs">
                <span className="text-gray-500 w-14 flex-shrink-0">Size:</span>
                <span className="font-mono">
                  {formatBytes(artifacts.artifact_data.total_size)}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IoCell;
