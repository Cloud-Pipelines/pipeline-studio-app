import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { addComponentToListByUrl } from "@/componentStore";

// Database constants for storing components
const USER_COMPONENTS_LIST_NAME = "user_components";

const useImportComponent = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [url, setUrl] = useState("");
  const [shouldFetch, setShouldFetch] = useState(false);
  const queryClient = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ["import-component-from-url", url],
    queryFn: async () => {
      try {
        // Use the existing addComponentToListByUrl function instead
        // of implementing our own storage logic
        const componentFileEntry = await addComponentToListByUrl(
          USER_COMPONENTS_LIST_NAME,
          url,
        );

        setSuccessMessage(
          `Component '${componentFileEntry.componentRef.spec.name || "Unnamed"}' imported successfully`,
        );

        // Invalidate the userComponents query to refresh the sidebar
        queryClient.invalidateQueries({ queryKey: ["userComponents"] });

        return componentFileEntry;
      } catch (error) {
        console.error("Error importing component:", error);
        setErrorMessage(error instanceof Error ? error.message : String(error));
        throw error;
      } finally {
        setShouldFetch(false);
      }
    },
    enabled: shouldFetch && url.length > 0,
    retry: false,
  });

  const onImportFromUrl = useCallback((inputUrl: string) => {
    setUrl(inputUrl);
    setShouldFetch(true);
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  return {
    errorMessage,
    successMessage,
    isLoading,
    onImportFromUrl,
  };
};

export default useImportComponent;

// const {
//   data: componentLibrary,
//   isLoading,
//   error,
// } = useQuery({
//   queryKey: ["componentLibrary"],
//   queryFn: fetchComponentLibrary,
// });
