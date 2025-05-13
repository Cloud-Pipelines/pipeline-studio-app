import {
  AmphoraIcon,
  Code,
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
  SheetFooter,
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
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";
import { TOP_NAV_HEIGHT } from "@/utils/constants";
import { getComponentName } from "@/utils/getComponentName";

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
  onDelete?: () => void;
  readOnly?: boolean;
  runStatus?: string;
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
  onDelete,
  readOnly = false,
  runStatus,
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
        <div className="flex flex-col px-4 gap-4 overflow-y-auto">
          <Tabs defaultValue="details">
            <TabsList className="mb-2">
              <TabsTrigger value="details" className="flex-1">
                <InfoIcon className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="io" className="flex-1">
                {readOnly ? (
                  <AmphoraIcon className="w-4 h-4" />
                ) : (
                  <Parentheses className="w-4 h-4" />
                )}
                {readOnly ? "Artifacts" : "Inputs/Outputs"}
              </TabsTrigger>
              <TabsTrigger value="Component YAML" className="flex-1">
                <Code className="h-4 w-4" />
                Component YAML
              </TabsTrigger>
              {readOnly && (
                <TabsTrigger value="logs" className="flex-1">
                  <LogsIcon className="h-4 w-4" />
                  Logs
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
              <h2>Arguments</h2>
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
                  executionId={taskSpec.annotations?.executionId as string}
                />
              )}
            </TabsContent>
            <TabsContent value="Component YAML" className="h-full">
              <TaskImplementation
                displayName={displayName}
                componentSpec={componentSpec}
                onFullscreenChange={onFullscreenChange}
              />
            </TabsContent>
            {readOnly && (
              <TabsContent value="logs">
                <Logs
                  executionId={taskSpec.annotations?.executionId as string}
                  onFullscreenChange={onFullscreenChange}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
        <SheetFooter>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={disabled}
            variant="secondary"
            className="w-fit"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskConfigurationSheet;
