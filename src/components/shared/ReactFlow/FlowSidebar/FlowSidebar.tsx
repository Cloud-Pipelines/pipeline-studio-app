import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { AuthorizedUserProfile } from "../../GitHubAuth/AuthorizedUserProfile";
import { GitHubAuthButton } from "../../GitHubAuth/GitHubAuthButton";
import { isAuthorizationRequired } from "../../GitHubAuth/helpers";
import { useAwaitAuthorization } from "../../GitHubAuth/useAwaitAuthorization";
import GraphComponents from "./sections/GraphComponents";
import RunsAndSubmission from "./sections/RunsAndSubmission";
import SettingsAndActions from "./sections/SettingsAndActions";

const FlowSidebar = () => {
  const { isAuthorized } = useAwaitAuthorization();

  const [isOpen, setIsOpen] = useState(true);
  const requiresAuthorization = isAuthorizationRequired();

  const sidebarTriggerClasses = cn(
    "absolute top-[65px] z-1 transition-all duration-300 bg-white rounded-r-md shadow-md p-0.5 pr-1",
    isOpen ? "left-[255px]" : "left-[47px]",
  );

  const authorizationSectionMarkup = requiresAuthorization ? (
    <div className="p-4 max-w-md">
      {!isAuthorized && <GitHubAuthButton />}
      {isAuthorized && <AuthorizedUserProfile />}
    </div>
  ) : null;

  return (
    <>
      <div className={sidebarTriggerClasses}>
        <SidebarTrigger
          className="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      <Sidebar
        side="left"
        className="mt-[56px] h-[calc(100vh-56px)]"
        collapsible="icon"
      >
        <SidebarContent className="gap-0! m-0! p-0!">
          {authorizationSectionMarkup}
          <SettingsAndActions isOpen={isOpen} />
          <RunsAndSubmission isOpen={isOpen} />
          <GraphComponents isOpen={isOpen} />
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default FlowSidebar;
