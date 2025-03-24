import { InfoIcon, Terminal, ArrowDownToLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskSpec } from "@/componentSpec";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface ExecutionDetailsSheetProps {
  taskSpec: TaskSpec;
  taskId: string;
  runStatus?: string;
}

const ExecutionDetailsSheet = ({
  taskSpec,
  taskId,
  runStatus,
}: ExecutionDetailsSheetProps) => {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          disabled={!runStatus}
        >
          <InfoIcon className="w-3 h-3" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="!max-w-none !w-[33.333333%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Execution Details - {taskId}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          <Tabs defaultValue="info">
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
              <div>TBD</div>
              {/* <ScrollArea className="h-[500px] gap-4">
                <p className="text-sm">
                  <strong>Name:</strong> {taskSpec.componentRef.spec?.name}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong> {runStatus || "Not started"}
                </p>
                <p className="text-sm">
                  <strong>Task ID:</strong> {taskId}
                </p>
                {taskSpec.componentRef.url && (
                  <p className="text-sm">
                    <strong>URL:</strong>
                    <span className="block ml-4 break-all">
                      {taskSpec.componentRef.url}
                    </span>
                  </p>
                )}
                {taskSpec.componentRef.digest && (
                  <p className="text-sm">
                    <strong>Digest:</strong>
                    <span className="block ml-4 break-all font-mono text-xs">
                      {taskSpec.componentRef.digest}
                    </span>
                  </p>
                )}
                {taskSpec.componentRef.spec?.description && (
                  <p className="text-sm">
                    <strong>Description:</strong>
                    <span className="text-xs  whitespace-pre-wrap">
                      {taskSpec.componentRef.spec.description}
                    </span>
                  </p>
                )}
              </ScrollArea> */}
            </TabsContent>
            <TabsContent value="io">
              <div className="space-y-4 pr-4 pb-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Inputs</h4>
                  <div className="space-y-1">
                    {taskSpec.componentRef.spec?.inputs?.map((input) => (
                      <div
                        key={input.name}
                        className="border rounded p-2 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {input.name}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {input.type?.toString()}
                            </span>
                          </div>
                          {input.description && (
                            <span
                              className="text-xs text-gray-500"
                              title={input.description}
                            >
                              {input.description.length > 50
                                ? input.description.slice(0, 50) + "..."
                                : input.description}
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <code className="text-xs font-mono break-all bg-white p-1 rounded block">
                            {JSON.stringify(taskSpec.arguments?.[input.name]) ||
                              "No value set"}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Outputs</h4>
                  <div className="space-y-1">
                    {taskSpec.componentRef.spec?.outputs?.map((output) => (
                      <div
                        key={output.name}
                        className="border rounded p-2 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {output.name}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {output.type?.toString()}
                            </span>
                          </div>
                          {output.description && (
                            <span
                              className="text-xs text-gray-500"
                              title={output.description}
                            >
                              {output.description.length > 50
                                ? output.description.slice(0, 50) + "..."
                                : output.description}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="logs">
              <ScrollArea className="h-[500px]">
                <div className="font-mono text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">

                  Fetching logs... TBD IN ANOTHER PR
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ExecutionDetailsSheet;
