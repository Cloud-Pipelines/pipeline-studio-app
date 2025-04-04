import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import type { ComponentSpec } from "@/componentSpec";

import GraphComponents from "./sections/GraphComponents";
import RunsAndSubmission from "./sections/RunsAndSubmission";
import SettingsAndActions from "./sections/SettingsAndActions";

interface FlowSidebarProps {
  componentSpec: ComponentSpec;
}

const FlowSidebar = ({ componentSpec }: FlowSidebarProps) => {
  return (
    <Sidebar side="right" className="mt-[56px] h-[calc(100vh-56px)]">
      <SidebarContent className="gap-0">
        <SettingsAndActions componentSpec={componentSpec} />
        <RunsAndSubmission componentSpec={componentSpec} />
        <GraphComponents />
      </SidebarContent>
    </Sidebar>
  );
};

export default FlowSidebar;
