import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@xyflow/react";
import { ChevronDown, Download, Import, Save, SaveAll } from "lucide-react";
import { useMemo } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { ComponentSpec } from "@/componentSpec";
import { componentSpecToYaml } from "@/componentStore";
import useToastNotification from "@/hooks/useToastNotification";
import { EDITOR_PATH } from "@/router";
import { updateComponentSpecFromNodes } from "@/utils/updateComponentSpecFromNodes";
import useSavePipeline from "@/utils/useSavePipeline";

import ImportPipeline from "../../ImportPipeline";
import { PipelineNameDialog } from "../../shared/PipelineNameDialog";
import { Button } from "../../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";

interface SettingsAndActionsProps {
  componentSpec: ComponentSpec;
}

const SettingsAndActions = ({ componentSpec }: SettingsAndActionsProps) => {
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
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger>
            Settings & Actions
            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSavePipeline}
                  className="cursor-pointer"
                >
                  <Save />
                  <span>Save</span>
                </SidebarMenuButton>
                <PipelineNameDialog
                  trigger={
                    <SidebarMenuButton className="cursor-pointer">
                      <SaveAll />
                      <span>Save as</span>
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
                    <Download />
                    <span>Export</span>
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
                        <span className="font-normal">Import</span>
                      </Button>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

export default SettingsAndActions;
