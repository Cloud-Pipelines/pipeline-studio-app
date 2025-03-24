/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@xyflow/react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EDITOR_PATH, USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import type { DownloadDataType } from "../cacheUtils";
import { downloadDataWithCache } from "../cacheUtils";
import type { ComponentSpec } from "../componentSpec";
import {
  type ComponentFileEntry,
  componentSpecToYaml,
  getComponentFileFromList,
  writeComponentToFileListFromText,
} from "../componentStore";
import { preloadComponentReferences } from "../componentStore";
import { updateComponentSpecFromNodes } from "../utils/updateComponentSpecFromNodes";
import GraphComponentLink from "./GraphComponentLink";

interface PipelineLibraryProps {
  componentSpec?: ComponentSpec;
  setComponentSpec?: (componentSpec: ComponentSpec) => void;
  samplePipelineLibraryUrl?: string;
  downloadData: DownloadDataType;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
}

interface SavePipelineAsDialogProps {
  isOpen: boolean;
  onPipelineSave: (name: string, overwrite: boolean) => Promise<void>;
  onCancel: () => void;
  initialName?: string;
}

const SavePipelineAsDialog = ({
  isOpen,
  onPipelineSave,
  onCancel,
  initialName,
}: SavePipelineAsDialogProps) => {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | undefined>(initialName);
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false);

  const handleSave = async (name: string) => {
    setFileName(name);
    try {
      await onPipelineSave(name, false);
    } catch {
      setIsOverwriteDialogOpen(true);
    }

    navigate({
      to: `${EDITOR_PATH}/${name}`,
    });
  };

  const handleOverwriteOk = () => {
    if (fileName) {
      setIsOverwriteDialogOpen(false);
      onPipelineSave(fileName, true);
    }
    onCancel();
  };

  const handleOverwriteCancel = () => {
    setIsOverwriteDialogOpen(false);
  };

  return (
    <>
      <SaveAsDialog
        isOpen={isOpen}
        onSave={handleSave}
        onCancel={onCancel}
        initialValue={fileName}
        inputLabel="Pipeline name"
      />
      <OkCancelDialog
        isOpen={isOpen && isOverwriteDialogOpen}
        title="Overwrite?"
        okButtonText="Overwrite"
        onOk={handleOverwriteOk}
        onCancel={handleOverwriteCancel}
      />
    </>
  );
};

interface OkCancelDialogProps {
  isOpen: boolean;
  title: string;
  okButtonText?: string;
  cancelButtonText?: string;
  onOk: () => void;
  onCancel: () => void;
}

const OkCancelDialog = ({
  isOpen,
  title,
  okButtonText = "OK",
  cancelButtonText = "Cancel",
  onOk,
  onCancel,
}: OkCancelDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden">
          Confirm action.
        </DialogDescription>
        <DialogFooter>
          <Button color="primary" onClick={onCancel}>
            {cancelButtonText}
          </Button>
          <Button color="secondary" onClick={onOk}>
            {okButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface SaveAsDialogProps {
  isOpen: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
  initialValue: string | undefined;
  inputLabel: string;
}

const SaveAsDialog = ({
  isOpen,
  onSave,
  onCancel,
  initialValue,
  inputLabel = "Pipeline name",
}: SaveAsDialogProps) => {
  const [name, setName] = useState(initialValue);

  const handleSave = () => {
    if (name) {
      onSave(name);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{"Save pipeline"}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden">
          Enter pipeline name.
        </DialogDescription>
        <Label htmlFor="name">{inputLabel}</Label>
        <Input
          id="name"
          type="text"
          defaultValue={initialValue}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          className="w-full"
        />
        <DialogFooter>
          <Button onClick={onCancel}>Cancel</Button>
          <Button color="primary" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PipelineLibrary = ({
  componentSpec,
  setComponentSpec,
  downloadData = downloadDataWithCache,
  isDirty,
  setIsDirty,
}: PipelineLibraryProps) => {
  const [pipelineFile, setPipelineFile] = useState<ComponentFileEntry>();
  const [saveAsDialogIsOpen, setSaveAsDialogIsOpen] = useState(false);
  const nodes = useStore((store) => store.nodes);

  const openPipelineFile = useCallback(
    async (fileEntry: ComponentFileEntry) => {
      // Loading all child components
      // TODO: Move this functionality to the setComponentSpec function
      await preloadComponentReferences(
        fileEntry.componentRef.spec,
        downloadData,
      );
      setComponentSpec?.(fileEntry.componentRef.spec);
      setPipelineFile(fileEntry);
    },
    [setComponentSpec, setPipelineFile, downloadData],
  );

  const openSaveAsDialog = useCallback(() => {
    setSaveAsDialogIsOpen(true);
  }, [setSaveAsDialogIsOpen]);

  const closeSaveAsDialog = useCallback(() => {
    setSaveAsDialogIsOpen(false);
    setIsDirty(false);
  }, [setSaveAsDialogIsOpen, setIsDirty]);

  const handlePipelineSave = useCallback(
    async (name: string, overwrite: boolean = false) => {
      if (!overwrite) {
        const existingFileEntry = await getComponentFileFromList(
          USER_PIPELINES_LIST_NAME,
          name,
        );
        if (existingFileEntry !== null) {
          throw Error(`File "${name}" already exists.`);
        }
      }
      if (!componentSpec) {
        return;
      }
      const graphComponent = updateComponentSpecFromNodes(
        componentSpec,
        nodes,
        false,
        true,
      );
      graphComponent.name = name;
      const componentText = componentSpecToYaml(graphComponent);
      const fileEntry = await writeComponentToFileListFromText(
        USER_PIPELINES_LIST_NAME,
        name,
        componentText,
      );
      await openPipelineFile(fileEntry);

      closeSaveAsDialog();
    },
    [componentSpec, closeSaveAsDialog, nodes, openPipelineFile],
  );

  const componentLink = useRef<HTMLAnchorElement>(null);

  return (
    <div className="flex flex-row gap-2">
      <Button
        color="primary"
        disabled={!isDirty}
        onClick={() => {
          if (pipelineFile) {
            handlePipelineSave(pipelineFile?.name, true);
          } else {
            openSaveAsDialog();
          }
        }}
      >
        Save
      </Button>
      <Button color="primary" onClick={openSaveAsDialog}>
        Save as
      </Button>
      {componentSpec && saveAsDialogIsOpen && (
        <SavePipelineAsDialog
          initialName={componentSpec.name}
          isOpen={saveAsDialogIsOpen}
          onCancel={closeSaveAsDialog}
          onPipelineSave={handlePipelineSave}
        />
      )}
      <Button
        color="primary"
        onClick={() => {
          componentLink.current?.click();
        }}
      >
        Export
        {componentSpec && (
          <GraphComponentLink
            linkRef={componentLink}
            componentSpec={componentSpec}
            linkText="🔗"
            downloadFileName={
              (componentSpec.name ? componentSpec.name + "." : "") +
              "pipeline.component.yaml"
            }
            style={{ textDecoration: "none" }}
          />
        )}
      </Button>
    </div>
  );
};

export default PipelineLibrary;
