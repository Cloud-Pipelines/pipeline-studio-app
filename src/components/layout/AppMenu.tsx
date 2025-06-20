import { Link } from "@tanstack/react-router";

import CloneRunButton from "@/components/shared/CloneRunButton";
import ImportPipeline from "@/components/shared/ImportPipeline";
import { useLoadComponentSpecAndDetailsFromId } from "@/hooks/useLoadComponentSpecDetailsFromId";
import { TOP_NAV_HEIGHT } from "@/utils/constants";

import NewPipelineButton from "../shared/NewPipelineButton";

const AppMenu = () => {
  const { componentSpec } = useLoadComponentSpecAndDetailsFromId();
  const title = componentSpec?.name;

  return (
    <div
      className="w-full bg-stone-900 p-2"
      style={{ height: `${TOP_NAV_HEIGHT}px` }}
    >
      <div className="flex justify-between items-center w-3/4 mx-auto">
        <div className="flex flex-row gap-2 items-center">
          <Link to="/">
            <img
              src="/beach.png"
              alt="logo"
              className="w-10 h-10 filter invert cursor-pointer"
            />
          </Link>
          <span className="text-white text-sm font-bold">{title}</span>
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
