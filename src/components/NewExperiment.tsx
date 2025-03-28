import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, InfoIcon } from "lucide-react";
import { generate } from "random-words";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { writeComponentToFileListFromText } from "@/componentStore";
import { replaceLocalStorageWithExperimentYaml } from "@/DragNDrop/PipelineAutoSaver";
import useLoadUserPipelines from "@/hooks/useLoadUserPipelines";
import {
  defaultPipelineYamlWithName,
  EDITOR_PATH,
  USER_PIPELINES_LIST_NAME,
  VALID_NAME_MESSAGE,
  VALID_NAME_REGEX,
} from "@/utils/constants";

import { Alert, AlertDescription } from "./ui/alert";

const randomName = () => (generate(4) as string[]).join(" ");

const NewExperimentDialog = () => {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const { userPipelines, isLoadingUserPipelines } = useLoadUserPipelines();

  const [name, setName] = useState(randomName());

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleOnCreate = async () => {
    const componentText = defaultPipelineYamlWithName(name);
    await writeComponentToFileListFromText(
      USER_PIPELINES_LIST_NAME,
      name,
      componentText,
    );

    replaceLocalStorageWithExperimentYaml(componentText);

    navigate({
      to: `${EDITOR_PATH}/${name}`,
      reloadDocument: true,
    });
  };
  const handleOnOpenModal = () => {
    setName(randomName());
  };
  const handleOnOpenChange = () => {
    setError(null);
  };

  return (
    <Dialog onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleOnOpenModal}
          className="cursor-pointer"
          disabled={isLoadingUserPipelines}
        >
          New Pipeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Pipeline</DialogTitle>
          <DialogDescription>Please, name your pipeline.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2 flex-col">
            <Input value={name} onChange={handleOnChange} />
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
              className="px-3"
              onClick={handleOnCreate}
              disabled={isLoadingUserPipelines || error !== null}
            >
              Create
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewExperimentDialog;
