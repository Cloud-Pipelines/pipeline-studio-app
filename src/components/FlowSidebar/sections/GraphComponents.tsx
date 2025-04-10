import { useQuery } from "@tanstack/react-query";
import { Box, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { loadObjectFromYamlData } from "@/cacheUtils";
import {
  EmptyState,
  ErrorState,
  FolderItem,
  LoadingState,
  SearchInput,
} from "@/components/FlowSidebar/components";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import type { ComponentReference } from "@/componentSpec";
import { getAllComponentFilesFromList } from "@/componentStore";
import {
  type ComponentLibraryStruct,
  isValidComponentLibraryStruct,
} from "@/DragNDrop/ComponentLibrary";
import type { ComponentFolder } from "@/types/componentLibrary";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";

const USER_COMPONENTS_LIST_NAME = "user_components";

const fetchComponentLibrary = async (): Promise<ComponentLibraryStruct> => {
  const response = await fetch("/component_library.yaml");
  if (!response.ok) {
    throw new Error(`Failed to load component library: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const obj = loadObjectFromYamlData(arrayBuffer);

  if (!isValidComponentLibraryStruct(obj)) {
    throw new Error("Invalid component library structure");
  }

  return obj;
};

const fetchUserComponents = async (): Promise<ComponentFolder> => {
  try {
    const componentFiles = await getAllComponentFilesFromList(
      USER_COMPONENTS_LIST_NAME,
    );

    const components: ComponentReference[] = Array.from(
      componentFiles.values(),
    ).map(({ componentRef }) => componentRef);
    // Create a user components folder
    const userComponentsFolder: ComponentFolder = {
      name: "User Components",
      components,
      folders: [],
    };

    return userComponentsFolder;
  } catch (error) {
    console.error("Error fetching user components:", error);
    return {
      name: "User Components",
      components: [],
      folders: [],
    };
  }
};

const GraphComponents = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: componentLibrary,
    isLoading: isLibraryLoading,
    error: libraryError,
  } = useQuery({
    queryKey: ["componentLibrary"],
    queryFn: fetchComponentLibrary,
  });

  const {
    data: userComponentsFolder,
    isLoading: isUserComponentsLoading,
    error: userComponentsError,
  } = useQuery({
    queryKey: ["userComponents"],
    queryFn: fetchUserComponents,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const memoizedContent = useMemo(() => {
    const isLoading = isLibraryLoading || isUserComponentsLoading;
    const error = libraryError || userComponentsError;

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={(error as Error).message} />;
    if (!componentLibrary) return <EmptyState />;

    const hasUserComponents =
      userComponentsFolder &&
      userComponentsFolder.components &&
      userComponentsFolder.components.length > 0;

    return (
      <div>
        {hasUserComponents && (
          <FolderItem
            key="user-components-folder"
            folder={userComponentsFolder}
            searchTerm={searchTerm}
          />
        )}

        {componentLibrary.folders.map((folder, index) => (
          <FolderItem
            key={`root-folder-${index}`}
            folder={folder}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    );
  }, [
    componentLibrary,
    userComponentsFolder,
    isLibraryLoading,
    isUserComponentsLoading,
    libraryError,
    userComponentsError,
    searchTerm,
  ]);

  return (
    <Collapsible
      defaultOpen
      className="group/collapsible [&_li]:marker:hidden [&_li]:before:content-none [&_li]:list-none"
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center py-2">
            <Box className="h-5 w-5 text-gray-700 flex-shrink-0 mr-2" />
            <span className="font-medium">Components</span>
            <ChevronDown className="ml-auto h-5 w-5 text-gray-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SearchInput value={searchTerm} onChange={handleSearchChange} />
            {memoizedContent}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

export default GraphComponents;
