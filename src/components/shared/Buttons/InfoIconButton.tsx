import { InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const InfoIconButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <Button variant="ghost" size="min" onClick={onClick}>
      <InfoIcon className="size-4 text-sky-500" />
    </Button>
  );
};

export default InfoIconButton;
