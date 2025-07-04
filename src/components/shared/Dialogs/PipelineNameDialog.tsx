import { AlertCircle, InfoIcon } from "lucide-react";
import { type ChangeEvent, type ReactNode, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useLoadUserPipelines from "@/hooks/useLoadUserPipelines";
import { VALID_NAME_MESSAGE, VALID_NAME_REGEX } from "@/utils/constants";

interface PipelineNameDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  initialName: string;
  onSubmit: (name: string) => void;
  submitButtonText: string;
  submitButtonIcon?: ReactNode;
  isSubmitDisabled?: (name: string, error: string | null) => boolean;
  onOpenChange?: (open: boolean) => void;
}

const PipelineNameDialog = ({
  trigger,
  title,
  description = "Please, name your pipeline.",
  initialName,
  onSubmit,
  submitButtonText,
  submitButtonIcon,
  isSubmitDisabled,
  onOpenChange,
}: PipelineNameDialogProps) => {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const {
    userPipelines,
    isLoadingUserPipelines,
    refetch: refetchUserPipelines,
  } = useLoadUserPipelines();

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const existingPipelineNames = new Set(
      Array.from(userPipelines.keys()).map((name) => name.toLowerCase()),
    );

    if (!VALID_NAME_REGEX.test(newName)) {
      setError(VALID_NAME_MESSAGE);
    } else if (existingPipelineNames.has(newName.trim().toLowerCase())) {
      setError("Name already exists");
    } else {
      setError(null);
    }

    setName(e.target.value);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    } else {
      setName(initialName);
      refetchUserPipelines();
    }
    onOpenChange?.(open);
  };

  const handleSubmit = () => {
    onSubmit(name);
  };

  const isDisabled =
    isLoadingUserPipelines ||
    !!error ||
    !name ||
    (isSubmitDisabled ? isSubmitDisabled(name, error) : false);

  return (
    <Dialog onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2 flex-col">
            <Input value={name} onChange={handleOnChange} />
            <Alert variant={error ? "destructive" : "default"}>
              {error && <AlertCircle className="h-4 w-4" />}
              {!error && <InfoIcon className="h-4 w-4" />}
              {error && <AlertDescription>{error}</AlertDescription>}
              {!error && (
                <AlertDescription>{VALID_NAME_MESSAGE}</AlertDescription>
              )}
            </Alert>
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={handleSubmit}
              disabled={isDisabled}
            >
              {submitButtonIcon}
              {submitButtonText}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PipelineNameDialog;
