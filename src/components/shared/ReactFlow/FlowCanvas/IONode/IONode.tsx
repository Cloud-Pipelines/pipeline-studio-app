import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IONodeProps {
  type: "input" | "output";
  data: {
    label: string;
  };
}

const IONode = ({ type, data }: IONodeProps) => {
  const handleType = type === "input" ? "source" : "target";
  const handlePosition = type === "input" ? Position.Right : Position.Left;
  const handleId = data.label;

  const borderColor =
    type === "input" ? "border-blue-500" : "border-violet-500";

  return (
    <Card
      className={`rounded-2xl ${borderColor} border-2 max-w-[300px] break-words p-0 drop-shadow-none gap-2`}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5">
        <CardTitle className="max-w-[300px] break-words text-left text-xs text-slate-900">
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex flex-col gap-2">
        <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
          <Handle id={handleId} type={handleType} position={handlePosition} />
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(IONode);
