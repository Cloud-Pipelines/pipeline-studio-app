import { createContext, useContext } from "react";

interface DialogContextType {
  name: string;
  close: () => void;
  hide: () => void;
}

export const DialogContext = createContext<DialogContextType | undefined>(
  undefined,
);

export const useDialogContext = () => {
  return useContext(DialogContext);
};
