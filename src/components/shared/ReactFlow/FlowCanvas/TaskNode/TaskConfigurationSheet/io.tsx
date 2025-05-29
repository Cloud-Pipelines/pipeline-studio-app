import { useQuery } from "@tanstack/react-query";

import type { GetArtifactsApiExecutionsIdArtifactsGetResponse } from "@/api/types.gen";
import { cn } from "@/lib/utils";
import type { TaskSpec } from "@/utils/componentSpec";
import { API_URL } from "@/utils/constants";
import { formatBytes } from "@/utils/string";
import { convertGcsUrlToBrowserUrl } from "@/utils/URL";

import IoCell from "./ioCell";

interface IoProps {
  taskSpec: TaskSpec;
  executionId?: string | number;
  readOnly?: boolean;
}

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

const Io = ({ taskSpec, executionId, readOnly }: IoProps) => {
  const { data: artifacts, isLoading: isLoadingArtifacts } = useQuery({
    queryKey: ["artifacts", executionId],
    queryFn: () => getArtifacts(String(executionId)),
    enabled: !!executionId,
  });

  return (
    <div className="space-y-4">
      <div
        className={cn({
          "flex gap-2 flex-col": true,
          "flex-col-reverse": readOnly,
        })}
      >
        <section>
          <h3 className="text-base font-medium mb-1">Inputs</h3>
          <div className="flex flex-col gap-1">
            {taskSpec.componentRef.spec?.inputs?.map((input) => {
              const inputArtifact = artifacts?.input_artifacts?.[input.name];

              return (
                <IoCell key={input.name} io={input} artifacts={inputArtifact} />
              );
            })}
            {!taskSpec.componentRef.spec?.inputs?.length && (
              <div className="p-2 text-xs text-gray-500">No inputs defined</div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-base font-medium mb-1">Outputs</h3>
          <div className="flex flex-col gap-1">
            {taskSpec.componentRef.spec?.outputs?.map((output) => {
              const outputArtifact = artifacts?.output_artifacts?.[output.name];

              return (
                <IoCell
                  key={output.name}
                  io={output}
                  artifacts={outputArtifact}
                />
              );
            })}
            {!taskSpec.componentRef.spec?.outputs?.length && (
              <div className="p-2 text-xs text-gray-500">
                No outputs defined
              </div>
            )}
          </div>
        </section>
      </div>

      {executionId && artifacts && !isLoadingArtifacts && (
        <>
          {artifacts.input_artifacts &&
            Object.keys(artifacts.input_artifacts).length > 0 && (
              <>
                {Object.keys(artifacts.input_artifacts).some(
                  (key) =>
                    !taskSpec.componentRef.spec?.inputs?.some(
                      (input) => input.name === key,
                    ),
                ) && (
                  <section>
                    <h3 className="text-base font-medium mb-1">
                      Additional Input Artifacts
                    </h3>
                    <div className="border rounded-md divide-y">
                      {Object.entries(artifacts.input_artifacts)
                        .filter(
                          ([key]) =>
                            !taskSpec.componentRef.spec?.inputs?.some(
                              (input) => input.name === key,
                            ),
                        )
                        .map(([key, artifact]) => (
                          <div key={key} className="px-3 py-2">
                            <div className="flex items-center mb-0.5">
                              <span className="font-medium text-sm">{key}</span>
                              {artifact.type_name && (
                                <span className="ml-1.5 text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                                  Type: {artifact.type_name}
                                </span>
                              )}
                            </div>

                            {artifact.artifact_data && (
                              <div className="space-y-0.5">
                                {artifact.artifact_data.value !== undefined && (
                                  <div className="flex text-xs">
                                    <span className="text-gray-500 w-14 flex-shrink-0">
                                      Value:
                                    </span>
                                    <span className="font-mono break-all">
                                      {JSON.stringify(
                                        artifact.artifact_data.value,
                                      )}
                                    </span>
                                  </div>
                                )}

                                {artifact.artifact_data.uri && (
                                  <div className="flex text-xs">
                                    <span className="text-gray-500 w-14 flex-shrink-0">
                                      URI:
                                    </span>
                                    <a
                                      href={convertGcsUrlToBrowserUrl(
                                        artifact.artifact_data.uri,
                                        artifact.artifact_data.is_dir,
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono break-all text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {artifact.artifact_data.uri}
                                    </a>
                                  </div>
                                )}

                                {artifact.artifact_data.total_size && (
                                  <div className="flex text-xs">
                                    <span className="text-gray-500 w-14 flex-shrink-0">
                                      Size:
                                    </span>
                                    <span className="font-mono">
                                      {formatBytes(
                                        artifact.artifact_data.total_size,
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}

          {artifacts.output_artifacts &&
            Object.keys(artifacts.output_artifacts).length > 0 && (
              <>
                {Object.keys(artifacts.output_artifacts).some(
                  (key) =>
                    !taskSpec.componentRef.spec?.outputs?.some(
                      (output) => output.name === key,
                    ),
                ) && (
                  <section>
                    <h3 className="text-base font-medium mb-1">
                      Additional Output Artifacts
                    </h3>
                    <div className="border rounded-md divide-y">
                      {Object.entries(artifacts.output_artifacts)
                        .filter(
                          ([key]) =>
                            !taskSpec.componentRef.spec?.outputs?.some(
                              (output) => output.name === key,
                            ),
                        )
                        .map(([key, artifact]) => (
                          <div key={key} className="px-3 py-2">
                            <div className="flex items-center mb-0.5">
                              <span className="font-medium text-sm">{key}</span>
                              {artifact.type_name && (
                                <span className="ml-1.5 text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                                  Type: {artifact.type_name}
                                </span>
                              )}
                            </div>

                            {artifact.artifact_data && (
                              <div className="space-y-0.5">
                                {artifact.artifact_data.value !== undefined && (
                                  <div className="flex text-xs">
                                    <span className="text-gray-500 w-14 flex-shrink-0">
                                      Value:
                                    </span>
                                    <span className="font-mono break-all">
                                      {JSON.stringify(
                                        artifact.artifact_data.value,
                                      )}
                                    </span>
                                  </div>
                                )}

                                {artifact.artifact_data.uri && (
                                  <div className="flex text-xs">
                                    <span className="text-gray-500 w-14 flex-shrink-0">
                                      URI:
                                    </span>
                                    <a
                                      href={convertGcsUrlToBrowserUrl(
                                        artifact.artifact_data.uri,
                                        artifact.artifact_data.is_dir,
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono break-all text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {artifact.artifact_data.uri}
                                    </a>
                                  </div>
                                )}

                                {artifact.artifact_data.total_size && (
                                  <div className="flex text-xs">
                                    <span className="text-gray-500 w-14 flex-shrink-0">
                                      Size:
                                    </span>
                                    <span className="font-mono">
                                      {formatBytes(
                                        artifact.artifact_data.total_size,
                                      )}
                                    </span>
                                  </div>
                                )}

                                {artifact.artifact_data.is_dir && (
                                  <div className="flex text-xs">
                                    <span className="text-gray-500 w-14 flex-shrink-0">
                                      Type:
                                    </span>
                                    <span className="font-mono">Directory</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
        </>
      )}
    </div>
  );
};

export default Io;
