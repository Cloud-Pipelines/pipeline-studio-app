import { useNavigate } from "@tanstack/react-router";
import { generate } from "random-words";

import { Button } from "@/components/ui/button";
import { EDITOR_PATH } from "@/routes/router";
import { writeComponentToFileListFromText } from "@/utils/componentStore";
import {
  defaultPipelineYamlWithName,
  USER_PIPELINES_LIST_NAME,
} from "@/utils/constants";
import { replaceLocalStorageWithExperimentYaml } from "@/utils/storage";

import { PipelineNameDialog } from "./Dialogs/PipelineNameDialog";

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
