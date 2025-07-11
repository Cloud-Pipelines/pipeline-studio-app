import { useLocation, useNavigate } from "@tanstack/react-router";
import { Edit3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { APP_ROUTES } from "@/routes/router";
import { renameComponentFileInList } from "@/utils/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import { PipelineNameDialog } from "../shared/Dialogs";

const RenamePipeline = () => {
  const { componentSpec } = useComponentSpec();
  const notify = useToastNotification();
  const navigate = useNavigate();

  const location = useLocation();
  const pathname = location.pathname;

  const title = componentSpec?.name;

  const isSubmitDisabled = (name: string) => {
    return name === title;
  };

  const handleTitleUpdate = async (name: string) => {
    if (!componentSpec) {
      notify("Update failed: ComponentSpec not found", "error");
      return;
    }

    await renameComponentFileInList(
      USER_PIPELINES_LIST_NAME,
      title ?? "",
      name,
      pathname,
    );

    const urlName = encodeURIComponent(name);
    const url = APP_ROUTES.PIPELINE_EDITOR.replace("$name", urlName);

    navigate({ to: url });
  };

  return (
    <PipelineNameDialog
      trigger={
        <Button variant="ghost">
          <Edit3 />
        </Button>
      }
      title="Name Pipeline"
      description="Unsaved pipeline changes will be lost."
      initialName={title ?? ""}
      onSubmit={handleTitleUpdate}
      submitButtonText="Update Title"
      isSubmitDisabled={isSubmitDisabled}
    />
  );
};

export default RenamePipeline;
