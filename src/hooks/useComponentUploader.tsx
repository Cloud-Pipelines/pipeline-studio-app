import { type DragEvent, useState } from "react";

import ComponentDuplicateDialog, { type DuplicateAction } from "@/components/shared/Dialogs/ComponentDuplicateDialog";
import useImportComponent from "@/hooks/useImportComponent";
import useToastNotification from "@/hooks/useToastNotification";
import type { ComponentFileEntry } from "@/utils/componentStore";

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
  const [duplicateDialogState, setDuplicateDialogState] = useState<{
    isOpen: boolean;
    componentName: string;
    originalContent: string;
    existingFileEntry: ComponentFileEntry | null;
    dropEvent?: DragEvent<HTMLDivElement>;
  }>({
    isOpen: false,
    componentName: "",
    originalContent: "",
    existingFileEntry: null,
  });

  const { onImportFromFile, handleDuplicateAction } = useImportComponent({
    successCallback: (hasDuplicate, _fileEntry, canOverwrite) => {
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
    duplicateCallback: (componentName: string, fileEntry: ComponentFileEntry) => {
      setDuplicateDialogState(prev => ({
        ...prev,
        isOpen: true,
        componentName,
        existingFileEntry: fileEntry,
      }));
    },
  });

  const handleDuplicateDialogAction = async (action: DuplicateAction, newName?: string) => {
    const { originalContent, existingFileEntry } = duplicateDialogState;

    if (!existingFileEntry) {
      notify("Error: Missing file entry information", "error");
      return;
    }

    setDuplicateDialogState(prev => ({ ...prev, isOpen: false }));

    if (action === "cancel") {
      return;
    }

                try {
      const savedFileEntry = await handleDuplicateAction(action, originalContent, existingFileEntry, newName);

      // Use the content from the saved file entry (which has the correct name/version)
      if (savedFileEntry) {
        onImportSuccess?.(savedFileEntry.componentRef.text, duplicateDialogState.dropEvent);
      }

      // Show success notification
      const actionMessages = {
        replace: "Component replaced successfully",
        rename: `Component renamed to "${newName}" and imported successfully`,
        "keep-both": "Component imported with version identifier (both versions kept)"
      };
      notify(actionMessages[action], "success");
    } catch (error) {
      notify((error as Error).message, "error");
    }
  };

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

      // Store the content and drop event for potential duplicate handling
      setDuplicateDialogState(prev => ({
        ...prev,
        originalContent: content as string,
        dropEvent,
      }));

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

  const renderDuplicateDialog = () => (
    <ComponentDuplicateDialog
      isOpen={duplicateDialogState.isOpen}
      componentName={duplicateDialogState.componentName}
      onAction={handleDuplicateDialogAction}
    />
  );

  if (readOnly) {
    return {
      handleDrop: () => {},
      renderDuplicateDialog,
    };
  }

  return {
    handleDrop,
    renderDuplicateDialog,
  };
};

export default useComponentUploader;
