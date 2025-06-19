import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@xyflow/react";
import { CloudUpload, FolderDown, Save, SaveAll } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { PipelineNameDialog } from "@/components/shared/Dialogs";
import ImportPipeline from "@/components/shared/ImportPipeline";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { EDITOR_PATH } from "@/routes/router";
import { useSavePipeline } from "@/services/pipelineService";
import { componentSpecToYaml } from "@/utils/componentStore";
import { updateComponentSpecFromNodes } from "@/utils/nodes/updateComponentSpecFromNodes";

const SettingsAndActions = ({ isOpen }: { isOpen: boolean }) => {
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

  const tooltipPosition = isOpen ? "top" : "right";
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Pipeline Actions</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu
          className={cn({
            "gap-2 text-foreground/75": true,
            "flex-row": isOpen,
            "flex-col": !isOpen,
          })}
        >
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Save Pipeline"
              forceTooltip
              tooltipPosition={tooltipPosition}
              onClick={handleSavePipeline}
              className="cursor-pointer"
            >
              <Save className="w-5! h-5!" strokeWidth={1.5} />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <PipelineNameDialog
              trigger={
                <SidebarMenuButton
                  tooltip="Save Pipeline As"
                  forceTooltip
                  tooltipPosition={tooltipPosition}
                  className="cursor-pointer"
                >
                  <SaveAll className="w-5! h-5!" strokeWidth={1.5} />
                </SidebarMenuButton>
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
            <SidebarMenuButton
              tooltip="Export Pipeline"
              forceTooltip
              tooltipPosition={tooltipPosition}
              asChild
              className="cursor-pointer"
            >
              <a
                href={URL.createObjectURL(componentTextBlob)}
                download={filename}
              >
                <CloudUpload className="w-5! h-5!" strokeWidth={1.5} />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ImportPipeline
              triggerComponent={
                <SidebarMenuButton
                  tooltip="Import Pipeline"
                  forceTooltip
                  tooltipPosition={tooltipPosition}
                  className="cursor-pointer"
                  asChild={!isOpen}
                >
                  <FolderDown className="w-5! h-5!" strokeWidth={1.5} />
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SettingsAndActions;
