import type { MouseEvent, ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmationDialogProps = {
  title?: string;
  description?: string;
  content?: ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
} & (
  | { trigger: ReactNode; isOpen?: boolean }
  | { trigger?: ReactNode; isOpen: boolean }
);

const defaultTitle = "Are you sure?";
const defaultDescription = "This action cannot be undone.";

const ConfirmationDialog = ({
  trigger,
  title = defaultTitle,
  description = defaultDescription,
  content,
  isOpen,
  onConfirm,
  onCancel = () => {},
}: ConfirmationDialogProps) => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const handleConfirm = (e: MouseEvent) => {
    e.stopPropagation();
    onConfirm();
  };

  const handleCancel = (e: MouseEvent) => {
    e.stopPropagation();
    onCancel();
  };

  return (
    <AlertDialog open={isOpen}>
      {trigger && (
        <AlertDialogTrigger
          className="cursor-pointer"
          onClick={handleClick}
          asChild
        >
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent className="z-[9999]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {content}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
