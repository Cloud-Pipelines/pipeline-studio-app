import GoogleCloudSubmissionDialog from "@/components/shared/Submitters/GoogleCloud/GoogleCloudSubmissionDialog";
import OasisSubmitter from "@/components/shared/Submitters/Oasis/OasisSubmitter";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

const RunsAndSubmission = ({ isOpen }: { isOpen: boolean }) => {
  const { componentSpec } = useComponentSpec();

  const showGoogleSubmitter =
    import.meta.env.VITE_ENABLE_GOOGLE_CLOUD_SUBMITTER === "true";

  if (!isOpen) {
    return (
      <>
        <hr />
        <SidebarGroupContent className="mx-2! my-2!">
          <SidebarMenu>
            <SidebarMenuItem>
              <OasisSubmitter componentSpec={componentSpec} />
            </SidebarMenuItem>
            {showGoogleSubmitter && (
              <SidebarMenuItem>
                <GoogleCloudSubmissionDialog componentSpec={componentSpec} />
              </SidebarMenuItem>
            )}
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
            <OasisSubmitter componentSpec={componentSpec} />
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
          {showGoogleSubmitter && (
            <SidebarMenuItem>
              <GoogleCloudSubmissionDialog componentSpec={componentSpec} />
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default RunsAndSubmission;
