import { useLocation } from "@tanstack/react-router";

import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { EDITOR_PATH, RUNS_BASE_PATH } from "@/routes/router";

const EditorMenu = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { componentSpec, isLoading } = useLoadComponentSpecAndDetailsFromId();

  if (
    !pathname.includes(EDITOR_PATH) &&
    !pathname.includes(RUNS_BASE_PATH) &&
    !isLoading
  ) {
    return null;
  }

  const title = componentSpec?.name;

  return <span className="text-white text-sm font-bold">{title}</span>;
};

export default EditorMenu;
