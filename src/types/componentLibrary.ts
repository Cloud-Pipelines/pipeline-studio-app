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
};

export type SearchInputProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
