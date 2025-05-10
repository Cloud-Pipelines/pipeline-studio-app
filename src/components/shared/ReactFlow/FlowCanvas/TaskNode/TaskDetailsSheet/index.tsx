import { ArrowDownToLine, InfoIcon, Terminal } from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TaskSpec } from "@/utils/componentSpec";
import { TOP_NAV_HEIGHT } from "@/utils/constants";

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

  const sheetHeight = window.innerHeight - TOP_NAV_HEIGHT;

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className={cn(
          "!max-w-none overflow-y-auto transition-[width] duration-150",
          activeTab === "logs" ? "!w-1/2" : "!w-1/3",
        )}
        style={{
          top: TOP_NAV_HEIGHT + "px",
          height: sheetHeight + "px",
        }}
      >
        <SheetHeader>
          <SheetTitle>Task Details - {taskId}</SheetTitle>
          <SheetDescription className="hidden">
            {taskId} task details sheet
          </SheetDescription>
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
