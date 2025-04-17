import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import {
  addComponentToListByText,
  addComponentToListByUrl,
} from "@/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";

interface ImportComponentProps {
  successCallback?: () => void;
  errorCallback?: (error: Error) => void;
}

const useImportComponent = ({
  successCallback,
  errorCallback,
}: ImportComponentProps) => {
  const [url, setUrl] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);
  const [fileContent, setFileContent] = useState<string | ArrayBuffer | null>(
    null,
  );
  const [shouldProcessFile, setShouldProcessFile] = useState(false);
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

        // Use the existing addComponentToListByText function
        const componentFileEntry = await addComponentToListByText(
          USER_COMPONENTS_LIST_NAME,
          fileContent,
        );
        // Invalidate the userComponents query to refresh the sidebar
        queryClient.invalidateQueries({ queryKey: ["userComponents"] });

        successCallback?.();
        return componentFileEntry;
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

  const isLoading = isLoadingUrl || isLoadingFile;

  return {
    isLoading,
    onImportFromUrl,
    onImportFromFile,
  };
};

export default useImportComponent;
