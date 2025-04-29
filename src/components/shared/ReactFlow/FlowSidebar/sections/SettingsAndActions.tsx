import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@xyflow/react";
import { FileDown, Import, Save, SaveAll } from "lucide-react";
import { useMemo } from "react";

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
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { EDITOR_PATH } from "@/routes/router";
import { useSavePipeline } from "@/services/pipelineService";
import { componentSpecToYaml } from "@/utils/componentStore";
import { updateComponentSpecFromNodes } from "@/utils/nodes/updateComponentSpecFromNodes";

import { ImportComponent } from "../components";

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

  const componentText = useMemo(() => {
    try {
      if (!componentSpec || !nodes.length) {
        return "";
      }

      const cleanedSpec = updateComponentSpecFromNodes(
        componentSpec,
        nodes,
        false,
        true,
      );
      return componentSpecToYaml(cleanedSpec);
    } catch (err) {
      console.error("Error preparing pipeline for export:", err);
      return componentSpec ? componentSpecToYaml(componentSpec) : "";
    }
  }, [componentSpec, nodes]);

  const componentTextBlob = new Blob([componentText], { type: "text/yaml" });
  const filename = componentSpec?.name
    ? `${componentSpec.name}.pipeline.component.yaml`
    : "pipeline.component.yaml";

  return (
    <SidebarGroup className="pb-0">
      <SidebarGroupLabel asChild>
        <div className="flex items-center">
          <span className="font-medium text-sm">Settings & Actions</span>
        </div>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSavePipeline}
              className="cursor-pointer"
            >
              <Save />
              <span className="font-normal text-xs">Save</span>
            </SidebarMenuButton>
            <PipelineNameDialog
              trigger={
                <SidebarMenuButton className="cursor-pointer">
                  <SaveAll />
                  <span className="font-normal text-xs">Save as</span>
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
            <SidebarMenuButton asChild className="cursor-pointer">
              <a
                href={URL.createObjectURL(componentTextBlob)}
                download={filename}
              >
                <FileDown />
                <span className="font-normal text-xs">Export Pipeline</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ImportPipeline
              triggerComponent={
                <SidebarMenuButton asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start px-2! cursor-pointer"
                  >
                    <Import />
                    <span className="font-normal text-xs">Import Pipeline</span>
                  </Button>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>

          <ImportComponent />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SettingsAndActions;
