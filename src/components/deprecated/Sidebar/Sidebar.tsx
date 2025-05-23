/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { type DragEvent, useMemo, useState } from "react";

import { getAppSettings } from "@/appSettings";
import { Button } from "@/components/ui/button";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { downloadDataWithCache } from "@/utils/cache";

import AppSettingsDialog from "./AppSettingsDialog";
import ComponentLibrary from "./ComponentLibrary/ComponentLibrary";
import ComponentSearch from "./ComponentLibrary/ComponentSearch";
import UserComponentLibrary from "./ComponentLibrary/UserComponentLibrary";
import GraphComponentExporter from "./GraphComponentExporter";
import PipelineLibrary from "./PipelineLibrary/PipelineLibrary";
import PipelineSubmitter from "./PipelineSubmitter/PipelineSubmitter";
import VertexAiExporter from "./VertexAiExporter";

const Sidebar = () => {
  const { componentSpec, setComponentSpec } = useComponentSpec();

  const appSettings = useMemo(() => getAppSettings(), []);

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  // Do not include the DebugScratch in the production build
  let DebugScratchElement = () => null;
  if (import.meta.env.NODE_ENV === "development") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const DebugScratch = require("./DebugScratch").default;
      DebugScratchElement = () =>
        DebugScratch({
          componentSpec: componentSpec,
          setComponentSpec: setComponentSpec,
          downloadData: downloadDataWithCache,
        });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <aside className="nodeList">
      Save/Load pipeline
      <PipelineLibrary />
      <details
        style={{
          border: "1px solid #aaa",
          borderRadius: "4px",
          padding: "4px",
        }}
      >
        <summary
          style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}
        >
          Run pipeline
        </summary>
        <PipelineSubmitter
          componentSpec={componentSpec}
          googleCloudOAuthClientId={appSettings.googleCloudOAuthClientId}
        />
      </details>
      <h3>Drag components to the canvas:</h3>
      <details
        style={{
          border: "1px solid #aaa",
          borderRadius: "4px",
          padding: "4px",
        }}
      >
        <summary>
          <strong>Special</strong>
        </summary>
        <div
          className="react-flow__node react-flow__node-task sidebar-node flex items-center justify-center border-2 border-slate-300 rounded-md min-h-10"
          onDragStart={(event: DragEvent) =>
            onDragStart(event, { input: { label: "Input" } })
          }
          draggable
        >
          Input
        </div>
        <div
          className="react-flow__node react-flow__node-task sidebar-node flex items-center justify-center border-2 border-slate-300 rounded-md min-h-10"
          onDragStart={(event: DragEvent) =>
            onDragStart(event, { output: { label: "Output" } })
          }
          draggable
        >
          Output
        </div>
      </details>
      <details open>
        <summary
          style={{
            border: "1px solid #aaa",
            borderRadius: "4px",
            padding: "4px",
          }}
        >
          <strong>Component library</strong>
        </summary>
        <div style={{ paddingLeft: "10px" }}>
          <ComponentLibrary
            url={appSettings.componentLibraryUrl}
            downloadData={downloadDataWithCache}
          />
        </div>
      </details>
      <details
        style={{
          border: "1px solid #aaa",
          borderRadius: "4px",
          padding: "4px",
        }}
      >
        <summary
          style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}
        >
          User components
        </summary>
        <UserComponentLibrary />
      </details>
      <details
        open
        style={{
          border: "1px solid #aaa",
          borderRadius: "4px",
          padding: "4px",
        }}
      >
        <summary
          style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}
        >
          Component search
        </summary>
        <ComponentSearch
          componentFeedUrls={appSettings.componentFeedUrls}
          gitHubSearchLocations={appSettings.gitHubSearchLocations}
          downloadData={downloadDataWithCache}
        />
      </details>
      {/* Unmounting the dialog control to reset the state when closed. */}
      {isSettingsDialogOpen && (
        <AppSettingsDialog
          isOpen={isSettingsDialogOpen}
          handleClose={() => {
            setIsSettingsDialogOpen(false);
          }}
        />
      )}
      <details>
        <summary>Debug and developer tools</summary>
        <Button
          onClick={() => {
            setIsSettingsDialogOpen(true);
          }}
        >
          Settings
        </Button>

        <GraphComponentExporter componentSpec={componentSpec} />
        <VertexAiExporter componentSpec={componentSpec} />
        <DebugScratchElement />
      </details>
    </aside>
  );
};

export default Sidebar;

const onDragStart = (event: DragEvent, nodeData: object) => {
  event.dataTransfer.setData("application/reactflow", JSON.stringify(nodeData));
  event.dataTransfer.setData(
    "DragStart.offset",
    JSON.stringify({
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY,
    }),
  );
  event.dataTransfer.effectAllowed = "move";
};
