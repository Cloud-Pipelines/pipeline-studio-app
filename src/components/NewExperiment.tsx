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
import {
  getAllComponentFilesFromList,
  writeComponentToFileListFromText,
  type ComponentFileEntry,
} from "@/componentStore";
import { replaceLocalStorageWithExperimentYaml } from "@/DragNDrop/PipelineAutoSaver";
import { useNavigate } from "@tanstack/react-router";
import {
  APP_ROUTES,
  defaultPipelineYamlWithName,
  USER_PIPELINES_LIST_NAME,
} from "@/utils/constants";
import { generate } from "random-words";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, InfoIcon } from "lucide-react";

const VALID_NAME_REGEX = /^[a-zA-Z0-9\s]+$/;
const VALID_NAME_MESSAGE =
  "Name must be unique and contain only alphanumeric characters and spaces";
const randomName = () => (generate(4) as string[]).join(" ");

const NewExperimentDialog = () => {
  const navigate = useNavigate();

  const [userPipelines, setUserPipelines] = useState<
    Map<string, ComponentFileEntry>
  >(new Map());

  const [error, setError] = useState<string | null>(null);

  const [isLoadingUserPipelines, setIsLoadingUserPipelines] = useState(false);

  const [name, setName] = useState(randomName());

  useEffect(() => {
    fetchUserPipelines();
  }, []);

  const fetchUserPipelines = async () => {
    setIsLoadingUserPipelines(true);
    try {
      const pipelines = await getAllComponentFilesFromList(
        USER_PIPELINES_LIST_NAME,
      );
      setUserPipelines(pipelines);
    } catch (error) {
      console.error("Failed to load user pipelines:", error);
    } finally {
      setIsLoadingUserPipelines(false);
    }
  };

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
      to: APP_ROUTES.PIPELINE_EDITOR,
      params: { name },
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
          New Experiment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Experiment</DialogTitle>
          <DialogDescription>Please, name your experiment.</DialogDescription>
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
