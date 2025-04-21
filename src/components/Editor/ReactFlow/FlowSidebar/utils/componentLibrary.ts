import type { ComponentReference } from "@/componentSpec";

export type ComponentLibraryFolder = {
  name: string;
  folders: ComponentLibraryFolder[];
  components: ComponentReference[];
};

export type ComponentLibraryStruct = {
  annotations?: {
    [k: string]: unknown;
  };
  folders: ComponentLibraryFolder[];
};

export const isValidComponentLibraryStruct = (
  obj: object,
): obj is ComponentLibraryStruct => "folders" in obj;
