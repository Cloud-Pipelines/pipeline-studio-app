/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type DownloadDataType,
  downloadDataWithCache,
  loadObjectFromYamlData,
} from "@/utils/cache";
import {
  type ComponentReference,
  type ComponentSpec,
} from "@/utils/componentSpec";
import {
  type ComponentReferenceWithSpec,
  fullyLoadComponentRefFromUrl,
} from "@/utils/componentStore";

type PipelineLibraryStruct = {
  annotations?: {
    [k: string]: unknown;
  };
  components: ComponentReference[];
};

const isValidPipelineLibraryStruct = (
  obj: object,
): obj is PipelineLibraryStruct => "components" in obj;

const loadPipelineLibraryStructFromData = async (data: ArrayBuffer) => {
  const pipelineLibrary = loadObjectFromYamlData(data);
  if (!isValidPipelineLibraryStruct(pipelineLibrary)) {
    throw Error(`Invalid Component library data structure: ${pipelineLibrary}`);
  }
  return pipelineLibrary;
};

const loadPipelineLibraryStructFromUrl = async (
  url: string,
  downloadData: DownloadDataType = downloadDataWithCache,
) => {
  const pipelineLibrary = await downloadData(
    url,
    loadPipelineLibraryStructFromData,
  );
  return pipelineLibrary;
};

function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

interface PipelineLibraryProps {
  pipelineLibraryUrl: string;
  setComponentSpec?: (componentSpec: ComponentSpec) => void;
  downloadData: DownloadDataType;
}

const SamplePipelineLibrary = ({
  pipelineLibraryUrl,
  setComponentSpec,
  downloadData = downloadDataWithCache,
}: PipelineLibraryProps) => {
  const [componentRefs, setComponentRefs] = useState<
    ComponentReferenceWithSpec[]
  >([]);

  useEffect(() => {
    (async () => {
      if (componentRefs.length === 0) {
        try {
          const loadedComponentLibrary = await loadPipelineLibraryStructFromUrl(
            pipelineLibraryUrl,
            downloadData,
          );
          const pipelineUrls = loadedComponentLibrary.components
            .map((componentRef) => componentRef.url)
            .filter(notUndefined);
          const loadedComponentRefs = await Promise.all(
            pipelineUrls.map((url) =>
              fullyLoadComponentRefFromUrl(url, downloadData),
            ),
          );
          setComponentRefs(loadedComponentRefs);
        } catch (err) {
          console.error(err);
        }
      }
    })();
  }, [pipelineLibraryUrl, downloadData, componentRefs.length]);

  return (
    <div>
      {componentRefs.map((componentRef) => (
        <div key={componentRef.digest}>
          <Button
            variant="link"
            onClick={() => {
              setComponentSpec?.(componentRef.spec);
            }}
          >
            {componentRef.spec.name ?? "<Pipeline>"}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default SamplePipelineLibrary;
