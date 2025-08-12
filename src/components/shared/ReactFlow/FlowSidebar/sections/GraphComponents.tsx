import {
  Cable,
  Folder,
  LayoutGrid,
  PackagePlus,
  Puzzle,
  Star,
} from "lucide-react";
import { type ChangeEvent, useCallback, useMemo } from "react";

import { Separator } from "@/components/ui/separator";
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
import { useForcedSearchContext } from "@/providers/ComponentLibraryProvider/ForcedSearchProvider";
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
  const { updateSearchFilter, currentSearchFilter } = useForcedSearchContext();
  const {
    componentLibrary,
    usedComponentsFolder,
    userComponentsFolder,
    favoritesFolder,
    isLoading,
    error,
    searchResult,
  } = useComponentLibrary();

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateSearchFilter({
      searchTerm: e.target.value,
    });
  };

  const handleFiltersChange = useCallback(
    (filters: string[]) => {
      updateSearchFilter({
        filters,
      });
    },
    [updateSearchFilter],
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

    const hasUserComponents =
      userComponentsFolder?.components &&
      userComponentsFolder.components.length > 0;

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
            key="favorite-components-folder"
            folder={favoritesFolder}
            icon={Star}
          />
        )}
        {hasUserComponents && (
          <FolderItem
            key="my-components-folder"
            folder={userComponentsFolder}
            icon={Puzzle}
          />
        )}
        <Separator />
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
          icon={Cable}
        />
        <Separator />
        <FolderItem
          key="standard-library-folder"
          folder={
            {
              name: "Standard library",
              components: [],
              folders: componentLibrary.folders,
            } as UIComponentFolder
          }
          icon={Folder}
        />
      </div>
    );
  }, [
    componentLibrary,
    usedComponentsFolder,
    userComponentsFolder,
    favoritesFolder,
    isLoading,
    error,
    searchResult,
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
          value={currentSearchFilter.searchTerm}
          activeFilters={currentSearchFilter.filters}
          onChange={handleSearchChange}
          onFiltersChange={handleFiltersChange}
        />

        {memoizedContent}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default GraphComponents;
