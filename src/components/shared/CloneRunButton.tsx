import { useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RUNS_BASE_PATH } from "@/routes/router";
import { copyRunToPipeline } from "@/services/pipelineRunService";
import type { ComponentSpec } from "@/utils/componentSpec";
import { removeTrailingDateFromTitle } from "@/utils/string";

const CloneRunButtonInner = ({
  componentSpec,
}: {
  componentSpec: ComponentSpec;
}) => {
  const navigate = useNavigate();

  const getInitialName = () => {
    const dateTime = new Date().toISOString();
    const baseName = componentSpec?.name || "Pipeline";

    return `${removeTrailingDateFromTitle(baseName)} (${dateTime})`;
  };

  const handleClone = async () => {
    const name = getInitialName();
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

  if (!componentSpec) {
    return (
      <button>
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  return (
    <Button variant="outline" onClick={handleClone}>
      Clone Pipeline
    </Button>
  );
};

const CloneRunButton = ({
  componentSpec,
}: {
  componentSpec?: ComponentSpec;
}) => {
  const location = useLocation();

  const isRunDetailRoute = location.pathname.includes(RUNS_BASE_PATH);

  if (!isRunDetailRoute || !componentSpec) {
    return null;
  }
  return <CloneRunButtonInner componentSpec={componentSpec} />;
};

export default CloneRunButton;
