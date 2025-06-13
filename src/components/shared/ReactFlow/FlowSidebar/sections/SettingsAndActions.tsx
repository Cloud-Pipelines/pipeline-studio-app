import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@xyflow/react";
import { CloudUpload, FolderDown, Save, SaveAll } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { PipelineNameDialog } from "@/components/shared/Dialogs";
import ImportPipeline from "@/components/shared/ImportPipeline";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { EDITOR_PATH } from "@/routes/router";
import { useSavePipeline } from "@/services/pipelineService";
import { componentSpecToYaml } from "@/utils/componentStore";
import { updateComponentSpecFromNodes } from "@/utils/nodes/updateComponentSpecFromNodes";

const SettingsAndActions = () => {
  const { componentSpec } = useComponentSpec();
  const { savePipeline } = useSavePipeline(componentSpec);
  const notify = useToastNotification();
  const navigate = useNavigate();
  const nodes = useStore((store) => store.nodes);

  const notifyPipelineSaved = (name: string) => {
    notify(`Pipeline saved as "${name}"`, "success");
  };

  const handleSavePipeline = async () => {
    await savePipeline();
    notifyPipelineSaved(componentSpec?.name ?? "Untitled Pipeline");
  };

  const handleSavePipelineAs = async (name: string) => {
    await savePipeline(name);
    notifyPipelineSaved(name);

    navigate({
      to: `${EDITOR_PATH}/${encodeURIComponent(name)}`,
    });
  };

  const getInitialName = () => {
    return componentSpec?.name
      ? `${componentSpec.name} (Copy)`
      : `Untitled Pipeline ${new Date().toLocaleTimeString()}`;
  };

  const componentSpecRef = useRef(componentSpec);

  useEffect(() => {
    componentSpecRef.current = componentSpec;
  }, [componentSpec]);

  const componentText = useMemo(() => {
    try {
      if (!componentSpecRef.current || !nodes.length) {
        return "";
      }

      const cleanedSpec = updateComponentSpecFromNodes(
        componentSpecRef.current,
        nodes,
        false,
        true,
      );
      return componentSpecToYaml(cleanedSpec);
    } catch (err) {
      console.error("Error preparing pipeline for export:", err);
      return componentSpecRef.current
        ? componentSpecToYaml(componentSpecRef.current)
        : "";
    }
  }, [nodes]);

  const componentTextBlob = new Blob([componentText], { type: "text/yaml" });
  const filename = componentSpec?.name
    ? `${componentSpec.name}.pipeline.component.yaml`
    : "pipeline.component.yaml";

  return (
    <SidebarGroup className="pb-0">
      <SidebarGroupLabel asChild>
        <div className="flex items-center">
          <span className="font-medium text-sm">Pipeline Actions</span>
        </div>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="flex-row gap-2 text-foreground/75">
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={handleSavePipeline}
                  className="cursor-pointer"
                >
                  <Save className="w-5! h-5!" strokeWidth={1.5} />
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="top">Save Pipeline</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <PipelineNameDialog
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton className="cursor-pointer">
                      <SaveAll className="w-5! h-5!" strokeWidth={1.5} />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="top">Save-as Pipeline</TooltipContent>
                </Tooltip>
              }
              title="Save Pipeline As"
              description="Enter a name for your pipeline"
              initialName={getInitialName()}
              onSubmit={handleSavePipelineAs}
              submitButtonText="Save"
              submitButtonIcon={<SaveAll className="mr-2 h-4 w-4" />}
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild className="cursor-pointer">
                  <a
                    href={URL.createObjectURL(componentTextBlob)}
                    download={filename}
                  >
                    <CloudUpload className="w-5! h-5!" strokeWidth={1.5} />
                  </a>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="top">Export Pipeline</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ImportPipeline
              triggerComponent={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start px-2!"
                      >
                        <FolderDown className="w-5! h-5!" strokeWidth={1.5} />
                      </Button>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="top">Import Pipeline</TooltipContent>
                </Tooltip>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SettingsAndActions;
