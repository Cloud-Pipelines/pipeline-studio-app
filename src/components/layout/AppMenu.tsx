import { Link } from "@tanstack/react-router";

import CloneRunButton from "@/components/shared/CloneRunButton";
import ImportPipeline from "@/components/shared/ImportPipeline";

import NewPipelineButton from "../shared/NewPipelineButton";
import EditorMenu from "./EditorMenu";

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
          <NewPipelineButton />
        </div>
      </div>
    </div>
  );
};

export default AppMenu;
