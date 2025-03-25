import { Link } from "@tanstack/react-router";

import NewExperimentDialog from "@/components/NewExperiment";

import CloneRunButton from "./CloneRunButton";
import EditorMenu from "./EditorMenu";
import ExecutionDetailsSheet from "./ExecutionDetailsSheet";
import ImportPipeline from "./ImportPipeline";

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
          <ExecutionDetailsSheet />
          <CloneRunButton />
          <ImportPipeline />
          <NewExperimentDialog />
        </div>
      </div>
    </div>
  );
};

export default AppMenu;
