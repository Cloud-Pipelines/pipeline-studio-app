import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent } from "react";

import type { ComponentReference } from "@/utils/componentSpec";

export type ComponentItemFromUrlProps = {
  url?: string;
  componentRef?: ComponentReference;
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
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
};

export type SearchFilterProps = {
  availableFilters: string[];
  activeFilters: string[];
  disableCounter?: boolean;
  onFiltersChange: (filters: string[]) => void;
};
