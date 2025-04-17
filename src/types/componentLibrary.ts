import type { ComponentReference } from "@/componentSpec";

export type ComponentItemFromUrlProps = {
  url?: string;
  componentRef?: ComponentReference;
  searchTerm?: string;
};

export type ComponentFolder = {
  name: string;
  components?: ComponentReference[];
  folders?: ComponentFolder[];
  isUserFolder?: boolean;
};

export type FolderItemProps = {
  folder: ComponentFolder;
  searchTerm?: string;
};

export type SearchInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
