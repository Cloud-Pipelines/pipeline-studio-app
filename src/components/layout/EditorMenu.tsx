import { useLocation } from "@tanstack/react-router";

import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { EDITOR_PATH, RUNS_BASE_PATH } from "@/routes/router";

const EditorMenu = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const experimentNameOrRunId = decodeURIComponent(
    pathname.split("/").pop() || "",
  );
  const { componentSpec, isLoading } = useLoadComponentSpecAndDetailsFromId(
    experimentNameOrRunId,
  );

  if (
    !pathname.includes(EDITOR_PATH) &&
    !pathname.includes(RUNS_BASE_PATH) &&
    !isLoading
  ) {
    return null;
  }

  // IF componentSpec is defined we know its a run because we loaded it from the run id
  const title = componentSpec?.name
    ? `${componentSpec?.name} - #${experimentNameOrRunId}`
    : experimentNameOrRunId;

  return <span className="text-white text-sm font-bold">{title}</span>;
};

export default EditorMenu;
