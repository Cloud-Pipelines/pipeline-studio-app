import { type ReactNode, useState } from "react";

type ConfirmationDialogHandlers = {
  onConfirm: () => void;
  onCancel: () => void;
};

type TriggerDialogProps = {
  title?: string;
  description?: string;
  content?: ReactNode;
};

const DEFAULT_TITLE = "Are you sure?";
const DEFAULT_DESCRIPTION = "Are you sure you want to proceed?";
const DEFAULT_CONTENT = "This action cannot be undone.";

export default function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [handlers, setHandlers] = useState<ConfirmationDialogHandlers | null>(
    null,
  );
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);
  const [description, setDescription] = useState<string>(DEFAULT_DESCRIPTION);
  const [content, setContent] = useState<ReactNode>(DEFAULT_CONTENT);

  const triggerDialog = async ({
    title,
    description,
    content,
  }: TriggerDialogProps = {}): Promise<boolean> => {
    setIsOpen(true);
    setTitle(title ?? DEFAULT_TITLE);
    setDescription(description ?? DEFAULT_DESCRIPTION);
    setContent(content ?? DEFAULT_CONTENT);

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

  return {
    title,
    description,
    content,
    isOpen,
    handlers,
    triggerDialog,
  };
}
