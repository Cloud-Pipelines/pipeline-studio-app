import {
  AmphoraIcon,
  FilePenLineIcon,
  InfoIcon,
  LogsIcon,
  Parentheses,
} from "lucide-react";
import { type ReactNode } from "react";

import type { ContainerExecutionStatus } from "@/api/types.gen";
import {
  TaskDetails,
  TaskImplementation,
} from "@/components/shared/TaskDetails";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Annotations } from "@/types/annotations";
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";
import { TOP_NAV_HEIGHT } from "@/utils/constants";
import { getComponentName } from "@/utils/getComponentName";

import { AnnotationsEditor } from "../AnnotationsEditor/AnnotationsEditor";
import ArgumentsSection from "../ArgumentsEditor/ArgumentsSection";
import Io from "./io";
import Logs from "./logs";

interface ButtonPropsWithTooltip extends ButtonProps {
  tooltip?: string;
}
interface TaskConfigurationSheetProps {
  trigger?: ReactNode;
  taskId: string;
  taskSpec: TaskSpec;
  actions?: ButtonPropsWithTooltip[];
  isOpen: boolean;
  disabled?: boolean;
  onOpenChange: (isOpen: boolean) => void;
  setArguments: (args: Record<string, ArgumentType>) => void;
  setAnnotations: (annotations: Annotations) => void;
  onDelete?: () => void;
  readOnly?: boolean;
  runStatus?: ContainerExecutionStatus;
  focusedIo?: boolean;
}

const TaskConfigurationSheet = ({
  trigger,
  taskId,
  taskSpec,
  actions,
  isOpen,
  disabled = false,
  onOpenChange,
  setArguments,
  setAnnotations,
  onDelete,
  readOnly = false,
  runStatus,
  focusedIo,
}: TaskConfigurationSheetProps) => {
  const componentSpec = taskSpec.componentRef.spec;

  if (componentSpec === undefined) {
    console.error(
      "ArgumentsEditor called with missing taskSpec.componentRef.spec",
      taskSpec,
    );
    return null;
  }

  const sheetHeight = window.innerHeight - TOP_NAV_HEIGHT;

  const displayName = getComponentName(taskSpec.componentRef);

  const onFullscreenChange = (isFullscreen: boolean) => {
    if (isFullscreen) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className={`!w-[528px] !max-w-[528px] shadow-none`}
        style={{
          top: TOP_NAV_HEIGHT + "px",
          height: sheetHeight + "px",
        }}
        overlay={false}
      >
        <SheetHeader className="pb-0">
          <SheetTitle>{componentSpec.name ?? "<component>"}</SheetTitle>
          <SheetDescription className="hidden">
            {componentSpec.name} configuration sheet
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col px-4 gap-4 overflow-y-auto pb-4">
          <Tabs defaultValue={focusedIo || readOnly ? "io" : "details"}>
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
                displayName={displayName}
                componentSpec={componentSpec}
                taskId={taskId}
                componentDigest={taskSpec.componentRef.digest}
                url={taskSpec.componentRef.url}
                onDelete={onDelete}
                runStatus={runStatus}
                hasDeletionConfirmation={false}
                readOnly={readOnly}
                additionalSection={[
                  {
                    title: "Component YAML",
                    isCollapsed: true,
                    component: (
                      <TaskImplementation
                        key="task-implementation"
                        displayName={displayName}
                        componentSpec={componentSpec}
                        onFullscreenChange={onFullscreenChange}
                      />
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
                  <p className="text-sm text-muted-foreground">
                    Configure the arguments for this task node.
                  </p>
                  <ArgumentsSection
                    taskSpec={taskSpec}
                    setArguments={setArguments}
                    disabled={disabled}
                  />
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
              <TabsContent value="logs">
                <Logs
                  executionId={taskSpec.annotations?.executionId as string}
                  onFullscreenChange={onFullscreenChange}
                  status={runStatus}
                />
              </TabsContent>
            )}
            {!readOnly && (
              <TabsContent value="annotations">
                <p className="text-sm text-muted-foreground mb-2">
                  Configure task annotations and custom data.
                </p>
                <AnnotationsEditor
                  taskSpec={taskSpec}
                  onApply={setAnnotations}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskConfigurationSheet;
