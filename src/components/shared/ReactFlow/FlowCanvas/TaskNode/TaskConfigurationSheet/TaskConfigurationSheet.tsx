import {
  AmphoraIcon,
  FilePenLineIcon,
  InfoIcon,
  LogsIcon,
  Parentheses,
} from "lucide-react";
import { type ReactNode } from "react";

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
import { useTaskNode } from "@/providers/TaskNodeProvider";
import { TOP_NAV_HEIGHT } from "@/utils/constants";

import { AnnotationsSection } from "../AnnotationsEditor/AnnotationsSection";
import ArgumentsSection from "../ArgumentsEditor/ArgumentsSection";
import Io from "./io";
import Logs from "./logs";
import OutputsList from "./OutputsList";

interface ButtonPropsWithTooltip extends ButtonProps {
  tooltip?: string;
}
interface TaskConfigurationSheetProps {
  trigger?: ReactNode;
  actions?: ButtonPropsWithTooltip[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  focusedIo?: boolean;
}

const TaskConfigurationSheet = ({
  trigger,
  actions,
  isOpen,
  onOpenChange,
  focusedIo,
}: TaskConfigurationSheetProps) => {
  const { name, taskSpec, taskId, state, callbacks } = useTaskNode();

  const { readOnly, runStatus } = state;
  const disabled = !!runStatus;

  const sheetHeight = window.innerHeight - TOP_NAV_HEIGHT;

  const onFullscreenChange = (isFullscreen: boolean) => {
    if (isFullscreen) {
      onOpenChange(false);
    }
  };

  const componentSpec = taskSpec.componentRef.spec;

  if (!componentSpec) {
    console.error(
      "TaskConfigurationSheet called with missing taskSpec.componentRef.spec",
    );
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="!w-[528px] !max-w-[528px] shadow-none"
        style={{
          top: TOP_NAV_HEIGHT + "px",
          height: sheetHeight + "px",
        }}
        overlay={false}
      >
        <SheetHeader className="pb-0">
          <SheetTitle>{name}</SheetTitle>
          <SheetDescription className="hidden">
            {name} configuration sheet
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
                      <TaskImplementation
                        key="task-implementation"
                        displayName={name}
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
      </SheetContent>
    </Sheet>
  );
};

export default TaskConfigurationSheet;
