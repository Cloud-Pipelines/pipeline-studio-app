import { useCallback } from "react";
import { useRef } from "react";

import { downloadData } from "@/cacheUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isGraphImplementation } from "@/componentSpec";
import {
  addComponentToListByText,
  loadComponentAsRefFromText,
  preloadComponentReferences,
} from "@/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

const removeSuffixes = (s: string, suffixes: string[]) => {
  for (const suffix of suffixes) {
    if (s.endsWith(suffix)) {
      s = s.substring(0, s.length - suffix.length);
    }
  }
  return s;
};

const ImportExperiment = () => {
  const fileInput = useRef<HTMLInputElement>(null);

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
          } catch (err) {
            console.error("Error parsing the dropped file as component", err);
            (window as any).gtag?.("event", "PipelineLibrary_pipeline_import", {
              result: "failed",
            });
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [downloadData],
  );

  return (
    <div>
      <Input
        ref={fileInput}
        type="file"
        accept=".yaml"
        onChange={(e) => onDrop(Array.from(e.target.files ?? []))}
        style={{ display: "none" }}
      />
      <Button color="primary" onClick={() => fileInput.current?.click()}>
        + Import
      </Button>
    </div>
  );
};

export default ImportExperiment;
