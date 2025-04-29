import { ArrowDownToLine, InfoIcon, Terminal } from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TaskSpec } from "@/utils/componentSpec";

import Info from "./info";
import Io from "./io";
import Logs from "./logs";

interface TaskDetailsSheetProps {
  taskSpec: TaskSpec;
  taskId: string;
  runStatus?: string;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailsSheet = ({
  taskSpec,
  taskId,
  runStatus,
  isOpen,
  onClose,
}: TaskDetailsSheetProps) => {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className={cn(
          "!max-w-none overflow-y-auto mt-[56px] h-[calc(100vh-56px)] transition-[width] duration-150",
          activeTab === "logs" ? "!w-[50%]" : "!w-[33.333333%]",
        )}
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
              <TabsTrigger value="logs">
                <Terminal className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <Info taskSpec={taskSpec} runStatus={runStatus} taskId={taskId} />
            </TabsContent>
            <TabsContent value="io">
              <Io
                taskSpec={taskSpec}
                executionId={taskSpec.annotations?.executionId as string}
              />
            </TabsContent>
            <TabsContent value="logs">
              <Logs executionId={taskSpec.annotations?.executionId as string} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailsSheet;
