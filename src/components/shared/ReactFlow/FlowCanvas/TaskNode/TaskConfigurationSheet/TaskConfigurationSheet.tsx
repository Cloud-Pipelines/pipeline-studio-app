import { Code, InfoIcon, Parentheses } from "lucide-react";
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className={`!w-[512px] !max-w-[512px] shadow-none`}
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
              <TabsTrigger value="arguments" className="flex-1">
                <Parentheses className="w-4 h-4" />
                Arguments
              </TabsTrigger>
              <TabsTrigger value="implementation" className="flex-1">
                <Code className="h-4 w-4" />
                Implementation
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="h-full">
              <TaskDetails
                displayName={displayName}
                componentSpec={componentSpec}
                taskId={taskId}
                componentDigest={taskSpec.componentRef.digest}
                url={taskSpec.componentRef.url}
                onDelete={onDelete}
                hasDeletionConfirmation={false}
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
            <TabsContent value="arguments" className="h-full">
              <h2>Arguments</h2>
              <p className="text-sm text-muted-foreground">
                Configure the arguments for this task node.
              </p>
              <ArgumentsSection
                taskSpec={taskSpec}
                setArguments={setArguments}
                disabled={disabled}
              />
            </TabsContent>
            <TabsContent value="implementation" className="h-full">
              <TaskImplementation
                displayName={displayName}
                componentSpec={componentSpec}
              />
            </TabsContent>
          </Tabs>
        </div>
        <SheetFooter>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={disabled}
            variant="secondary"
            className="w-fit cursor-pointer"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TaskConfigurationSheet;
