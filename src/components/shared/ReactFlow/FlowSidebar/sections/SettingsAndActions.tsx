import { useNavigate } from "@tanstack/react-router";
import { FileDownIcon, FileUpIcon, Save, SaveAll } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PipelineNameDialog } from "@/components/shared/Dialogs";
import ImportPipeline from "@/components/shared/ImportPipeline";
import { InlineStack } from "@/components/ui/layout";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { EDITOR_PATH } from "@/routes/router";
import { getPipelineFile, useSavePipeline } from "@/services/pipelineService";
import { componentSpecToYaml } from "@/utils/componentStore";
import { formatRelativeTime } from "@/utils/date";

const SettingsAndActions = ({ isOpen }: { isOpen: boolean }) => {
  const { componentSpec, autoSaveStatus } = useComponentSpec();
  const { savePipeline } = useSavePipeline(componentSpec);
  const notify = useToastNotification();
  const navigate = useNavigate();

  const [onLoadLastSavedAt, setOnLoadLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    const fetchLastSaved = async () => {
      if (componentSpec?.name) {
        const lastSavedPipeline = await getPipelineFile(componentSpec.name);
        setOnLoadLastSavedAt(lastSavedPipeline?.modificationTime ?? null);
      }
    };
    fetchLastSaved();
  }, [componentSpec?.name]);

  const notifyPipelineSaved = (name: string) => {
    notify(`Pipeline saved as "${name}"`, "success");
  };

  const handleSavePipeline = async () => {
    await savePipeline();
    setOnLoadLastSavedAt(new Date());
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
      return componentSpecToYaml(componentSpecRef.current);
    } catch (err) {
      console.error("Error preparing pipeline for export:", err);
      return componentSpecRef.current
        ? componentSpecToYaml(componentSpecRef.current)
        : "";
    }
  }, [componentSpecRef.current]);

  const componentTextBlob = new Blob([componentText], { type: "text/yaml" });
  const filename = componentSpec?.name
    ? `${componentSpec.name}.pipeline.component.yaml`
    : "pipeline.component.yaml";

  const tooltipPosition = isOpen ? "top" : "right";

  const getAutoSaveStatusText = () => {
    if (autoSaveStatus.isSaving) {
      return "Saving...";
    }
    if (autoSaveStatus.lastSavedAt || onLoadLastSavedAt) {
      return `Last saved ${formatRelativeTime(
        autoSaveStatus.lastSavedAt ?? onLoadLastSavedAt,
      )}`;
    }
    return "All changes saved";
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Pipeline Actions</SidebarGroupLabel>
      <SidebarContent>
        <InlineStack blockAlign="center" className="ml-2" gap="1">
          {autoSaveStatus.isSaving && <Spinner size={16} />}
          <span className="text-xs text-muted-foreground">
            {getAutoSaveStatusText()}
          </span>
        </InlineStack>
      </SidebarContent>
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
                <FileDownIcon className="w-5! h-5!" strokeWidth={1.5} />
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
                  <FileUpIcon className="w-5! h-5!" strokeWidth={1.5} />
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
