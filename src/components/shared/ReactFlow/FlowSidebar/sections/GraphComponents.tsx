import { LayoutGrid, Puzzle } from "lucide-react";
import { type ChangeEvent, useCallback, useMemo } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";

import {
  EmptyState,
  ErrorState,
  FolderItem,
  ImportComponent,
  LoadingState,
  SearchInput,
  SearchResults,
} from "../components";

const GraphComponents = () => {
  const {
    componentLibrary,
    userComponentsFolder,
    usedComponentsFolder,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    searchFilters,
    setSearchFilters,
    searchResult,
  } = useComponentLibrary();

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltersChange = useCallback(
    (filters: string[]) => {
      setSearchFilters(filters);
    },
    [setSearchFilters],
  );

  const memoizedContent = useMemo(() => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={(error as Error).message} />;
    if (!componentLibrary) return <EmptyState />;

    // If there's a search result, use the SearchResults component
    if (searchResult) {
      return (
        <SearchResults
          searchResult={searchResult}
          onFiltersChange={handleFiltersChange}
        />
      );
    }

    // Otherwise show the regular folder structure
    const hasUserComponents =
      userComponentsFolder?.components &&
      userComponentsFolder.components.length > 0;

    const hasUsedComponents =
      usedComponentsFolder?.components &&
      usedComponentsFolder.components.length > 0;

    return (
      <div>
        {hasUsedComponents && (
          <FolderItem
            key="used-components-folder"
            folder={usedComponentsFolder}
            icon={LayoutGrid}
          />
        )}

        {hasUserComponents && (
          <FolderItem
            key="user-components-folder"
            folder={userComponentsFolder}
            icon={Puzzle}
          />
        )}

        {componentLibrary.folders.map((folder) => (
          <FolderItem key={folder.name} folder={folder} />
        ))}
      </div>
    );
  }, [
    componentLibrary,
    userComponentsFolder,
    usedComponentsFolder,
    isLoading,
    error,
    searchTerm,
    searchFilters,
  ]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">Components</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ImportComponent />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">Add component</TooltipContent>
          </Tooltip>
        </div>
      </SidebarGroupLabel>
      <SidebarGroupContent className="[&_li]:marker:hidden [&_li]:before:content-none [&_li]:list-none">
        <SearchInput
          value={searchTerm}
          activeFilters={searchFilters}
          onChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
        />

        {memoizedContent}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default GraphComponents;
