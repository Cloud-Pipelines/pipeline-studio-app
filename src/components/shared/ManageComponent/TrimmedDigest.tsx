import type { ComponentProps } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Text } from "@/components/ui/typography";

import { trimDigest } from "./utils/digest";

export const TrimmedDigest = ({
  digest,
  ...props
}: {
  digest: string;
} & ComponentProps<typeof Text>) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Text size="xs" font="mono" {...props}>
          {trimDigest(digest)}
        </Text>
      </TooltipTrigger>
      <TooltipContent>
        <span>{digest}</span>
      </TooltipContent>
    </Tooltip>
  );
};
