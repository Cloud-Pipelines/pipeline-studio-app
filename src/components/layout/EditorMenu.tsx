import { useLocation, useNavigate } from "@tanstack/react-router";
import { Edit3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import useToastNotification from "@/hooks/useToastNotification";
import { APP_ROUTES, EDITOR_PATH, RUNS_BASE_PATH } from "@/routes/router";
import { renameComponentFileInList } from "@/utils/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import { PipelineNameDialog } from "../shared/Dialogs";

const EditorMenu = () => {
  const notify = useToastNotification();
  const navigate = useNavigate();

  const location = useLocation();
  const pathname = location.pathname;
  const { componentSpec, isLoading } = useLoadComponentSpecAndDetailsFromId();

  const isEditor = pathname.includes(EDITOR_PATH);
  const isRun = pathname.includes(RUNS_BASE_PATH);

  if (!isEditor && !isRun && !isLoading) {
    return null;
  }

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
    <div className="flex items-center gap-1">
      <span className="text-white text-sm font-bold">{title}</span>
      {isEditor && (
        <PipelineNameDialog
          trigger={
            <Button>
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
      )}
    </div>
  );
};

export default EditorMenu;
