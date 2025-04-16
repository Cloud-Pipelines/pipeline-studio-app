import type { ComponentReference } from "@/componentSpec";

export type ComponentItemProps = {
  url: string | undefined;
  searchTerm?: string;
};

export type ComponentFolder = {
  name: string;
  components?: ComponentReference[];
  folders?: ComponentFolder[];
};

export type FolderItemProps = {
  folder: ComponentFolder;
  searchTerm?: string;
};

export type SearchInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
