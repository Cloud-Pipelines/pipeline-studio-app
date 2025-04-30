import { Info } from "lucide-react";
import { type ReactNode } from "react";

import CondensedUrl from "@/components/shared/CondensedUrl";
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
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";
import { TOP_NAV_HEIGHT } from "@/utils/constants";

import ArgumentsSection from "../ArgumentsEditor/ArgumentsSection";

interface TaskConfigurationSheetProps {
  trigger?: ReactNode;
  taskId: string;
  taskSpec: TaskSpec;
  actions?: ButtonProps[];
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
        <SheetHeader>
          <SheetTitle>
            <div className="flex gap-2">
              <Info />
              {componentSpec.name ?? "<component>"}
            </div>
          </SheetTitle>
          <SheetDescription>id: {taskId}</SheetDescription>
          {taskSpec.componentRef.url && (
            <div className="flex gap-2 text-sidebar-primary text-sm">
              Source:
              <CondensedUrl url={taskSpec.componentRef.url} />
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex gap-2">
              {actions &&
                actions.map((action, index) => (
                  <Button key={index} {...action} />
                ))}
            </div>
          </div>
        </SheetHeader>
        <hr className="mx-4" />
        <div className="flex flex-col overflow-y-auto px-4 gap-4">
          <div>
            <h2>Arguments</h2>
            <p className="text-sm text-muted-foreground">
              Configure the arguments for this task node.
            </p>
            <ArgumentsSection
              taskSpec={taskSpec}
              setArguments={setArguments}
              disabled={disabled}
            />
          </div>
        </div>
        <hr className="mx-4" />
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
