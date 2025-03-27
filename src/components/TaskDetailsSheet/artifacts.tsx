import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import type { GetArtifactsApiExecutionsIdArtifactsGetResponse } from "@/api/types.gen";
import { type RunDetailParams, runDetailRoute } from "@/router";
import { API_URL, RUNS_BASE_PATH } from "@/utils/constants";

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

const ArtifactsInner = () => {
  const { id: executionId } = runDetailRoute.useParams() as RunDetailParams;
  const { data: artifacts, isLoading: isLoadingArtifacts } = useQuery({
    queryKey: ["artifacts", executionId],
    queryFn: () => getArtifacts(executionId),
    enabled: !!executionId,
  });

  if (isLoadingArtifacts) {
    return <div>Loading...</div>;
  }

  const inputArtifacts = artifacts?.input_artifacts;
  const outputArtifacts = artifacts?.output_artifacts;

  if (!inputArtifacts?.length && !outputArtifacts?.length) {
    return <div>No artifacts available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <section>
          <h4 className="text-sm font-medium mb-2">Input Artifacts</h4>
          <div className="border rounded-md divide-y">
            {inputArtifacts ? (
              Object.entries(inputArtifacts).map(([key, artifact]) => (
                <div key={key} className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{key}</span>
                      {artifact.type_name && (
                        <span className="text-xs text-gray-500">
                          {artifact.type_name}
                        </span>
                      )}
                    </div>
                    {artifact.producer_execution_id && (
                      <span className="text-xs text-gray-500">
                        From execution #{artifact.producer_execution_id}
                      </span>
                    )}
                  </div>
                  {artifact.artifact_data && (
                    <div className="space-y-1 text-sm">
                      {artifact.artifact_data.uri && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">URI:</span>
                          <span className="font-mono break-all">
                            {artifact.artifact_data.uri}
                          </span>
                        </div>
                      )}
                      {artifact.artifact_data.total_size && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">Size:</span>
                          <span>
                            {formatBytes(artifact.artifact_data.total_size)}
                          </span>
                        </div>
                      )}
                      {artifact.artifact_data.value !== undefined && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">Value:</span>
                          <span className="font-mono">
                            {JSON.stringify(artifact.artifact_data.value)}
                          </span>
                        </div>
                      )}
                      {artifact.artifact_data.is_dir && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">Type:</span>
                          <span>Directory</span>
                        </div>
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
            {outputArtifacts ? (
              Object.entries(outputArtifacts).map(([key, artifact]) => (
                <div key={key} className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{key}</span>
                      {artifact.type_name && (
                        <span className="text-xs text-gray-500">
                          {artifact.type_name}
                        </span>
                      )}
                    </div>
                    {artifact.producer_execution_id && (
                      <span className="text-xs text-gray-500">
                        From execution #{artifact.producer_execution_id}
                      </span>
                    )}
                  </div>
                  {artifact.artifact_data && (
                    <div className="space-y-1 text-sm">
                      {artifact.artifact_data.uri && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">URI:</span>
                          <span className="font-mono break-all">
                            {artifact.artifact_data.uri}
                          </span>
                        </div>
                      )}
                      {artifact.artifact_data.total_size && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">Size:</span>
                          <span>
                            {formatBytes(artifact.artifact_data.total_size)}
                          </span>
                        </div>
                      )}
                      {artifact.artifact_data.value !== undefined && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">Value:</span>
                          <span className="font-mono">
                            {JSON.stringify(artifact.artifact_data.value)}
                          </span>
                        </div>
                      )}
                      {artifact.artifact_data.is_dir && (
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 w-20">Type:</span>
                          <span>Directory</span>
                        </div>
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
    </div>
  );
};

const Artifacts = () => {
  const location = useLocation();

  const isRunDetailRoute = location.pathname.includes(RUNS_BASE_PATH);

  if (!isRunDetailRoute) {
    return null;
  }

  return <ArtifactsInner />;
};

export default Artifacts;
