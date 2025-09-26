import { useEffect, useMemo, useState } from "react";

import { RUNS_BASE_PATH } from "@/routes/router";
import { fetchExecutionDetails } from "@/services/executionService";
import { loadPipelineByName } from "@/services/pipelineService";
import { getIdOrTitleFromPath } from "@/utils/URL";

export const useCheckComponentSpecFromPath = (
  backendUrl: string,
  url: string,
  disabled: boolean = false,
) => {
  const [isChecking, setIsChecking] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRunPath = url.includes(RUNS_BASE_PATH);

  const { title, id } = useMemo(() => getIdOrTitleFromPath(url), [url]);

  useEffect(() => {
    const checkComponentSpecExists = async () => {
      setError(null);
      setExists(null);

      if (!title && !id) {
        setExists(false);
        return;
      }

      setIsChecking(true);
      try {
        let specExists = false;

        // check by run id
        if (id && isRunPath) {
          const result = await fetchExecutionDetails(String(id), backendUrl);
          specExists = !!result.task_spec?.componentRef?.spec;
        }

        // check by title
        if (title && !isRunPath) {
          const result = await loadPipelineByName(title);
          specExists = !!result.experiment?.componentRef?.spec;
        }

        setExists(specExists);
      } catch (error) {
        console.error("Error checking component spec existence:", error);
        setExists(false);
        if (error instanceof Error) {
          setError("Failed to check component spec: " + error.message);
        }
      } finally {
        setIsChecking(false);
      }
    };

    if (disabled) {
      setExists(null);
      return;
    }

    checkComponentSpecExists();
  }, [id, title, url, disabled, backendUrl, isRunPath]);

  return {
    exists,
    isChecking,
    error,
  };
};
