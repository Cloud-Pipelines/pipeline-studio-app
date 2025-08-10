import { InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const InfoIconButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <Button
      variant="ghost"
      size="min"
      onClick={onClick}
      data-testid="info-icon-button"
    >
      <InfoIcon className="size-4 text-sky-500" />
    </Button>
  );
};

export default InfoIconButton;
