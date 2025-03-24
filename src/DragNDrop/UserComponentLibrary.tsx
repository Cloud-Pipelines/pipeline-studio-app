/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useCallback, useEffect,useState } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  addComponentToListByText,
  addComponentToListByUrl,
  type ComponentFileEntry,
  deleteComponentFileFromList,
  getAllComponentFilesFromList,
} from "../componentStore";
import DraggableComponent from "./DraggableComponent";

const USER_COMPONENTS_LIST_NAME = "user_components";

const UserComponentLibrary = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [componentFiles, setComponentFiles] = useState(
    new Map<string, ComponentFileEntry>(),
  );

  const [isImportComponentDialogOpen, setIsImportComponentDialogOpen] =
    useState(false);

  const refreshComponents = useCallback(() => {
    getAllComponentFilesFromList(USER_COMPONENTS_LIST_NAME).then(
      setComponentFiles,
    );
  }, [setComponentFiles]);

  useEffect(refreshComponents, [refreshComponents]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onabort = () => console.log("file reading was aborted");
        reader.onerror = () => console.log("file reading has failed");
        reader.onload = async () => {
          const binaryStr = reader.result;
          if (binaryStr === null || binaryStr === undefined) {
            console.error(`Dropped file reader result was ${binaryStr}`);
            return;
          }
          try {
            const componentRefPlusData = await addComponentToListByText(
              USER_COMPONENTS_LIST_NAME,
              binaryStr,
            );
            const componentRef = componentRefPlusData.componentRef;
            console.debug("storeComponentText succeeded", componentRef);
            (window as any).gtag?.("event", "UserComponents_component_import", {
              result: "succeeded",
            });
            setErrorMessage("");
            refreshComponents();
          } catch (err) {
            const errorMessage =
              typeof err === "object" && err ? err.toString() : String(err);
            setErrorMessage(
              `Error parsing the dropped file as component: ${errorMessage}.`,
            );
            console.error("Error parsing the dropped file as component", err);
            (window as any).gtag?.("event", "UserComponents_component_import", {
              result: "failed",
            });
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [refreshComponents],
  );

  const onImportFromUrl = useCallback(
    async (url: string) => {
      try {
        const componentFileEntry = await addComponentToListByUrl(
          USER_COMPONENTS_LIST_NAME,
          url,
        );
        const componentRef = componentFileEntry.componentRef;
        console.debug("addComponentToListByUrl succeeded", componentRef);
        (window as any).gtag?.(
          "event",
          "UserComponents_component_import_from_url_succeeded",
        );
        setErrorMessage("");
        refreshComponents();
        setIsImportComponentDialogOpen(false);
      } catch (err) {
        const errorMessage =
          typeof err === "object" && err ? err.toString() : String(err);
        setErrorMessage(
          `Error parsing the file as component: ${errorMessage}.`,
        );
        console.error("Error importing component from the URL", err);
        (window as any).gtag?.(
          "event",
          "UserComponents_component_import_from_url_failed",
        );
      }
    },
    [refreshComponents],
  );

  const handleDelete = useCallback(
    (fileName: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (fileName) {
        deleteComponentFileFromList(USER_COMPONENTS_LIST_NAME, fileName)
          .then(() => refreshComponents())
          .catch((err) => console.error("Error deleting component:", err));
      }
    },
    [refreshComponents],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/yaml": [".yaml"],
    },
  });

  return (
    <div>
      <Button onClick={() => setIsImportComponentDialogOpen(true)}>
        Import from URL
      </Button>
      <div {...getRootProps()}>
        <Input {...getInputProps()} />
        <div className="border border-black p-4 min-h-12">
          {isDragActive
            ? "Drop the files here ..."
            : errorMessage ||
              "Drag and drop component.yaml files or click to select files"}
          {Array.from(componentFiles.entries()).map(([fileName, fileEntry]) => (
            <>
              <DraggableComponent
                key={fileName}
                componentReference={fileEntry.componentRef}
              />
              <Button onClick={handleDelete(fileName)}>Delete</Button>
            </>
          ))}
        </div>
      </div>
      <ImportComponentFromUrlDialog
        isOpen={isImportComponentDialogOpen}
        onCancel={() => setIsImportComponentDialogOpen(false)}
        initialValue={"https://raw.githubusercontent.com/.../component.yaml"}
        onImport={onImportFromUrl}
      />
    </div>
  );
};

export default UserComponentLibrary;

interface SaveAsDialogProps {
  isOpen: boolean;
  onImport: (name: string) => void;
  onCancel: () => void;
  initialValue: string | undefined;
}

const ImportComponentFromUrlDialog = ({
  isOpen,
  onImport,
  onCancel,
  initialValue,
}: SaveAsDialogProps) => {
  const [url, setUrl] = useState(initialValue);

  const handleSubmit = () => {
    if (url) {
      onImport(url);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Import component"}</DialogTitle>
        </DialogHeader>

        <Label htmlFor="name">Component URL</Label>
        <Input
          id="name"
          type="text"
          placeholder={initialValue}
          required
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <DialogFooter>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} autoFocus>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
