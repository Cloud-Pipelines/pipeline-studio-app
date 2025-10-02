import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { RUNS_BASE_PATH } from "@/routes/router";
import { loadPipelineByName } from "@/services/pipelineService";
import { getIdOrTitleFromPath } from "@/utils/URL";

export const useCheckComponentSpecFromPath = (
  url: string,
  disabled: boolean = false,
) => {
  const isRunPath = url.includes(RUNS_BASE_PATH);

  const { title } = useMemo(() => getIdOrTitleFromPath(url), [url]);

  const { data: existsLocal } = useQuery({
    queryKey: ["component-spec-local", url],
    queryFn: async () =>
      loadPipelineByName(title as string).then(
        (result) => !!result.experiment?.componentRef?.spec,
      ),
    enabled: !disabled && !isRunPath && !!title,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return existsLocal ?? false;
};
