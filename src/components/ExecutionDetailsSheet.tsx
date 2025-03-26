import type { Content } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { ArrowDownToLine, InfoIcon, Terminal } from "lucide-react";
import { type ComponentProps, useState } from "react";

import type {
  GetArtifactsApiExecutionsIdArtifactsGetResponse,
  GetExecutionInfoResponse,
} from "@/api/types.gen";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { type RunDetailParams, runDetailRoute } from "@/router";
import { API_URL, RUNS_BASE_PATH } from "@/utils/constants";

const formatLogLine = (line: string) => {
  const timestampMatch = line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  if (!timestampMatch) return line;

  const timestamp = new Date(timestampMatch[0]);
  const content = line.slice(timestampMatch[0].length + 1);

  return (
    <div key={line} className="flex">
      <span className="text-gray-400 mr-4 select-none whitespace-nowrap shrink-0">
        {timestamp.toLocaleTimeString()}
      </span>
      <span className="break-all">{content}</span>
    </div>
  );
};

const LogDisplay = ({
  logs,
  isLoading,
}: {
  logs: {
    log_text: string;
  };
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!logs || !logs.log_text) {
    return <div>No logs available</div>;
  }

  const lines = logs.log_text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line: string, index: number) => (
        <div key={index}>{formatLogLine(line)}</div>
      ))}
    </div>
  );
};

const ExecutionDetailsSheetInner = () => {
  const { id: executionId } = runDetailRoute.useParams() as RunDetailParams;

  const { data: executionDetails, isLoading: isLoadingDetails } =
    useQuery<GetExecutionInfoResponse>({
      queryKey: ["execution_details", executionId],
      queryFn: async () => {
        if (!executionId) return null;
        const response = await fetch(
          `${API_URL}/api/executions/${executionId}/details`,
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch execution details: ${response.statusText}`,
          );
        }
        return response.json();
      },
      enabled: !!executionId,
    });

  const { data: artifacts, isLoading: isLoadingArtifacts } =
    useQuery<GetArtifactsApiExecutionsIdArtifactsGetResponse>({
      queryKey: ["artifacts", executionId],
      queryFn: async () => {
        if (!executionId) return null;
        const response = await fetch(
          `${API_URL}/api/executions/${executionId}/artifacts`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch artifacts: ${response.statusText}`);
        }
        return response.json();
      },
      enabled: !!executionId,
    });

  const {
    data: logs,
    isLoading: isLoadingLogs,
    refetch,
  } = useQuery({
    queryKey: ["logs", executionId],
    queryFn: async () => {
      if (!executionId) return null;
      const response = await fetch(
        `${API_URL}/api/executions/${executionId}/container_log`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!executionId,
  });

  const handleInteractOutside: ComponentProps<
    typeof Content
  >["onInteractOutside"] = (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-slot="sheet-trigger"]')) {
      return;
    }
    event.preventDefault();
  };

  const [activeTab, setActiveTab] = useState("info");

  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          data-slot="sheet-trigger"
        >
          <InfoIcon className="w-3 h-3" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className={cn(
          "!max-w-none overflow-y-auto mt-[56px] h-[calc(100vh-56px)] transition-[width] duration-150",
          activeTab === "logs" ? "!w-[50%]" : "!w-[33.333333%]",
        )}
        onInteractOutside={handleInteractOutside}
      >
        <SheetHeader>
          <SheetTitle>Execution Details - {executionId}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          <Tabs
            defaultValue="info"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="mb-2">
              <TabsTrigger value="info">
                <InfoIcon className="w-4 h-4 mr-2" />
                Info
              </TabsTrigger>
              <TabsTrigger value="io">
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Inputs/Outputs
              </TabsTrigger>
              <TabsTrigger value="logs">
                <Terminal className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <div className="space-y-4">
                <section>
                  <h4 className="text-sm font-medium mb-2">Basic Info</h4>
                  <div className="border rounded-md divide-y">
                    {isLoadingDetails ? (
                      <div className="p-2">Loading execution details...</div>
                    ) : executionDetails ? (
                      <>
                        <div className="flex items-center px-3 py-1.5">
                          <div className="w-36 text-sm text-gray-500">
                            Execution ID
                          </div>
                          <div className="text-sm">{executionDetails.id}</div>
                        </div>
                        <div className="flex items-center px-3 py-1.5">
                          <div className="w-36 text-sm text-gray-500">
                            Status
                          </div>
                          <div className="text-sm">Not started</div>
                        </div>
                        <div className="flex items-center px-3 py-1.5">
                          <div className="w-36 text-sm text-gray-500">
                            Task ID
                          </div>
                          <div className="text-sm">{executionId}</div>
                        </div>
                        {executionDetails.parent_execution_id && (
                          <div className="flex items-center px-3 py-1.5">
                            <div className="w-36 text-sm text-gray-500">
                              Parent Execution ID
                            </div>
                            <div className="text-sm">
                              {executionDetails.parent_execution_id}
                            </div>
                          </div>
                        )}
                        {Object.keys(executionDetails.child_task_execution_ids)
                          .length > 0 && (
                          <div className="flex px-3 py-1.5">
                            <div className="w-36 text-sm text-gray-500">
                              Child Tasks
                            </div>
                            <div className="flex-1">
                              {Object.entries(
                                executionDetails.child_task_execution_ids,
                              ).map(([name, id]) => (
                                <div
                                  key={name}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-gray-700">{name}</span>
                                  <span className="text-gray-500">#{id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-2">No execution details available</div>
                    )}
                  </div>
                </section>

                {executionDetails?.task_spec && (
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">
                        Task Specification
                      </h4>
                      <div className="text-sm text-gray-500">
                        {executionDetails.task_spec.componentRef?.spec?.name}
                      </div>
                    </div>
                    <div className="border rounded-md">
                      <pre className="text-xs p-3 overflow-x-auto">
                        {JSON.stringify(executionDetails.task_spec, null, 2)}
                      </pre>
                    </div>
                  </section>
                )}
              </div>
            </TabsContent>
            <TabsContent value="io">
              <div className="space-y-4">
                <section>
                  <h4 className="text-sm font-medium mb-2">Input Artifacts</h4>
                  <div className="border rounded-md divide-y">
                    {isLoadingArtifacts ? (
                      <div className="p-2">Loading artifacts...</div>
                    ) : artifacts?.input_artifacts ? (
                      Object.entries(artifacts.input_artifacts).map(
                        ([key, artifact]) => (
                          <div key={key} className="px-3 py-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{key}</span>
                              <span className="text-xs text-gray-500">
                                {artifact.type_name}
                              </span>
                            </div>
                            {artifact.artifact_data && (
                              <div className="space-y-1 text-sm">
                                {artifact.artifact_data.uri && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      URI:
                                    </span>
                                    <span className="font-mono break-all">
                                      {artifact.artifact_data.uri}
                                    </span>
                                  </div>
                                )}
                                {artifact.artifact_data.total_size && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      Size:
                                    </span>
                                    <span>
                                      {formatBytes(
                                        artifact.artifact_data.total_size,
                                      )}
                                    </span>
                                  </div>
                                )}
                                {artifact.artifact_data.value !== undefined && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      Value:
                                    </span>
                                    <span className="font-mono">
                                      {JSON.stringify(
                                        artifact.artifact_data.value,
                                      )}
                                    </span>
                                  </div>
                                )}
                                {artifact.artifact_data.is_dir && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      Type:
                                    </span>
                                    <span>Directory</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ),
                      )
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
                    {isLoadingArtifacts ? (
                      <div className="p-2">Loading artifacts...</div>
                    ) : artifacts?.output_artifacts ? (
                      Object.entries(artifacts.output_artifacts).map(
                        ([key, artifact]) => (
                          <div key={key} className="px-3 py-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{key}</span>
                              <span className="text-xs text-gray-500">
                                {artifact.type_name}
                              </span>
                            </div>
                            {artifact.artifact_data && (
                              <div className="space-y-1 text-sm">
                                {artifact.artifact_data.uri && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      URI:
                                    </span>
                                    <span className="font-mono break-all">
                                      {artifact.artifact_data.uri}
                                    </span>
                                  </div>
                                )}
                                {artifact.artifact_data.total_size && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      Size:
                                    </span>
                                    <span>
                                      {formatBytes(
                                        artifact.artifact_data.total_size,
                                      )}
                                    </span>
                                  </div>
                                )}
                                {artifact.artifact_data.value !== undefined && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      Value:
                                    </span>
                                    <span className="font-mono">
                                      {JSON.stringify(
                                        artifact.artifact_data.value,
                                      )}
                                    </span>
                                  </div>
                                )}
                                {artifact.artifact_data.is_dir && (
                                  <div className="flex items-center text-xs">
                                    <span className="text-gray-500 w-20">
                                      Type:
                                    </span>
                                    <span>Directory</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ),
                      )
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        No output artifacts available
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="logs">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </div>
                <div className="font-mono text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  <LogDisplay logs={logs} isLoading={isLoadingLogs} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ExecutionDetailsSheet = () => {
  const location = useLocation();

  const isRunDetailRoute = location.pathname.includes(RUNS_BASE_PATH);

  if (!isRunDetailRoute) {
    return null;
  }
  return <ExecutionDetailsSheetInner />;
};

export default ExecutionDetailsSheet;
