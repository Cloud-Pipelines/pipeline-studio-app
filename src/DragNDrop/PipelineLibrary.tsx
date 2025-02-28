/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import { useCallback, useState, useEffect, useRef } from "react";
import { useStore } from "@xyflow/react";
import type { DownloadDataType } from "../cacheUtils";
import { downloadDataWithCache } from "../cacheUtils";
import type { ComponentSpec } from "../componentSpec";
import { isGraphImplementation } from "../componentSpec";
import {
  loadComponentAsRefFromText,
  getAllComponentFilesFromList,
  type ComponentFileEntry,
  addComponentToListByText,
  componentSpecToYaml,
  writeComponentToFileListFromText,
  getComponentFileFromList,
  deleteComponentFileFromList,
} from "../componentStore";
import GraphComponentLink from "./GraphComponentLink";
import { augmentComponentSpec } from "./GraphComponentSpecFlow";
import SamplePipelineLibrary from "./SamplePipelineLibrary";
import { preloadComponentReferences } from "../componentStore";

const USER_PIPELINES_LIST_NAME = "user_pipelines";

interface PipelineLibraryProps {
  componentSpec?: ComponentSpec;
  setComponentSpec?: (componentSpec: ComponentSpec) => void;
  samplePipelineLibraryUrl?: string;
  downloadData: DownloadDataType;
}

const removeSuffixes = (s: string, suffixes: string[]) => {
  for (const suffix of suffixes) {
    if (s.endsWith(suffix)) {
      s = s.substring(0, s.length - suffix.length);
    }
  }
  return s;
};

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
  const [fileName, setFileName] = useState<string | undefined>(initialName);
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false);

  const handleSave = async (name: string) => {
    setFileName(name);
    try {
      await onPipelineSave(name, false);
    } catch {
      setIsOverwriteDialogOpen(true);
    }
  };

  const handleOverwriteOk = () => {
    if (fileName) {
      setIsOverwriteDialogOpen(false);
      onPipelineSave(fileName, true);
    }
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
    <Dialog open={isOpen} aria-labelledby="alert-dialog-title">
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogActions>
        <Button color="primary" onClick={onCancel}>
          {cancelButtonText}
        </Button>
        <Button color="secondary" onClick={onOk}>
          {okButtonText}
        </Button>
      </DialogActions>
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
  const nameInputRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={isOpen} aria-labelledby="alert-dialog-title">
      <DialogTitle id="alert-dialog-title">{"Save pipeline"}</DialogTitle>
      <form
        onSubmit={(e) => {
          if (nameInputRef.current) {
            onSave(nameInputRef.current.value);
          }
          e.preventDefault();
        }}
      >
        <DialogContent>
          <TextField
            id="name"
            type="text"
            defaultValue={initialValue}
            label={inputLabel}
            inputRef={nameInputRef}
            required
            autoFocus
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button color="primary" type="submit" autoFocus>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const PipelineLibrary = ({
  componentSpec,
  setComponentSpec,
  samplePipelineLibraryUrl,
  downloadData = downloadDataWithCache,
}: PipelineLibraryProps) => {
  // const [errorMessage, setErrorMessage] = useState("");
  const [componentFiles, setComponentFiles] = useState(
    new Map<string, ComponentFileEntry>(),
  );
  const [pipelineFile, setPipelineFile] = useState<ComponentFileEntry>();
  const [saveAsDialogIsOpen, setSaveAsDialogIsOpen] = useState(false);
  const nodes = useStore((store) => store.nodes);

  const [contextMenuFileName, setContextMenuFileName] = useState<string>();
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement>();

  const refreshPipelines = useCallback(() => {
    getAllComponentFilesFromList(USER_PIPELINES_LIST_NAME).then(
      setComponentFiles,
    );
  }, [setComponentFiles]);

  useEffect(refreshPipelines, [refreshPipelines]);

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
          const fileName =
            removeSuffixes(file.name, [
              ".pipeline.component.yaml",
              ".component.yaml",
              ".pipeline.yaml",
              ".yaml",
            ]) || "Pipeline";
          try {
            const componentRef1 = await loadComponentAsRefFromText(binaryStr);
            if (!isGraphImplementation(componentRef1.spec.implementation)) {
              console.error("Dropped component is not a graph component");
              return;
            }
            // Caching the child components
            await preloadComponentReferences(componentRef1.spec, downloadData);
            // TODO: Do not load the component twice
            const componentRefPlusData = await addComponentToListByText(
              USER_PIPELINES_LIST_NAME,
              binaryStr,
              fileName,
            );
            const componentRef = componentRefPlusData.componentRef;
            console.debug("storeComponentText succeeded", componentRef);
            (window as any).gtag?.("event", "PipelineLibrary_pipeline_import", {
              result: "succeeded",
            });
            // setErrorMessage("");
            refreshPipelines();
          } catch (err) {
            // setErrorMessage(
            //   `Error parsing the dropped file as component: ${err.toString()}.`
            // );
            console.error("Error parsing the dropped file as component", err);
            (window as any).gtag?.("event", "PipelineLibrary_pipeline_import", {
              result: "failed",
            });
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [refreshPipelines, downloadData],
  );

  const openSaveAsDialog = useCallback(() => {
    setSaveAsDialogIsOpen(true);
  }, [setSaveAsDialogIsOpen]);

  const closeSaveAsDialog = useCallback(() => {
    setSaveAsDialogIsOpen(false);
  }, [setSaveAsDialogIsOpen]);

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
      const graphComponent = augmentComponentSpec(
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
      refreshPipelines();
    },
    [
      componentSpec,
      closeSaveAsDialog,
      nodes,
      openPipelineFile,
      refreshPipelines,
    ],
  );

  const handleContextMenuDelete = async () => {
    if (contextMenuFileName) {
      setContextMenuFileName(undefined);
      await deleteComponentFileFromList(
        USER_PIPELINES_LIST_NAME,
        contextMenuFileName,
      );
      refreshPipelines();
    }
  };

  const handleContextMenuOpen = async () => {
    if (contextMenuFileName) {
      setContextMenuFileName(undefined);
      const fileEntry = await getComponentFileFromList(
        USER_PIPELINES_LIST_NAME,
        contextMenuFileName,
      );
      if (!fileEntry) {
        console.error(
          `handleContextMenuOpen: File ${contextMenuFileName} does not exist.`,
        );
        return;
      }
      await openPipelineFile(fileEntry);
    }
  };

  const openSamplePipeline = useCallback(
    (pipelineSpec: ComponentSpec) => {
      //Reset current file
      setPipelineFile(undefined);
      setComponentSpec?.(pipelineSpec);
    },
    [setComponentSpec],
  );

  const fileInput = useRef<HTMLInputElement>(null);
  const componentLink = useRef<HTMLAnchorElement>(null);

  return (
    <div
      style={{
        //border: "1px solid black",
        overflow: "auto",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ margin: "5px" }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
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
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={openSaveAsDialog}
        >
          Save as
        </Button>
        <br />
        {componentSpec && saveAsDialogIsOpen && (
          <SavePipelineAsDialog
            initialName={componentSpec.name}
            isOpen={saveAsDialogIsOpen}
            onCancel={closeSaveAsDialog}
            onPipelineSave={handlePipelineSave}
          />
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".yaml"
          onChange={(e) => onDrop(Array.from(e.target.files ?? []))}
          style={{ display: "none" }}
        />
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => fileInput.current?.click()}
        >
          + Import
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => {
            componentLink.current?.click();
          }}
        >
          Export
        </Button>
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
      </div>
      <div style={{ overflow: "auto", marginLeft: "10px" }}>
        {Array.from(componentFiles.entries()).map(([fileName, fileEntry]) => (
          <div key={fileName}>
            ⋮ {/* ⋮ ≡ ⋅ */}
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => openPipelineFile(fileEntry)}
              style={
                fileName === pipelineFile?.name
                  ? { fontWeight: "bold" }
                  : undefined
              }
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenuAnchor(e.currentTarget);
                setContextMenuFileName(fileName);
              }}
            >
              {fileName}
            </Button>
          </div>
        ))}
        <Menu
          open={contextMenuFileName !== undefined}
          anchorEl={contextMenuAnchor}
          onClose={() => {
            setContextMenuFileName(undefined);
          }}
        >
          <MenuItem dense={true} onClick={handleContextMenuOpen}>
            Open
          </MenuItem>
          <MenuItem dense={true} onClick={handleContextMenuDelete}>
            Delete
          </MenuItem>
        </Menu>
      </div>
      <details
        open
        style={{
          border: "1px solid #aaa",
          borderRadius: "4px",
          padding: "4px",
        }}
      >
        <summary>
          <strong>Sample pipelines</strong>
        </summary>
        {samplePipelineLibraryUrl === undefined ? (
          "Sample pipeline library URL is undefined"
        ) : (
          <SamplePipelineLibrary
            setComponentSpec={openSamplePipeline}
            pipelineLibraryUrl={samplePipelineLibraryUrl}
            downloadData={downloadData}
          />
        )}
      </details>
    </div>
  );
};

export default PipelineLibrary;
