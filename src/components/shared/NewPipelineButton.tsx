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

const randomName = () => (generate(4) as string[]).join(" ");

const NewPipelineButton = () => {
  const navigate = useNavigate();

  const handleCreate = async () => {
    const name = randomName();
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
    <Button variant="outline" onClick={handleCreate}>
      New Pipeline
    </Button>
  );
};

export default NewPipelineButton;
