import { Info } from "lucide-react";
import { type ReactNode } from "react";

import type { ArgumentType, TaskSpec } from "../../componentSpec";
import ArgumentsSection from "../ArgumentsEditor/ArgumentsSection";
import CondensedUrl from "../CondensedUrl";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

interface TaskNodeConfigurationSheetProps {
  trigger: ReactNode;
  taskSpec: TaskSpec;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  setArguments?: (args: Record<string, ArgumentType>) => void;
  disabled?: boolean;
}

const TaskNodeConfigurationSheet = ({
  trigger,
  taskSpec,
  isOpen,
  onOpenChange,
  setArguments,
  disabled = false,
}: TaskNodeConfigurationSheetProps) => {
  const componentSpec = taskSpec.componentRef.spec;

  if (componentSpec === undefined) {
    console.error(
      "ArgumentsEditor called with missing taskSpec.componentRef.spec",
      taskSpec,
    );
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-fit !max-w-fit top-[56px] shadow-none"
        style={{ height: window.innerHeight - 56 - 30 + "px" }}
        overlay={false}
      >
        <SheetHeader>
          <SheetTitle>
            <div className="flex gap-2">
              <Info />
              {componentSpec.name ?? "<component>"}
            </div>
          </SheetTitle>
          <SheetDescription>Information about this Task Node</SheetDescription>
          {taskSpec.componentRef.url && (
            <div className="flex gap-2 text-sidebar-primary">
              Source:
              <CondensedUrl url={taskSpec.componentRef.url} />
            </div>
          )}
        </SheetHeader>
        <div className="flex flex-col overflow-y-auto px-4 gap-4">
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="secondary">Validate Node</Button>
              <Button variant="secondary">Some other action</Button>
              <Button variant="secondary">Duplicate</Button>
              <Button variant="destructive">Delete</Button>
            </div>
          </div>
          <div>
            <h2>Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure this task node.
            </p>
            <div>[some settings]</div>
            <hr className="my-2" />
          </div>
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
            <hr className="my-2" />
          </div>
          <div>
            <h2>Outputs</h2>
            <p className="text-sm text-muted-foreground">
              View the output schema for this task node.
            </p>
            <div>[some data]</div>
          </div>
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

export default TaskNodeConfigurationSheet;
