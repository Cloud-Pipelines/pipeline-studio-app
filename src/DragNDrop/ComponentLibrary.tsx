/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useEffect, useState } from "react";
import { DownloadDataType, downloadDataWithCache, loadObjectFromYamlData } from "../cacheUtils";

import { ComponentReference } from "../componentSpec";
import DraggableComponent from "./DraggableComponent";
import { ComponentReferenceWithSpec, fullyLoadComponentRefFromUrl } from "../componentStore";

type ComponentLibraryFolder = {
  name: string;
  folders: ComponentLibraryFolder[];
  components: ComponentReference[];
};

type ComponentLibraryStruct = {
  annotations?: {
    [k: string]: unknown;
  };
  folders: ComponentLibraryFolder[];
};

export const isValidComponentLibraryStruct = (
  obj: object
): obj is ComponentLibraryStruct => "folders" in obj;

interface DraggableComponentRowProps {
  componentUrl: string;
  downloadData: DownloadDataType;
}

const DraggableComponentRow = ({
  componentUrl,
  downloadData = downloadDataWithCache,
}: DraggableComponentRowProps) => {
  const [componentRef, setComponentRef] = useState<
    ComponentReferenceWithSpec | undefined
  >(undefined);
  useEffect(() => {
    // TODO: Validate the component
    // Loading the component (preloading the graph component children as well).
    fullyLoadComponentRefFromUrl(componentUrl, downloadData).then(
      setComponentRef
    );
  }, [componentUrl, downloadData]);

  if (componentRef === undefined) {
    return <div>Loading...</div>;
  } else {
    return <DraggableComponent componentReference={componentRef} />;
  }
};

const SingleFolderVis = ({
  folder,
  isOpen = false,
  downloadData = downloadDataWithCache
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
      <summary style={{ borderWidth: "1px", padding: "4px" }}>
        <strong>{folder.name}</strong>
      </summary>
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
        Array.from(folder.components).map(
          (componentReference) =>
            componentReference.url && (
              <DraggableComponentRow
                key={componentReference.url}
                componentUrl={componentReference.url}
                downloadData={downloadData}
              />
            )
        )}
    </details>
  );
};

const ComponentLibraryVisFromStruct = ({
  componentLibraryStruct,
  downloadData = downloadDataWithCache
}: {
  componentLibraryStruct?: ComponentLibraryStruct;
  downloadData: DownloadDataType;
}) => {
  return (
    <details open>
      <summary
        style={{
          border: "1px solid #aaa",
          padding: "4px",
          borderRadius: "4px",
        }}
      >
        <strong>Component library</strong>
      </summary>
      <div style={{ paddingLeft: "10px" }}>
        {componentLibraryStruct === undefined
          ? "The library is not loaded"
          : Array.from(componentLibraryStruct.folders).map(
              (componentFolder, index) => (
                <SingleFolderVis
                  key={componentFolder.name}
                  folder={componentFolder}
                  isOpen={index === 0}
                  downloadData={downloadData}
                />
              )
            )}
      </div>
    </details>
  );
};

const loadComponentLibraryStructFromData = async (data: ArrayBuffer) => {
  const componentLibrary = loadObjectFromYamlData(data);
  if (!isValidComponentLibraryStruct(componentLibrary)) {
    throw Error(
      `Invalid Component library data structure: ${componentLibrary}`
    );
  }
  return componentLibrary;
};

const loadComponentLibraryStructFromUrl = async (
  url: string,
  downloadData: DownloadDataType = downloadDataWithCache
) => {
  const componentLibrary = await downloadData(
    url,
    loadComponentLibraryStructFromData
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

  return (
    <ComponentLibraryVisFromStruct
      componentLibraryStruct={componentLibraryStruct}
      downloadData={downloadData}
    />
  );
};

export default ComponentLibraryVisFromUrl;
