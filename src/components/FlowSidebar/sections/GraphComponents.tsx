import { Box, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

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
import {
  type ComponentLibraryStruct,
  isValidComponentLibraryStruct,
} from "@/DragNDrop/ComponentLibrary";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";

/**
 * Component library sidebar section that displays and allows
 * searching and dragging components to the flow canvas
 */
const GraphComponents = () => {
  const [componentLibrary, setComponentLibrary] = useState<
    ComponentLibraryStruct | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadComponentLibrary = async () => {
      try {
        setIsLoading(true);
        // Load the component library from the public directory
        const response = await fetch("/component_library.yaml");
        if (!response.ok) {
          throw new Error(
            `Failed to load component library: ${response.statusText}`,
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const obj = loadObjectFromYamlData(arrayBuffer);

        if (!isValidComponentLibraryStruct(obj)) {
          throw new Error("Invalid component library structure");
        }

        setComponentLibrary(obj);
        setError(null);
      } catch (err) {
        console.error("Error loading component library:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadComponentLibrary();
  }, []);

  // Handler for search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Render component content based on state
  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;
    if (!componentLibrary) return <EmptyState />;

    return (
      <div>
        {componentLibrary.folders.map((folder, index) => (
          <FolderItem
            key={`root-folder-${index}`}
            folder={folder}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    );
  };

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
            {renderContent()}
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

export default GraphComponents;
