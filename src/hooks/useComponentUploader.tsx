import { type DragEvent } from "react";

import useImportComponent from "@/hooks/useImportComponent";
import useToastNotification from "@/hooks/useToastNotification";

interface useComponentUploaderProps {
  onImportSuccess?: (content: string) => void;
}

const useComponentUploader = ({
  onImportSuccess,
}: useComponentUploaderProps) => {
  const notify = useToastNotification();

  const { onImportFromFile } = useImportComponent({
    successCallback: () => {
      notify("Component imported successfully", "success");
    },
    errorCallback: (error: Error) => {
      notify(error.message, "error");
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".yaml")) {
      notify("Only YAML files are supported", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      if (!content) {
        notify("Failed to read file", "error");
        return;
      }

      try {
        await onImportFromFile(content as string);
        onImportSuccess?.(content as string);
      } catch (error) {
        notify((error as Error).message, "error");
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return {
    handleDrop,
  };
};

export default useComponentUploader;
