import type { Content } from "@radix-ui/react-dialog";
import { ArrowDownToLine, Box, InfoIcon, Terminal } from "lucide-react";
import { type ComponentProps, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TaskSpec } from "@/componentSpec";
import { cn } from "@/lib/utils";

import Artifacts from "./artifacts";
import Info from "./info";
import Io from "./io";
import Logs from "./logs";

interface TaskDetailsSheetProps {
  taskSpec: TaskSpec;
  taskId: string;
  runStatus?: string;
}

const TaskDetailsSheet = ({
  taskSpec,
  taskId,
  runStatus,
}: TaskDetailsSheetProps) => {
  const [activeTab, setActiveTab] = useState("info");

  const handleInteractOutside: ComponentProps<
    typeof Content
  >["onInteractOutside"] = (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-slot="sheet-trigger"]')) {
      return;
    }
    event.preventDefault();
  };

  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          disabled={!runStatus}
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
          <SheetTitle>Task Details - {taskId}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          <Tabs defaultValue="info" onValueChange={setActiveTab}>
            <TabsList className="mb-2">
              <TabsTrigger value="info">
                <InfoIcon className="w-4 h-4 mr-2" />
                Info
              </TabsTrigger>
              <TabsTrigger value="io">
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Inputs/Outputs
              </TabsTrigger>
              <TabsTrigger value="artifacts">
                <Box className="w-4 h-4 mr-2" />
                Artifacts
              </TabsTrigger>
              <TabsTrigger value="logs">
                <Terminal className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <Info taskSpec={taskSpec} runStatus={runStatus} taskId={taskId} />
            </TabsContent>
            <TabsContent value="io">
              <Io taskSpec={taskSpec} />
            </TabsContent>
            <TabsContent value="artifacts">
              <Artifacts executionId={taskSpec.annotations?.executionId as string} />
            </TabsContent>
            <TabsContent value="logs">
              <Logs />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailsSheet;
