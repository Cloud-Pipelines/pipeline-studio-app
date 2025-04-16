import { useQuery } from "@tanstack/react-query";
import { Box, ChevronDown } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

import { loadObjectFromYamlData } from "@/cacheUtils";
import {
  EmptyState,
  ErrorState,
  FolderItem,
  LoadingState,
  SearchInput,
} from "@/components/FlowSidebar/components";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  type ComponentLibraryStruct,
  isValidComponentLibraryStruct,
} from "@/DragNDrop/ComponentLibrary";
import { normalizeForSearch } from "@/utils/searchUtils";

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

const GraphComponents = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: componentLibrary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["componentLibrary"],
    queryFn: fetchComponentLibrary,
  });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(normalizeForSearch(e.target.value));
  };

  const memoizedContent = useMemo(() => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={(error as Error).message} />;
    if (!componentLibrary) return <EmptyState />;

    return (
      <div>
        {componentLibrary.folders.map((folder) => (
          <FolderItem
            key={folder.name}
            folder={folder}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    );
  }, [componentLibrary, isLoading, error, searchTerm]);

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
