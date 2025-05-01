import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { type MouseEvent, type ReactNode, useState } from "react";

import { type FolderItemProps } from "@/types/componentLibrary";

import { ComponentItemFromUrl, ComponentMarkup } from "./ComponentItem";
import UserComponentItem from "./UserComponentItem";

interface FolderItemMarkupProps {
  children: ReactNode;
  folderName: string;
}

const FolderItemMarkup = ({ children, folderName }: FolderItemMarkupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const chevronStyles = "h-4 w-4 text-gray-400 flex-shrink-0";
  return (
    <div className="w-full">
      <div
        className="flex items-center px-4 py-1 cursor-pointer hover:bg-gray-100"
        onClick={toggle}
        role="button"
        aria-expanded={isOpen}
        aria-label={`Folder: ${folderName}`}
      >
        <Folder className={chevronStyles + " mr-2"} />
        <span className="truncate text-sm font-medium">{folderName}</span>
        <div className="ml-auto">
          {isOpen ? (
            <ChevronDown className={chevronStyles} />
          ) : (
            <ChevronRight className={chevronStyles} />
          )}
        </div>
      </div>
      <div className="px-4">{isOpen && children}</div>
    </div>
  );
};

const FolderItem = ({ folder }: FolderItemProps) => {
  const hasComponents = folder.components && folder.components.length > 0;
  const hasSubfolders = folder.folders && folder.folders.length > 0;
  const isUserFolder = !!folder.isUserFolder;

  return (
    <FolderItemMarkup folderName={folder.name}>
      {hasComponents && folder.components && (
        <div>
          {folder.components.map((component) => {
            const key = `${folder.name}-component-${component.name || component?.spec?.name}`;
            // if the component has a spec or is a user component, render the appropriate component
            // otherwise, render using URL
            if (component.spec) {
              if (isUserFolder && component.spec.name) {
                return (
                  <UserComponentItem
                    key={key}
                    url={component.url || ""}
                    fileName={component.name || ""}
                    componentSpec={component.spec}
                    componentDigest={component.digest || ""}
                    componentText={component.text || ""}
                    displayName={component.spec.name || ""}
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

            return <ComponentItemFromUrl key={key} url={component.url} />;
          })}
        </div>
      )}
      {hasSubfolders && folder.folders && (
        <div>
          {folder.folders.map((subfolder, index) => (
            <FolderItem
              key={`${folder.name}-folder-${index}`}
              folder={subfolder}
            />
          ))}
        </div>
      )}
    </FolderItemMarkup>
  );
};

export default FolderItem;
export { FolderItemMarkup };
