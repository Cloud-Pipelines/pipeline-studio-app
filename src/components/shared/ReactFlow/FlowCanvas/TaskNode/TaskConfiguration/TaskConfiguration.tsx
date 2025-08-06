import {
  AmphoraIcon,
  FilePenLineIcon,
  InfoIcon,
  LogsIcon,
  Parentheses,
} from "lucide-react";

import { ComponentFavoriteToggle } from "@/components/shared/FavoriteComponentToggle";
import { StatusIcon } from "@/components/shared/Status";
import {
  TaskDetails,
  TaskImplementation,
} from "@/components/shared/TaskDetails";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type TaskNodeContextType } from "@/providers/TaskNodeProvider";

import { AnnotationsSection } from "../AnnotationsEditor/AnnotationsSection";
import ArgumentsSection from "../ArgumentsEditor/ArgumentsSection";
import Io from "./io";
import Logs from "./logs";
import OutputsList from "./OutputsList";

interface ButtonPropsWithTooltip extends ButtonProps {
  tooltip?: string;
}
interface TaskConfigurationProps {
  taskNode: TaskNodeContextType;
  actions?: ButtonPropsWithTooltip[];
}

const TaskConfiguration = ({ taskNode, actions }: TaskConfigurationProps) => {
  const { name, taskSpec, taskId, state, callbacks } = taskNode;

  const { readOnly, runStatus } = state;
  const disabled = !!runStatus;

  const componentSpec = taskSpec.componentRef.spec;

  if (!componentSpec) {
    console.error(
      "TaskConfiguration called with missing taskSpec.componentRef.spec",
    );
    return null;
  }

  return (
    <div
      className="flex flex-col h-full"
      data-context-panel="task-configuration"
    >
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

            {readOnly && (
              <TabsTrigger value="logs" className="flex-1">
                <LogsIcon className="h-4 w-4" />
                Logs
              </TabsTrigger>
            )}
            {!readOnly && (
              <TabsTrigger value="annotations" className="flex-1">
                <FilePenLineIcon className="h-4 w-4" />
                Annotations
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="details" className="h-full">
            <TaskDetails
              displayName={name}
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
                <Tooltip key={action.tooltip}>
                  <TooltipTrigger asChild>
                    <Button {...action} />
                  </TooltipTrigger>
                  <TooltipContent>{action.tooltip}</TooltipContent>
                </Tooltip>
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
              <Io
                taskSpec={taskSpec}
                readOnly={readOnly}
                executionId={taskSpec.annotations?.executionId as string}
              />
            )}
          </TabsContent>
          {readOnly && (
            <TabsContent value="logs" className="h-full">
              <Logs
                executionId={taskSpec.annotations?.executionId as string}
                status={runStatus}
              />
            </TabsContent>
          )}
          {!readOnly && (
            <TabsContent value="annotations">
              <p className="text-sm text-muted-foreground mb-2">
                Configure task annotations, resources and custom data.
              </p>
              <AnnotationsSection
                taskSpec={taskSpec}
                onApply={callbacks.setAnnotations}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default TaskConfiguration;
