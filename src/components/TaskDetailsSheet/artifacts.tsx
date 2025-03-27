import { useQuery } from "@tanstack/react-query";

import type { GetArtifactsApiExecutionsIdArtifactsGetResponse } from "@/api/types.gen";
import { API_URL } from "@/utils/constants";

const getArtifacts = async (executionId: string) => {
  if (!executionId) return null;
  const response = await fetch(
    `${API_URL}/api/executions/${executionId}/artifacts`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch artifacts: ${response.statusText}`);
  }
  return response.json() as Promise<GetArtifactsApiExecutionsIdArtifactsGetResponse>;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ArtifactValue = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex text-xs">
    <span className="text-gray-500 w-20 flex-shrink-0">{label}:</span>
    {label === "URI" && typeof value === "string" ? (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono break-all text-blue-600 hover:text-blue-800 hover:underline"
      >
        {value}
      </a>
    ) : (
      <span className="font-mono break-all">{value}</span>
    )}
  </div>
);

const Artifacts = ({ executionId }: { executionId?: string | number }) => {
  const { data: artifacts, isLoading: isLoadingArtifacts } = useQuery({
    queryKey: ["artifacts", executionId],
    queryFn: () => getArtifacts(String(executionId)),
    enabled: !!executionId,
  });

  if (isLoadingArtifacts) {
    return <div>Loading...</div>;
  }

  if (!artifacts?.input_artifacts && !artifacts?.output_artifacts) {
    return <div className="text-sm text-gray-500">No artifacts available</div>;
  }

  const inputArtifacts = artifacts.input_artifacts;
  const outputArtifacts = artifacts.output_artifacts;

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">Input Artifacts</h4>
        <div className="border rounded-md divide-y">
          {inputArtifacts && Object.entries(inputArtifacts).length > 0 ? (
            Object.entries(inputArtifacts).map(([key, artifact]) => (
              <div key={key} className="px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{key}</span>
                    {artifact.type_name && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {artifact.type_name}
                      </span>
                    )}
                  </div>
                </div>
                {artifact.artifact_data && (
                  <div className="space-y-1">
                    {artifact.artifact_data.value !== undefined && (
                      <ArtifactValue
                        label="Value"
                        value={JSON.stringify(artifact.artifact_data.value)}
                      />
                    )}
                    {artifact.artifact_data.total_size && (
                      <ArtifactValue
                        label="Size"
                        value={formatBytes(artifact.artifact_data.total_size)}
                      />
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">
              No input artifacts available
            </div>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-medium mb-2">Output Artifacts</h4>
        <div className="border rounded-md divide-y">
          {outputArtifacts && Object.entries(outputArtifacts).length > 0 ? (
            Object.entries(outputArtifacts).map(([key, artifact]) => (
              <div key={key} className="px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{key}</span>
                    {artifact.type_name && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {artifact.type_name}
                      </span>
                    )}
                  </div>
                </div>
                {artifact.artifact_data && (
                  <div className="space-y-1">
                    {artifact.artifact_data.uri && (
                      <ArtifactValue
                        label="URI"
                        value={artifact.artifact_data.uri}
                      />
                    )}
                    {artifact.artifact_data.total_size && (
                      <ArtifactValue
                        label="Size"
                        value={formatBytes(artifact.artifact_data.total_size)}
                      />
                    )}
                    {artifact.artifact_data.value !== undefined && (
                      <ArtifactValue
                        label="Value"
                        value={JSON.stringify(artifact.artifact_data.value)}
                      />
                    )}
                    {artifact.artifact_data.is_dir && (
                      <ArtifactValue label="Type" value="Directory" />
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">
              No output artifacts available
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Artifacts;
