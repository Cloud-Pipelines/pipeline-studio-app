import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  addComponentAllowingDuplicates,
  addComponentToListByTextWithDuplicateCheck,
  addComponentToListByUrl,
  addComponentWithNewName,
  type ComponentFileEntry,
  replaceComponentInList,
} from "@/utils/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";

interface ImportComponentProps {
  successCallback?: (hasDuplicate?: boolean, fileEntry?: ComponentFileEntry, canOverwrite?: boolean) => void;
  errorCallback?: (error: Error) => void;
  duplicateCallback?: (componentName: string, fileEntry: ComponentFileEntry) => void;
}

const useImportComponent = ({
  successCallback,
  errorCallback,
  duplicateCallback,
}: ImportComponentProps) => {
  const [url, setUrl] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);
  const [fileContent, setFileContent] = useState<string | ArrayBuffer | null>(
    null,
  );
  const [shouldProcessFile, setShouldProcessFile] = useState(false);
  const [isDuplicateResolution, setIsDuplicateResolution] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading: isLoadingUrl } = useQuery({
    queryKey: ["import-component-from-url", url],
    queryFn: async () => {
      try {
        // Use the existing addComponentToListByUrl function instead
        // of implementing our own storage logic
        const componentFileEntry = await addComponentToListByUrl(
          USER_COMPONENTS_LIST_NAME,
          url,
        );
        // Invalidate the userComponents query to refresh the sidebar
        queryClient.invalidateQueries({ queryKey: ["userComponents"] });
        successCallback?.();

        return componentFileEntry;
      } catch (error) {
        console.error("Error importing component:", error);

        errorCallback?.(new Error("Error importing component from url"));
        throw error;
      } finally {
        setShouldFetch(false);
      }
    },
    enabled: shouldFetch && url.length > 0,
    retry: false,
  });

  const { isLoading: isLoadingFile } = useQuery({
    queryKey: ["import-component-from-file", fileContent],
    queryFn: async () => {
      try {
        if (!fileContent) {
          throw new Error("No file content provided");
        }

        const { hasDuplicate, fileEntry, canOverwrite } = await addComponentToListByTextWithDuplicateCheck(
          USER_COMPONENTS_LIST_NAME,
          fileContent,
        );

        console.log('canOverwrite', canOverwrite);

        // If there's a duplicate and we can overwrite, trigger the duplicate callback
        if (hasDuplicate && canOverwrite && fileEntry && duplicateCallback) {
          const componentName = fileEntry.componentRef.spec.name || "Unknown Component";
          setIsDuplicateResolution(true);
          duplicateCallback(componentName, fileEntry);
          return; // Don't proceed with normal flow, wait for user decision
        }

        // Only proceed with normal flow if we're not in duplicate resolution mode
        if (!isDuplicateResolution) {
          // Invalidate the userComponents query to refresh the sidebar
          queryClient.invalidateQueries({ queryKey: ["userComponents"] });
          successCallback?.(hasDuplicate, fileEntry, canOverwrite);
        }
        return;
      } catch (error) {
        console.error("Error importing component from file:", error);
        errorCallback?.(new Error("Error importing component from file"));
        throw error;
      } finally {
        setShouldProcessFile(false);
        setFileContent(null);
      }
    },
    enabled: shouldProcessFile && fileContent !== null,
    retry: false,
  });

  const onImportFromUrl = useCallback((inputUrl: string) => {
    setUrl(inputUrl);
    setShouldFetch(true);
  }, []);

  const onImportFromFile = useCallback((content: string | ArrayBuffer) => {
    setFileContent(content);
    setShouldProcessFile(true);
  }, []);

  const handleDuplicateAction = useCallback(async (
    action: "replace" | "rename" | "keep-both" | "cancel",
    originalContent: string | ArrayBuffer,
    existingFileEntry: ComponentFileEntry,
    newName?: string
  ) => {
    try {
      let savedFileEntry: ComponentFileEntry;

      switch (action) {
        case "replace":
          savedFileEntry = await replaceComponentInList(
            USER_COMPONENTS_LIST_NAME,
            originalContent,
            existingFileEntry.name
          );
          break;
        case "rename":
          if (!newName) throw new Error("New name is required for rename action");
          savedFileEntry = await addComponentWithNewName(
            USER_COMPONENTS_LIST_NAME,
            originalContent,
            newName
          );
          break;
        case "keep-both":
          savedFileEntry = await addComponentAllowingDuplicates(
            USER_COMPONENTS_LIST_NAME,
            originalContent
          );
          break;
        case "cancel":
          setIsDuplicateResolution(false);
          return; // Do nothing, just exit
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Invalidate the userComponents query to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: ["userComponents"] });

      // Reset the duplicate resolution flag
      setIsDuplicateResolution(false);

      // Return the saved file entry so the uploader can use the correct content
      return savedFileEntry;
    } catch (error) {
      console.error("Error handling duplicate action:", error);
      errorCallback?.(error as Error);
    }
  }, [queryClient, successCallback, errorCallback]);

  const isLoading = isLoadingUrl || isLoadingFile;

  return {
    isLoading,
    onImportFromUrl,
    onImportFromFile,
    handleDuplicateAction,
  };
};

export default useImportComponent;
