import type { LucideProps } from "lucide-react";
import type { ChangeEvent, ForwardRefExoticComponent } from "react";

import type { ComponentReference } from "@/utils/componentSpec";

export type ComponentItemFromUrlProps = {
  url?: string;
  componentRef?: ComponentReference;
};

export type ComponentLibrary = {
  annotations?: {
    [k: string]: unknown;
  };
  folders: ComponentFolder[];
};

export type ComponentFolder = {
  name: string;
  components?: ComponentReference[];
  folders?: ComponentFolder[];
  isUserFolder?: boolean;
};

export type FolderItemProps = {
  folder: ComponentFolder;
  icon?: ForwardRefExoticComponent<Omit<LucideProps, "ref">>;
};

export type SearchInputProps = {
  value: string;
  activeFilters: string[];
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFiltersChange: (filters: string[]) => void;
};

export type SearchFilterProps = {
  availableFilters: string[];
  activeFilters: string[];
  disableCounter?: boolean;
  onFiltersChange: (filters: string[]) => void;
};

export type SearchResult = {
  components: {
    standard: ComponentReference[];
    user: ComponentReference[];
    used: ComponentReference[];
  };
};

export const isValidComponentLibrary = (obj: object): obj is ComponentLibrary =>
  "folders" in obj;
