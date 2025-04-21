import { useQueryClient } from "@tanstack/react-query";
import { File, Trash2 } from "lucide-react";
import { type DragEvent, useCallback, useMemo } from "react";

import { ConfirmationDialog } from "@/components/shared/Dialogs";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ComponentReference, ComponentSpec } from "@/utils/componentSpec";
import { deleteComponentFileFromList } from "@/utils/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";
import { containsSearchTerm } from "@/utils/searchUtils";

interface UserComponentItemProps {
  url: string;
  fileName: string;
  componentSpec: ComponentSpec;
  componentDigest: string;
  componentText: string;
  displayName: string;
  searchTerm?: string;
}

const UserComponentItem = ({
  url,
  fileName,
  componentSpec,
  componentDigest,
  componentText,
  displayName,
  searchTerm = "",
}: UserComponentItemProps) => {
  const queryClient = useQueryClient();

  const onDragStart = useCallback(
    (event: DragEvent) => {
      const componentRef: ComponentReference = {
        url,
        spec: componentSpec,
        digest: componentDigest,
        text: componentText,
      };

      const taskSpec = {
        componentRef,
      };

      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify({ task: taskSpec }),
      );

      event.dataTransfer.setData(
        "DragStart.offset",
        JSON.stringify({
          offsetX: event.nativeEvent.offsetX,
          offsetY: event.nativeEvent.offsetY,
        }),
      );

      event.dataTransfer.effectAllowed = "move";
    },
    [url, componentSpec, componentDigest, componentText],
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteComponentFileFromList(USER_COMPONENTS_LIST_NAME, fileName);
      queryClient.invalidateQueries({ queryKey: ["userComponents"] });
    } catch (error) {
      console.error("Error deleting component:", error);
    }
  }, [fileName, queryClient]);

  const tooltipContent = useMemo(() => {
    let content = displayName;

    if (componentSpec?.description) {
      content += `\n\nDescription: ${componentSpec.description}`;
    }

    if (componentSpec?.inputs?.length) {
      content += `\n\nInputs: ${componentSpec.inputs
        .map(
          (input) =>
            `${input.name}${input.description ? ` - ${input.description}` : ""}`,
        )
        .join(", ")}`;
    }

    if (componentSpec?.outputs?.length) {
      content += `\n\nOutputs: ${componentSpec.outputs
        .map(
          (output) =>
            `${output.name}${output.description ? ` - ${output.description}` : ""}`,
        )
        .join(", ")}`;
    }

    return content;
  }, [displayName, componentSpec]);

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;

    // Check component name (most common case)
    if (containsSearchTerm(displayName, searchTerm)) return true;

    // Check component description
    if (
      componentSpec?.description &&
      containsSearchTerm(componentSpec.description, searchTerm)
    ) {
      return true;
    }

    // Check inputs and outputs
    const inputMatches = componentSpec?.inputs?.some(
      (input) =>
        containsSearchTerm(input.name, searchTerm) ||
        (input.description &&
          containsSearchTerm(input.description, searchTerm)),
    );

    if (inputMatches) return true;

    const outputMatches = componentSpec?.outputs?.some(
      (output) =>
        containsSearchTerm(output.name, searchTerm) ||
        (output.description &&
          containsSearchTerm(output.description, searchTerm)),
    );

    if (outputMatches) return true;

    // Check URL and filename
    if (containsSearchTerm(url, searchTerm)) return true;
    if (containsSearchTerm(fileName, searchTerm)) return true;

    return false;
  }, [searchTerm, displayName, componentSpec, url, fileName]);

  if (searchTerm && !matchesSearch) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={2000}>
        <TooltipTrigger asChild>
          <SidebarMenuItem
            className="cursor-grab hover:bg-gray-100 active:bg-gray-200 pl-2 py-1.5 group flex justify-between relative"
            draggable
            onDragStart={onDragStart}
          >
            <div className="flex items-center gap-2">
              <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate text-xs text-gray-800">
                {displayName}
              </span>
            </div>

            <ConfirmationDialog
              trigger={
                <div className="cursor-pointer mr-[15px]">
                  <Trash2 className="size-4 text-red-500" />
                </div>
              }
              title="Delete component"
              description="Are you sure you want to delete this component?"
              onConfirm={handleDelete}
            />
          </SidebarMenuItem>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs whitespace-pre-wrap">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserComponentItem;
