import {
  AmphoraIcon,
  FilePenLineIcon,
  InfoIcon,
  LogsIcon,
  Parentheses,
} from "lucide-react";

import type { TooltipButtonProps } from "@/components/shared/Buttons/TooltipButton";
import TooltipButton from "@/components/shared/Buttons/TooltipButton";
import { ComponentFavoriteToggle } from "@/components/shared/FavoriteComponentToggle";
import { StatusIcon } from "@/components/shared/Status";
import {
  TaskDetails,
  TaskImplementation,
} from "@/components/shared/TaskDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExecutionDataOptional } from "@/providers/ExecutionDataProvider";
import { type TaskNodeContextType } from "@/providers/TaskNodeProvider";
import { isGraphImplementation } from "@/utils/componentSpec";

import ArgumentsSection from "../ArgumentsEditor/ArgumentsSection";
import ConfigurationSection from "./ConfigurationSection";
import IOSection from "./IOSection/IOSection";
import Logs, { OpenLogsInNewWindowLink } from "./logs";
import OutputsList from "./OutputsList";

interface TaskOverviewProps {
  taskNode: TaskNodeContextType;
  actions?: TooltipButtonProps[];
}

const TaskOverview = ({ taskNode, actions }: TaskOverviewProps) => {
  const { name, taskSpec, taskId, state, callbacks } = taskNode;

  const executionData = useExecutionDataOptional();
  const details = executionData?.details;

  const { readOnly, runStatus } = state;
  const disabled = !!runStatus;

  if (!taskSpec || !taskId) {
    return null;
  }

  const componentSpec = taskSpec.componentRef.spec;

  if (!componentSpec) {
    console.error(
      "TaskOverview called with missing taskSpec.componentRef.spec",
    );
    return null;
  }

  const isSubgraph = isGraphImplementation(componentSpec.implementation);
  const executionId = details?.child_task_execution_ids?.[taskId];

  return (
    <div className="flex flex-col h-full" data-context-panel="task-overview">
      <div className="flex items-center gap-2 px-2 pb-2 font-semibold text-lg">
        {name} <ComponentFavoriteToggle component={taskSpec.componentRef} />
        {runStatus && <StatusIcon status={runStatus} tooltip label="task" />}
      </div>

      <div className="flex flex-col px-4 gap-4 overflow-y-auto pb-4 h-full">
        <Tabs defaultValue="io" className="h-full">
          <TabsList className="mb-2">
            <TabsTrigger value="io" className="flex-1">
              {readOnly ? (
                <AmphoraIcon className="w-4 h-4" />
              ) : (
                <Parentheses className="w-4 h-4" />
              )}
              {readOnly ? "Artifacts" : "Arguments"}
            </TabsTrigger>
            <TabsTrigger value="details" className="flex-1">
              <InfoIcon className="h-4 w-4" />
              Details
            </TabsTrigger>

            {readOnly && !isSubgraph && (
              <TabsTrigger value="logs" className="flex-1">
                <LogsIcon className="h-4 w-4" />
                Logs
              </TabsTrigger>
            )}
            {!readOnly && (
              <TabsTrigger value="configuration" className="flex-1">
                <FilePenLineIcon className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="details" className="h-full">
            <TaskDetails
              displayName={name}
              executionId={executionId}
              componentSpec={componentSpec}
              taskId={taskId}
              componentDigest={taskSpec.componentRef.digest}
              url={taskSpec.componentRef.url}
              onDelete={callbacks.onDelete}
              runStatus={runStatus}
              hasDeletionConfirmation={false}
              readOnly={readOnly}
              additionalSection={[
                {
                  title: "Component YAML",
                  isCollapsed: true,
                  component: (
                    <div className="h-[512px]">
                      <TaskImplementation
                        key="task-implementation"
                        displayName={name}
                        componentSpec={componentSpec}
                      />
                    </div>
                  ),
                },
              ]}
              actions={actions?.map((action) => (
                <TooltipButton {...action} key={action.tooltip?.toString()} />
              ))}
            />
          </TabsContent>
          <TabsContent value="io" className="h-full">
            {!readOnly && (
              <>
                <ArgumentsSection
                  taskSpec={taskSpec}
                  setArguments={callbacks.setArguments}
                  disabled={disabled}
                />
                <hr />
                <OutputsList taskSpec={taskSpec} />
              </>
            )}
            {readOnly && (
              <IOSection
                taskSpec={taskSpec}
                readOnly={readOnly}
                executionId={executionId}
              />
            )}
          </TabsContent>
          {readOnly && !isSubgraph && (
            <TabsContent value="logs" className="h-full">
              {!!executionId && (
                <div className="flex w-full justify-end pr-4">
                  <OpenLogsInNewWindowLink
                    executionId={executionId}
                    status={runStatus}
                  />
                </div>
              )}
              <Logs executionId={executionId} status={runStatus} />
            </TabsContent>
          )}
          {!readOnly && (
            <TabsContent value="configuration">
              <ConfigurationSection taskNode={taskNode} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default TaskOverview;
