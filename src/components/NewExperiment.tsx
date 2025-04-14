import { useNavigate } from "@tanstack/react-router";
import { generate } from "random-words";

import { Button } from "@/components/ui/button";
import { writeComponentToFileListFromText } from "@/componentStore";
import {
  defaultPipelineYamlWithName,
  EDITOR_PATH,
  USER_PIPELINES_LIST_NAME,
} from "@/utils/constants";
import { replaceLocalStorageWithExperimentYaml } from "@/utils/PipelineAutoSaver";

import { PipelineNameDialog } from "./shared/PipelineNameDialog";

const randomName = () => (generate(4) as string[]).join(" ");

const NewExperimentDialog = () => {
  const navigate = useNavigate();

  const handleCreate = async (name: string) => {
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

  return (
    <PipelineNameDialog
      trigger={
        <Button variant="outline" className="cursor-pointer">
          New Pipeline
        </Button>
      }
      title="New Pipeline"
      initialName={randomName()}
      onSubmit={handleCreate}
      submitButtonText="Create"
    />
  );
};

export default NewExperimentDialog;
