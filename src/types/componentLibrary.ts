import type { ComponentReference } from "@/componentSpec";

export type ComponentItemProps = {
  url?: string;
  componentRef?: ComponentReference;
  searchTerm?: string;
};

export type ComponentFolder = {
  name: string;
  components?: ComponentReference[];
  folders?: ComponentFolder[];
};

export type FolderItemProps = {
  folder: ComponentFolder;
  depth?: number;
  searchTerm?: string;
};

export type SearchInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
