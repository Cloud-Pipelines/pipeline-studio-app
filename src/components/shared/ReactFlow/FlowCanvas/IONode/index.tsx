import { memo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  InputHandle,
  OutputHandle,
} from "../TaskNode/TaskNodeCard/Handles";

interface IONodeProps {
  type: "input" | "output";
  data: {
    label: string;
  };
}

const IONode = ({ type, data }: IONodeProps) => {
  const Handle = type === "input" ? OutputHandle : InputHandle;

  return (
    <Card
      className={cn(
        "rounded-2xl border-gray-200 border-2 max-w-[300px] min-w-[300px] break-words p-0 drop-shadow-none gap-2",
      )}
    >
      <CardHeader className="border-b border-slate-200 px-2 py-2.5">
        <CardTitle className="max-w-[300px] break-words text-left text-xs text-slate-900">
          {data.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex flex-col gap-2">
        {type === "input" && (
          <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
            <Handle
              name={data.label}
              defaultValue={undefined}
              invalid={false}
              value={undefined}
              onClick={undefined}
            />
          </div>
        )}
        {type === "output" && (
          <div className="flex flex-col gap-3 p-2 bg-gray-100 border-1 border-gray-200 rounded-lg">
            <Handle
              name={data.label}
              defaultValue={undefined}
              invalid={false}
              value={undefined}
              onClick={undefined}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(IONode);
