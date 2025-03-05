/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useEffect, useState } from "react";
import type { DownloadDataType } from "../cacheUtils";
import { downloadDataWithCache, loadObjectFromYamlData } from "../cacheUtils";
import type { ComponentReference } from "../componentSpec";
import type { ComponentReferenceWithSpec } from "../componentStore";
import { fullyLoadComponentRef } from "../componentStore";
import DraggableComponent from "./DraggableComponent";

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

interface DraggableComponentRowProps {
  componentRef: ComponentReference;
  downloadData: DownloadDataType;
}

export const DraggableComponentRow = ({
  componentRef,
  downloadData = downloadDataWithCache,
}: DraggableComponentRowProps) => {
  const [componentRefWithSpec, setComponentRefWithSpec] = useState<
    ComponentReferenceWithSpec | undefined
  >(undefined);
  useEffect(() => {
    // TODO: Validate the component
    // Loading the component (preloading the graph component children as well).
    fullyLoadComponentRef(componentRef, downloadData).then(
      setComponentRefWithSpec,
    );
  }, [componentRef, downloadData]);

  if (componentRefWithSpec === undefined) {
    return <div>Loading...</div>;
  } else {
    return <DraggableComponent componentReference={componentRefWithSpec} />;
  }
};

export const FoldersAndComponentsVis = ({
  folder,
  isOpen = false,
  downloadData = downloadDataWithCache,
}: {
  folder: ComponentLibraryFolder;
  isOpen?: boolean;
  downloadData: DownloadDataType;
}) => {
  return (
    <>
      {folder.folders &&
        Array.from(folder.folders).map((componentFolder, index) => (
          <SingleFolderVis
            key={componentFolder.name}
            folder={componentFolder}
            isOpen={isOpen && index === 0}
            downloadData={downloadData}
          />
        ))}
      {folder.components &&
        Array.from(folder.components).map((componentReference) => (
          <DraggableComponentRow
            key={
              componentReference.digest ||
              componentReference.url ||
              componentReference.text
            }
            componentRef={componentReference}
            downloadData={downloadData}
          />
        ))}
    </>
  );
};

export const SingleFolderVis = ({
  folder,
  isOpen = false,
  downloadData = downloadDataWithCache,
}: {
  folder: ComponentLibraryFolder;
  isOpen?: boolean;
  downloadData: DownloadDataType;
}) => {
  return (
    <details
      key={folder.name}
      open={isOpen}
      style={{
        border: "1px solid #aaa",
        borderRadius: "4px",
        padding: "4px",
        paddingLeft: "10px",
      }}
    >
      <summary
        style={{
          borderWidth: "1px",
          padding: "4px",
          // Managing the summary text overflow
          // Having the styles in <strong> causes the summary marker and the text to be on different lines.
          textOverflow: "ellipsis",
          //maxWidth: "90%",
          overflow: "hidden",
          whiteSpace: "nowrap",
          //display: "block",
        }}
        title={folder.name}
      >
        <strong>{folder.name}</strong>
      </summary>
      <FoldersAndComponentsVis
        folder={folder}
        isOpen={isOpen}
        downloadData={downloadData}
      />
    </details>
  );
};

export const ComponentLibraryVisFromStruct = ({
  componentLibraryStruct,
  downloadData = downloadDataWithCache,
}: {
  componentLibraryStruct: ComponentLibraryStruct;
  downloadData: DownloadDataType;
}) => {
  return (
    <>
      {Array.from(componentLibraryStruct.folders).map(
        (componentFolder, index) => (
          <SingleFolderVis
            key={componentFolder.name}
            folder={componentFolder}
            isOpen={index === 0}
            downloadData={downloadData}
          />
        ),
      )}
    </>
  );
};

const loadComponentLibraryStructFromData = async (data: ArrayBuffer) => {
  const componentLibrary = loadObjectFromYamlData(data);
  if (!isValidComponentLibraryStruct(componentLibrary)) {
    throw Error(
      `Invalid Component library data structure: ${componentLibrary}`,
    );
  }
  return componentLibrary;
};

const loadComponentLibraryStructFromUrl = async (
  url: string,
  downloadData: DownloadDataType = downloadDataWithCache,
) => {
  const componentLibrary = await downloadData(
    url,
    loadComponentLibraryStructFromData,
  );
  return componentLibrary;
};

interface ComponentLibraryVisFromUrlProps {
  url: string;
  downloadData: DownloadDataType;
}

const ComponentLibraryVisFromUrl = ({
  url,
  downloadData = downloadDataWithCache,
}: ComponentLibraryVisFromUrlProps) => {
  const [componentLibraryStruct, setComponentLibraryStruct] = useState<
    ComponentLibraryStruct | undefined
  >();

  useEffect(() => {
    if (componentLibraryStruct === undefined) {
      (async () => {
        try {
          const loadedComponentLibrary =
            await loadComponentLibraryStructFromUrl(url, downloadData);
          setComponentLibraryStruct(loadedComponentLibrary);
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [componentLibraryStruct, url, downloadData]);

  return componentLibraryStruct === undefined ? (
    <>The library is not loaded</>
  ) : (
    <ComponentLibraryVisFromStruct
      componentLibraryStruct={componentLibraryStruct}
      downloadData={downloadData}
    />
  );
};

export default ComponentLibraryVisFromUrl;
