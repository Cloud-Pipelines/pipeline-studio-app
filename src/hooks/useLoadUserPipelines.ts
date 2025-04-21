import { useEffect, useState } from "react";

import {
  type ComponentFileEntry,
  getAllComponentFilesFromList,
} from "@/utils/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

const useLoadUserPipelines = () => {
  const [isLoadingUserPipelines, setIsLoadingUserPipelines] = useState(false);
  const [userPipelines, setUserPipelines] = useState<
    Map<string, ComponentFileEntry>
  >(new Map());

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

  useEffect(() => {
    fetchUserPipelines();
  }, []);

  return { userPipelines, isLoadingUserPipelines };
};

export default useLoadUserPipelines;
