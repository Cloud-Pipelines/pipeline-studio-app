import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

import GraphComponents from "./sections/GraphComponents";
import RunsAndSubmission from "./sections/RunsAndSubmission";
import SettingsAndActions from "./sections/SettingsAndActions";

const FlowSidebar = () => {
  return (
    <Sidebar side="left" className="mt-[56px] h-[calc(100vh-56px)]">
      <SidebarContent className="gap-0">
        <SettingsAndActions />
        <RunsAndSubmission />
        <GraphComponents />
      </SidebarContent>
    </Sidebar>
  );
};

export default FlowSidebar;
