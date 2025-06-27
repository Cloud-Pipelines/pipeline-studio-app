import GoogleCloudSubmissionDialog from "@/components/shared/Submitters/GoogleCloud/GoogleCloudSubmissionDialog";
import OasisSubmitter from "@/components/shared/Submitters/Oasis/OasisSubmitter";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import useLoadPipelineRuns from "@/hooks/useLoadPipelineRuns";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

const RunsAndSubmission = ({ isOpen }: { isOpen: boolean }) => {
  const { componentSpec } = useComponentSpec();

  const { refetch } = useLoadPipelineRuns(componentSpec.name || "");

  if (!isOpen) {
    return (
      <>
        <hr />
        <SidebarGroupContent className="mx-2! my-2!">
          <SidebarMenu>
            <SidebarMenuItem>
              <OasisSubmitter
                componentSpec={componentSpec}
                onSubmitComplete={refetch}
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <GoogleCloudSubmissionDialog componentSpec={componentSpec} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Runs & Submissions</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <OasisSubmitter
              componentSpec={componentSpec}
              onSubmitComplete={refetch}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <SidebarGroupContent
        className={cn({
          hidden: !isOpen,
          "mt-2": true,
        })}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <GoogleCloudSubmissionDialog componentSpec={componentSpec} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default RunsAndSubmission;
