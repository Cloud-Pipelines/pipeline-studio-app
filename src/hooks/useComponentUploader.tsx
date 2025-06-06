import { type DragEvent } from "react";

import useImportComponent from "@/hooks/useImportComponent";
import useToastNotification from "@/hooks/useToastNotification";

interface useComponentUploaderProps {
  onImportSuccess?: (
    content: string,
    dropEvent?: DragEvent<HTMLDivElement>,
  ) => void;
}

const useComponentUploader = (
  readOnly = false,
  { onImportSuccess }: useComponentUploaderProps,
) => {
  const notify = useToastNotification();

  const { onImportFromFile } = useImportComponent({
    successCallback: (hasDuplicate, fileEntry, canOverwrite) => {
      if (canOverwrite) {
        notify("Component already exists, but can be overwritten", "warning");
      } else if (hasDuplicate) {
        notify("Component already exists", "info");
      } else {
        notify("Component imported successfully", "success");
      }
    },
    errorCallback: (error: Error) => {
      notify(error.message, "error");
    },
  });

  const handleFileUpload = async (
    file: File,
    dropEvent?: DragEvent<HTMLDivElement>,
  ) => {
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
        onImportSuccess?.(content as string, dropEvent);
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
      handleFileUpload(files[0], event);
    }
  };

  if (readOnly) {
    return {
      handleDrop: () => {},
    };
  }

  return {
    handleDrop,
  };
};

export default useComponentUploader;
