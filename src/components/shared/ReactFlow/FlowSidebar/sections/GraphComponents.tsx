import { PackagePlus } from "lucide-react";
import { type ChangeEvent, useCallback, useMemo } from "react";

import { InfoBox } from "@/components/shared/InfoBox";
import { useOutdatedComponents } from "@/components/shared/ManageComponent/hooks/useOutdatedComponents";
import { useBetaFlagValue } from "@/components/shared/Settings/useBetaFlags";
import { Button } from "@/components/ui/button";
import { BlockStack, InlineStack } from "@/components/ui/layout";
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
import { Paragraph } from "@/components/ui/typography";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { useForcedSearchContext } from "@/providers/ComponentLibraryProvider/ForcedSearchProvider";
import type { UIComponentFolder } from "@/types/componentLibrary";
import type { HydratedComponentReference } from "@/utils/componentSpec";

import { useNodesOverlay } from "../../NodesOverlay/NodesOverlayProvider";
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
import PublishedComponentsSearch from "../components/PublishedComponentsSearch";

function useUpgradeAllComponentsCallback(
  outdatedComponents: [
    HydratedComponentReference,
    HydratedComponentReference,
  ][],
) {
  const { notifyNode, getNodeIdsByDigest, fitNodeIntoView } = useNodesOverlay();

  return useCallback(async () => {
    if (outdatedComponents.length === 0) {
      return;
    }

    const nodeIds = outdatedComponents.flatMap(([outdated, _]) =>
      getNodeIdsByDigest(outdated.digest),
    );

    if (nodeIds.length === 0) {
      return;
    }

    const nodeId = nodeIds.pop();

    if (!nodeId) {
      return;
    }

    await fitNodeIntoView(nodeId);

    notifyNode(nodeId, {
      type: "update-overlay",
      data: {
        replaceWith: new Map(
          outdatedComponents.map(([outdated, mrc]) => [outdated.digest, mrc]),
        ),
        ids: nodeIds,
      },
    });
  }, [getNodeIdsByDigest, fitNodeIntoView, notifyNode, outdatedComponents]);
}

const GraphComponents = ({ isOpen }: { isOpen: boolean }) => {
  const remoteComponentLibrarySearchEnabled = useBetaFlagValue(
    "remote-component-library-search",
  );

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

  const { data: outdatedComponents } = useOutdatedComponents(
    usedComponentsFolder?.components ?? [],
  );

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

  const upgradeAllComponentsCallback =
    useUpgradeAllComponentsCallback(outdatedComponents);

  const memoizedContent = useMemo(() => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={(error as Error).message} />;
    if (!componentLibrary) return <EmptyState />;

    if (!remoteComponentLibrarySearchEnabled && searchResult) {
      // If there's a search result, use the SearchResults component
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

    const showOutdatedComponentsAlert =
      remoteComponentLibrarySearchEnabled && outdatedComponents.length > 0;

    return (
      <BlockStack gap="2">
        {showOutdatedComponentsAlert ? (
          <BlockStack className="px-2">
            <InfoBox title="Upgrades available" key="outdated-components">
              <BlockStack gap="2">
                <Paragraph size="xs">
                  You have {outdatedComponents.length} outdated components used
                  in your Pipeline.
                </Paragraph>
                <InlineStack align="space-between" className="w-full">
                  <Button size="xs" variant="secondary">
                    Dismiss
                  </Button>
                  <Button size="xs" onClick={upgradeAllComponentsCallback}>
                    Review
                  </Button>
                </InlineStack>
              </BlockStack>
            </InfoBox>
          </BlockStack>
        ) : null}

        <BlockStack>
          {hasUsedComponents && (
            <FolderItem
              key="used-components-folder"
              folder={usedComponentsFolder}
              icon="LayoutGrid"
              hasAlertBadge={showOutdatedComponentsAlert}
            />
          )}
          {hasFavouriteComponents && (
            <FolderItem
              key="favorite-components-folder"
              folder={favoritesFolder}
              icon="Star"
            />
          )}
          {hasUserComponents && (
            <FolderItem
              key="my-components-folder"
              folder={userComponentsFolder}
              icon="Puzzle"
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
            icon="Cable"
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
            icon="Folder"
          />
        </BlockStack>
      </BlockStack>
    );
  }, [
    componentLibrary,
    usedComponentsFolder,
    userComponentsFolder,
    favoritesFolder,
    isLoading,
    error,
    searchResult,
    remoteComponentLibrarySearchEnabled,
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

  const searchComponent = remoteComponentLibrarySearchEnabled ? (
    <PublishedComponentsSearch>{memoizedContent}</PublishedComponentsSearch>
  ) : (
    <>
      <SearchInput
        value={currentSearchFilter.searchTerm}
        activeFilters={currentSearchFilter.filters}
        onChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />

      {memoizedContent}
    </>
  );

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
        {searchComponent}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default GraphComponents;
