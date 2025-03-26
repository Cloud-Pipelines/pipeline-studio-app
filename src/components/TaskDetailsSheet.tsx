import type { Content } from "@radix-ui/react-dialog";
import { ArrowDownToLine, InfoIcon } from "lucide-react";
import { type ComponentProps } from "react";

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
          "!max-w-none overflow-y-auto mt-[56px] h-[calc(100vh-56px)]",
          "!w-[33.333333%]",
        )}
        onInteractOutside={handleInteractOutside}
      >
        <SheetHeader>
          <SheetTitle>Task Details - {taskId}</SheetTitle>
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
            </TabsList>
            <TabsContent value="info">
              <div className="space-y-4">
                <section>
                  <h4 className="text-sm font-medium mb-2">Basic Info</h4>
                  <div className="border rounded-md divide-y">
                    <div className="flex items-center px-3 py-1.5">
                      <div className="w-36 text-sm text-gray-500">Name</div>
                      <div className="text-sm">
                        {taskSpec.componentRef.spec?.name}
                      </div>
                    </div>
                    <div className="flex items-center px-3 py-1.5">
                      <div className="w-36 text-sm text-gray-500">Status</div>
                      <div className="text-sm">
                        {runStatus || "Not started"}
                      </div>
                    </div>
                    <div className="flex items-center px-3 py-1.5">
                      <div className="w-36 text-sm text-gray-500">Task ID</div>
                      <div className="text-sm">{taskId}</div>
                    </div>
                    {taskSpec.componentRef.url && (
                      <div className="flex items-center px-3 py-1.5">
                        <div className="w-36 text-sm text-gray-500">URL</div>
                        <div className="text-sm font-mono break-all">
                          {taskSpec.componentRef.url}
                        </div>
                      </div>
                    )}
                    {taskSpec.componentRef.digest && (
                      <div className="flex items-center px-3 py-1.5">
                        <div className="w-36 text-sm text-gray-500">Digest</div>
                        <div className="text-sm font-mono break-all">
                          {taskSpec.componentRef.digest}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {taskSpec.componentRef.spec?.description && (
                  <section>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <div className="border rounded-md">
                      <div className="text-sm p-3">
                        {taskSpec.componentRef.spec.description}
                      </div>
                    </div>
                  </section>
                )}

                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Task Specification</h4>
                  </div>
                  <div className="border rounded-md">
                    <pre className="text-xs p-3 overflow-x-auto">
                      {JSON.stringify(taskSpec.componentRef, null, 2)}
                    </pre>
                  </div>
                </section>
              </div>
            </TabsContent>
            <TabsContent value="io">
              <div className="space-y-4">
                <section>
                  <h4 className="text-sm font-medium mb-2">Inputs</h4>
                  <div className="border rounded-md divide-y">
                    {taskSpec.componentRef.spec?.inputs?.map((input) => (
                      <div key={input.name} className="px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {input.name}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {input.type?.toString()}
                            </span>
                          </div>
                        </div>
                        {input.description && (
                          <div className="text-xs text-gray-500 mb-1">
                            {input.description}
                          </div>
                        )}
                        <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                          {JSON.stringify(taskSpec.arguments?.[input.name]) ||
                            "No value set"}
                        </div>
                      </div>
                    ))}
                    {!taskSpec.componentRef.spec?.inputs?.length && (
                      <div className="p-2 text-sm text-gray-500">
                        No inputs defined
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-medium mb-2">Outputs</h4>
                  <div className="border rounded-md divide-y">
                    {taskSpec.componentRef.spec?.outputs?.map((output) => (
                      <div key={output.name} className="px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {output.name}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {output.type?.toString()}
                            </span>
                          </div>
                        </div>
                        {output.description && (
                          <div className="text-xs text-gray-500">
                            {output.description}
                          </div>
                        )}
                      </div>
                    ))}
                    {!taskSpec.componentRef.spec?.outputs?.length && (
                      <div className="p-2 text-sm text-gray-500">
                        No outputs defined
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskDetailsSheet;
