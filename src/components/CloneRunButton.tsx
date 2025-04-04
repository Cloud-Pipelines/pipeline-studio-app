import { useLocation, useNavigate } from "@tanstack/react-router";
import { CopyIcon, Loader2 } from "lucide-react";

import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { type RunDetailParams, runDetailRoute } from "@/router";
import { RUNS_BASE_PATH } from "@/utils/constants";
import { copyRunToPipeline } from "@/utils/copyRunToPipeline";

import { PipelineNameDialog } from "./shared/PipelineNameDialog";
import { Button } from "./ui/button";

const CloneRunButtonInner = () => {
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const { componentSpec, isLoading: detailsLoading } =
    useLoadComponentSpecAndDetailsFromId(id);
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

  if (detailsLoading) {
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
      trigger={
        <Button variant="outline" className="cursor-pointer">
          Clone Pipeline
        </Button>
      }
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
