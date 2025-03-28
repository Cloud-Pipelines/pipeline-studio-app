import { useLocation, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CopyIcon, InfoIcon, Loader2 } from "lucide-react";
import { useState } from "react";

import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import useLoadUserPipelines from "@/hooks/useLoadUserPipelines";
import { type RunDetailParams, runDetailRoute } from "@/router";
import {
  RUNS_BASE_PATH,
  VALID_NAME_MESSAGE,
  VALID_NAME_REGEX,
} from "@/utils/constants";
import { copyRunToPipeline } from "@/utils/copyRunToPipeline";

import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";

const CloneRunButtonInner = () => {
  const { id } = runDetailRoute.useParams() as RunDetailParams;
  const { componentSpec, isLoading: detailsLoading } =
    useLoadComponentSpecAndDetailsFromId(id);
  const { userPipelines, isLoadingUserPipelines } = useLoadUserPipelines();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  console.log("componentSpec", componentSpec);

  const handleClone = async () => {
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

  const handleOnOpenChange = () => {
    setError(null);
    const dateTime = new Date().toLocaleString();
    setName(
      componentSpec?.name
        ? `${componentSpec.name} (${dateTime})`
        : `Pipeline ${dateTime}`,
    );
  };

  const handleOnOpenModal = () => {
    setName(componentSpec?.name || "");
  };
  const handleOnNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const existingPipelineNames = new Set(
      Array.from(userPipelines.keys()).map((name) => name.toLowerCase()),
    );

    if (!VALID_NAME_REGEX.test(newName)) {
      setError(VALID_NAME_MESSAGE);
    } else if (existingPipelineNames.has(newName.trim().toLowerCase())) {
      setError("Name already exists");
    } else {
      setError(null);
    }

    setName(e.target.value);
  };

  return (
    <Dialog onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleOnOpenModal}
          className="cursor-pointer"
        >
          Clone Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Pipeline</DialogTitle>
          <DialogDescription>Please, name your pipeline.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2 flex-col">
            <Input value={name} onChange={handleOnNameChange} />
            <Alert variant={error ? "destructive" : "default"}>
              {error && <AlertCircle className="h-4 w-4" />}
              {!error && <InfoIcon className="h-4 w-4" />}
              {error && <AlertDescription>{error}</AlertDescription>}
              {!error && (
                <AlertDescription>{VALID_NAME_MESSAGE}</AlertDescription>
              )}
            </Alert>
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              size="sm"
              className="px-3 cursor-pointer"
              onClick={handleClone}
              disabled={
                isLoadingUserPipelines ||
                !!error ||
                !name ||
                name === componentSpec?.name
              }
            >
              <CopyIcon /> Clone Run
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
