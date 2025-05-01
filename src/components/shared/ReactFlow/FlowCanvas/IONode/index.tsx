import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

interface IONodeProps {
  type: "input" | "output";
  data: {
    label: string;
  };
}

const IONode = ({ type, data }: IONodeProps) => {
  const position = type === "input" ? Position.Bottom : Position.Top;

  const sourceOrTarget = type === "input" ? "source" : "target";
  return (
    <div className="p-3 border rounded-md shadow-sm transition-all duration-200">
      <Handle
        type={sourceOrTarget}
        position={position}
        isConnectable
        className="w-3! h-3! border-2! rounded-full! bg-white! border-slate-300! hover:border-slate-600!"
      />
      <div>{data.label}</div>
    </div>
  );
};

export default memo(IONode);
