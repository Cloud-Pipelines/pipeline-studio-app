import {
  ChevronDown,
  ChevronRight,
  Folder,
  type LucideProps,
} from "lucide-react";
import {
  isValidElement,
  type JSXElementConstructor,
  type MouseEvent,
  useState,
} from "react";

import { type FolderItemProps } from "@/types/componentLibrary";

import { ComponentItemFromUrl, ComponentMarkup } from "./ComponentItem";

const FolderItem = ({ folder, icon }: FolderItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasComponents = folder.components && folder.components.length > 0;
  const hasSubfolders = folder.folders && folder.folders.length > 0;

  const toggle = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const Icon = icon as JSXElementConstructor<LucideProps>;
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
        {icon ? (
          <Icon className={chevronStyles + " mr-2"} />
        ) : (
          <Folder className={chevronStyles + " mr-2"} />
        )}
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
              {folder.components.map((component, idx) => {
                // If the component is a valid React element, render it directly (for special folders)
                if (isValidElement(component)) {
                  return component;
                }
                const key = `${folder.name}-component-${component.name || component?.spec?.name || component.url || idx}`;
                // If the component has a spec render the component, otherwise, render using URL
                if (component.spec) {
                  return <ComponentMarkup key={key} component={component} />;
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
        </div>
      )}
    </div>
  );
};

export default FolderItem;
