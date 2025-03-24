import { useNavigate } from "@tanstack/react-router";

import NewExperimentDialog from "@/components/NewExperiment";
import { APP_ROUTES } from "@/utils/constants";

import CloneRunButton from "./CloneRunButton";
import EditorMenu from "./EditorMenu";
import ImportPipeline from "./ImportPipeline";
const AppMenu = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate({ to: APP_ROUTES.HOME });
  };

  return (
    <div className="w-full bg-stone-900 p-2">
      <div className="flex justify-between items-center w-3/4 mx-auto">
        <div className="flex flex-row gap-2 items-center">
          <img
            src="/beach.png"
            alt="logo"
            className="w-10 h-10 filter invert cursor-pointer"
            onClick={handleLogoClick}
          />
          <EditorMenu />
        </div>
        <div className="flex flex-row gap-2 items-center">
          <CloneRunButton />
          <ImportPipeline />
          <NewExperimentDialog />
        </div>
      </div>
    </div>
  );
};

export default AppMenu;
