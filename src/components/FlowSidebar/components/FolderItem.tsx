import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import { hasChildMatchingComponent } from "@/services/componentSpecService";
import { type FolderItemProps } from "@/types/componentLibrary";
import { containsSearchTerm } from "@/utils/searchUtils";

import { ComponentItemFromUrl, ComponentMarkup } from "./ComponentItem";
import UserComponentItem from "./UserComponentItem";

const FolderItem = ({ folder, searchTerm = "" }: FolderItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasComponents = folder.components && folder.components.length > 0;
  const hasSubfolders = folder.folders && folder.folders.length > 0;
  const isUserFolder = !!folder.isUserFolder;
  const prevSearchTermRef = useRef(searchTerm);

  const toggle = (e: MouseEvent) => {
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
        if (isUserFolder && component.spec) {
          if (containsSearchTerm(component.spec.name || "", searchTerm))
            return true;
          if (containsSearchTerm(component.spec.description || "", searchTerm))
            return true;

          if (
            component.spec.inputs?.some(
              (input) =>
                containsSearchTerm(input.name, searchTerm) ||
                (input.description &&
                  containsSearchTerm(input.description, searchTerm)),
            )
          )
            return true;

          if (
            component.spec.outputs?.some(
              (output) =>
                containsSearchTerm(output.name, searchTerm) ||
                (output.description &&
                  containsSearchTerm(output.description, searchTerm)),
            )
          )
            return true;

          if (
            component.name &&
            containsSearchTerm(component.name, searchTerm)
          ) {
            return true;
          }
        }

        if (!component.url) return false;
        const componentName =
          component.url.split("/").pop()?.replace(".yaml", "") || "";
        // Check full URL for matches like "GCS" which might be in the URL path
        return (
          containsSearchTerm(componentName, searchTerm) ||
          containsSearchTerm(component.url, searchTerm)
        );
      });

    const hasMatchingSubfolders =
      hasSubfolders &&
      folder.folders &&
      folder.folders.some(
        (subfolder) =>
          containsSearchTerm(subfolder.name, searchTerm) ||
          hasChildMatchingComponent(subfolder, searchTerm),
      );

    const hasMatches = hasMatchingComponents || hasMatchingSubfolders;

    if (hasMatches && !isOpen) setIsOpen(true);

    return hasMatches;
  }, [searchTerm, folder, hasComponents, hasSubfolders, isOpen, isUserFolder]);

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
        role="button"
        aria-expanded={isOpen}
        aria-label={`Folder: ${folder.name}`}
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
              {folder.components.map((component, index) => {
                const key = `${folder.name}-component-${index}`;

                // if the component has a spec or is a user component, render the appropriate component
                // otherwise, render using URL
                if (component.spec) {
                  if (isUserFolder && component.spec.name) {
                    return (
                      <UserComponentItem
                        key={key}
                        url={component.url || ""}
                        fileName={component.spec.name || ""}
                        componentSpec={component.spec}
                        componentDigest={component.digest || ""}
                        componentText={component.text || ""}
                        displayName={component.spec.name || ""}
                        searchTerm={searchTerm}
                      />
                    );
                  }

                  return (
                    <ComponentMarkup
                      key={key}
                      url={component.url || ""}
                      componentSpec={component.spec}
                      componentDigest={component.digest || ""}
                      componentText={component.text || ""}
                      displayName={component.spec.name || ""}
                    />
                  );
                }

                return (
                  <ComponentItemFromUrl
                    key={key}
                    url={component.url}
                    searchTerm={searchTerm}
                  />
                );
              })}
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
