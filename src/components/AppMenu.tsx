import NewExperimentDialog from "@/components/NewExperiment";

import EditorMenu from "./EditorMenu";
import ImportPipeline from "./ImportPipeline";
import CloneRunButton from "./CloneRunButton";
import { Link } from "@tanstack/react-router";
const AppMenu = () => {
  return (
    <div className="w-full bg-stone-900 p-2">
      <div className="flex justify-between items-center w-3/4 mx-auto">
        <div className="flex flex-row gap-2 items-center">
          <Link to="/">
            <img
              src="/beach.png"
              alt="logo"
              className="w-10 h-10 filter invert cursor-pointer"
            />
          </Link>
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
