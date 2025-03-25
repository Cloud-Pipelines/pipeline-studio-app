import { useLocation, useNavigate } from "@tanstack/react-router";
import { CopyIcon, Loader2 } from "lucide-react";

import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { type RunDetailParams, runDetailRoute } from "@/router";
import { RUNS_BASE_PATH } from "@/utils/constants";
import { copyRunToPipeline } from "@/utils/copyRunToPipeline";

import { Button } from "./ui/button";

const CloneRunButtonInner = () => {
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const { componentSpec, isLoading: detailsLoading } =
    useLoadComponentSpecAndDetailsFromId(id);
  const navigate = useNavigate();

  const handleClone = async () => {
    if (!componentSpec) {
      console.error("No component spec found");
      return;
    }

    const result = await copyRunToPipeline(componentSpec);
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

  return (
    <Button variant="outline" onClick={handleClone} className="cursor-pointer">
      <CopyIcon /> Clone Run
    </Button>
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
