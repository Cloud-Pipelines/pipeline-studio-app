import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useMemo, useState } from "react";

import { hasChildMatchingComponent } from "@/services/componentSpecService";
import { type FolderItemProps } from "@/types/componentLibrary";
import { containsSearchTerm } from "@/utils/searchUtils";

import ComponentItem from "./ComponentItem";

const FolderItem = ({
  folder,
  depth = 0,
  searchTerm = "",
}: FolderItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasComponents = folder.components && folder.components.length > 0;
  const hasSubfolders = folder.folders && folder.folders.length > 0;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Check if any child components or subfolders match the search term
  const hasMatchingChildren = useMemo(() => {
    if (!searchTerm) {
      return true;
    }

    // Include folder name in search
    if (containsSearchTerm(folder.name, searchTerm)) {
      if (!isOpen) {
        setIsOpen(true);
      }
      return true;
    }

    // Check if any components match
    const hasMatchingComponents =
      hasComponents &&
      folder.components!.some((component) => {
        if (!component.url) return false;
        const componentName =
          component.url.split("/").pop()?.replace(".yaml", "") || "";
        // Check full URL for matches like "GCS" which might be in the URL path
        return (
          containsSearchTerm(componentName, searchTerm) ||
          containsSearchTerm(component.url, searchTerm)
        );
      });

    // Check if any subfolder has matching components or matching name
    const hasMatchingSubfolders =
      hasSubfolders &&
      folder.folders!.some((subfolder) => {
        return (
          containsSearchTerm(subfolder.name, searchTerm) ||
          hasChildMatchingComponent(subfolder, searchTerm)
        );
      });

    const hasMatching = hasMatchingComponents || hasMatchingSubfolders;

    if (hasMatching && searchTerm && !isOpen) {
      setIsOpen(true);
    }

    return hasMatching;
  }, [searchTerm, folder, hasComponents, hasSubfolders, isOpen]);

  if (searchTerm && !hasMatchingChildren) return null;

  return (
    <div className="w-full">
      <div
        className="flex items-center px-4 py-1 cursor-pointer hover:bg-gray-100"
        onClick={toggle}
      >
        <Folder className="h-4 w-4 text-gray-400 flex-shrink-0 mr-2" />
        <span className="truncate text-sm font-medium">{folder.name}</span>
        <div className="ml-auto">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="pl-3">
          {hasComponents && (
            <div>
              {folder.components!.map((component, index) => (
                <ComponentItem
                  key={`${folder.name}-component-${index}`}
                  url={component.url}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          )}
          {hasSubfolders && (
            <div>
              {folder.folders!.map((subfolder, index) => (
                <FolderItem
                  key={`${folder.name}-folder-${index}`}
                  folder={subfolder}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderItem;
