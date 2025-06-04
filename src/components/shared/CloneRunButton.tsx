import { useLocation, useNavigate } from "@tanstack/react-router";
import { CopyIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { RUNS_BASE_PATH } from "@/routes/router";
import { copyRunToPipeline } from "@/services/pipelineRunService";

import { PipelineNameDialog } from "./Dialogs";

const CloneRunButtonInner = () => {
  const { componentSpec, isLoading: detailsLoading } =
    useLoadComponentSpecAndDetailsFromId();
  const navigate = useNavigate();

  const handleClone = async (name: string) => {
    if (!componentSpec) {
      console.error("No component spec found");
      return;
    }

    const result = await copyRunToPipeline(componentSpec, name);
    if (result?.url) {
      navigate({ to: result.url });
    } else {
      console.error("Failed to copy run to pipeline");
    }
  };

  if (detailsLoading || !componentSpec) {
    return (
      <button>
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  const getInitialName = () => {
    const dateTime = new Date().toISOString();
    return componentSpec?.name
      ? `${componentSpec.name} (${dateTime})`
      : `Pipeline ${dateTime}`;
  };

  const isSubmitDisabled = (name: string) => {
    return name === componentSpec?.name;
  };

  return (
    <PipelineNameDialog
      trigger={<Button variant="outline">Clone Pipeline</Button>}
      title="Clone Pipeline"
      initialName={getInitialName()}
      onSubmit={handleClone}
      submitButtonText="Clone Run"
      submitButtonIcon={<CopyIcon />}
      isSubmitDisabled={isSubmitDisabled}
    />
  );
};

const CloneRunButton = () => {
  const location = useLocation();

  const isRunDetailRoute = location.pathname.includes(RUNS_BASE_PATH);

  if (!isRunDetailRoute) {
    return null;
  }
  return <CloneRunButtonInner />;
};

export default CloneRunButton;
