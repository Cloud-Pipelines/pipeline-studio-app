
import { EDITOR_PATH } from "@/routes/router";import { useLocation } from "@tanstack/react-router";



const EditorMenu = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const experimentName = decodeURIComponent(pathname.split("/").pop() || "");

  if (!pathname.includes(EDITOR_PATH)) {
    return null;
  }

  return <span className="text-white text-sm font-bold">{experimentName}</span>;
};

export default EditorMenu;
