import { deleteComponentFileFromList } from "@/componentStore";

import { USER_PIPELINES_LIST_NAME } from "./constants";

const deletePipeline = async (name: string, onDelete: () => void) => {
  try {
    await deleteComponentFileFromList(USER_PIPELINES_LIST_NAME, name);
    onDelete();
  } catch (error) {
    console.error("Error deleting pipeline:", error);
  }
};

export default deletePipeline;
