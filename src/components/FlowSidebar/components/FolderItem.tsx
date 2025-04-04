import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { hasChildMatchingComponent } from "@/services/componentSpecService";
import { type FolderItemProps } from "@/types/componentLibrary";
import { containsSearchTerm } from "@/utils/searchUtils";

import ComponentItem from "./ComponentItem";

const FolderItem = ({ folder, searchTerm = "" }: FolderItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasComponents = folder.components && folder.components.length > 0;
  const hasSubfolders = folder.folders && folder.folders.length > 0;
  const prevSearchTermRef = useRef(searchTerm);

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
      return true;
    }

    // Check if any components match
    const hasMatchingComponents =
      hasComponents &&
      folder.components &&
      folder.components.some((component) => {
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
      folder.folders &&
      folder.folders.some((subfolder) => {
        return (
          containsSearchTerm(subfolder.name, searchTerm) ||
          hasChildMatchingComponent(subfolder, searchTerm)
        );
      });

    return hasMatchingComponents || hasMatchingSubfolders;
  }, [searchTerm, folder, hasComponents, hasSubfolders]);

  // Auto-open/close folders based on search term
  useEffect(() => {
    // If there's a search term and this folder has matching content, open it
    if (searchTerm && hasMatchingChildren) {
      setIsOpen(true);
    }
    // Only close folders when search term is cleared after having had a value
    // This prevents closing folders on initial load when searchTerm is ""
    else if (prevSearchTermRef.current && !searchTerm && isOpen) {
      setIsOpen(false);
    }

    // Update the ref for the next change
    prevSearchTermRef.current = searchTerm;
  }, [searchTerm, hasMatchingChildren, isOpen]);

  if (searchTerm && !hasMatchingChildren) return null;

  const chevronStyles = "h-4 w-4 text-gray-400 flex-shrink-0";
  return (
    <div className="w-full">
      <div
        className="flex items-center px-4 py-1 cursor-pointer hover:bg-gray-100"
        onClick={toggle}
      >
        <Folder className={chevronStyles + " mr-2"} />
        <span className="truncate text-sm font-medium">{folder.name}</span>
        <div className="ml-auto">
          {isOpen ? (
            <ChevronDown className={chevronStyles} />
          ) : (
            <ChevronRight className={chevronStyles} />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="pl-3">
          {hasComponents && folder.components && (
            <div>
              {folder.components.map((component, index) => (
                <ComponentItem
                  key={`${folder.name}-component-${index}`}
                  url={component.url}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          )}
          {hasSubfolders && folder.folders && (
            <div>
              {folder.folders.map((subfolder, index) => (
                <FolderItem
                  key={`${folder.name}-folder-${index}`}
                  folder={subfolder}
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
