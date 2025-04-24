import { useState } from "react";

type ConfirmationDialogHandlers = {
  onConfirm: () => void;
  onCancel: () => void;
};

export default function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [handlers, setHandlers] = useState<ConfirmationDialogHandlers | null>(
    null,
  );

  const triggerDialog = async (): Promise<boolean> => {
    setIsOpen(true);

    return await new Promise<boolean>((resolve) => {
      setHandlers({
        onConfirm: () => {
          setIsOpen(false);
          resolve(true);
        },
        onCancel: () => {
          setIsOpen(false);
          resolve(false);
        },
      });
    });
  };

  return { isOpen, handlers, triggerDialog };
}
