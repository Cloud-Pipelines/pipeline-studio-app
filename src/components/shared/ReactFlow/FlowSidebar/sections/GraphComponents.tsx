import { Folder, LayoutGrid, PackagePlus, Puzzle } from "lucide-react";
import { type ChangeEvent, useCallback, useMemo } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import type { UIComponentFolder } from "@/types/componentLibrary";

import {
  EmptyState,
  ErrorState,
  FolderItem,
  ImportComponent,
  LoadingState,
  SearchInput,
  SearchResults,
} from "../components";
import { IONodeSidebarItem } from "../components/ComponentItem";

const GraphComponents = ({ isOpen }: { isOpen: boolean }) => {
  const {
    componentLibrary,
    usedComponentsFolder,
    favoritesFolder,
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
    const hasUsedComponents =
      usedComponentsFolder?.components &&
      usedComponentsFolder.components.length > 0;

    const hasFavouriteComponents =
      favoritesFolder?.components && favoritesFolder.components.length > 0;

    return (
      <div>
        {hasUsedComponents && (
          <FolderItem
            key="used-components-folder"
            folder={usedComponentsFolder}
            icon={LayoutGrid}
          />
        )}
        {hasFavouriteComponents && (
          <FolderItem
            key="my-components-folder"
            folder={favoritesFolder}
            icon={Puzzle}
          />
        )}
        <FolderItem
          key="graph-inputs-outputs-folder"
          folder={
            {
              name: "Inputs & Outputs",
              components: [
                <IONodeSidebarItem key="input" nodeType="input" />,
                <IONodeSidebarItem key="output" nodeType="output" />,
              ],
              folders: [],
            } as UIComponentFolder
          }
          icon={Folder}
        />
        {componentLibrary.folders.map((folder) => (
          <FolderItem key={folder.name} folder={folder} />
        ))}
      </div>
    );
  }, [
    componentLibrary,
    usedComponentsFolder,
    favoritesFolder,
    isLoading,
    error,
    searchTerm,
    searchFilters,
  ]);

  if (!isOpen) {
    return (
      <>
        <hr />
        <SidebarGroup className="my-2! pt-0">
          <SidebarGroupContent>
            <SidebarMenuButton
              tooltip="Add Component"
              forceTooltip
              tooltipPosition={isOpen ? "top" : "right"}
              className="cursor-pointer"
            >
              <ImportComponent
                triggerComponent={
                  <PackagePlus className="w-4 h-4" strokeWidth={1.5} />
                }
              />
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    );
  }
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <div className="flex items-center justify-between gap-2 w-full">
          <div>Components</div>
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
