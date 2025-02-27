/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { type DragEvent, useState } from 'react';

import ComponentLibrary from './ComponentLibrary'
import ComponentSearch from './ComponentSearch'
import GraphComponentExporter from './GraphComponentExporter'
import VertexAiExporter from './VertexAiExporter'
import { type ComponentSpec } from '../componentSpec';
import UserComponentLibrary from "./UserComponentLibrary";
import PipelineLibrary from "./PipelineLibrary";
import type { AppSettings } from '../appSettings';
import PipelineSubmitter from "./PipelineSubmitter";
import AppSettingsDialog from './AppSettingsDialog';
import { type DownloadDataType, downloadDataWithCache } from '../cacheUtils';

const onDragStart = (event: DragEvent, nodeData: object) => {
  event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
  event.dataTransfer.setData(
    "DragStart.offset",
    JSON.stringify({
      offsetX: event.nativeEvent.offsetX,
      offsetY: event.nativeEvent.offsetY,
    })
  );
  event.dataTransfer.effectAllowed = 'move';
};

interface SidebarProps {
  componentSpec?: ComponentSpec,
  setComponentSpec?: (componentSpec: ComponentSpec) => void,
  appSettings: AppSettings;
  downloadData: DownloadDataType;
}

const Sidebar = ({
  componentSpec,
  setComponentSpec,
  appSettings,
  downloadData = downloadDataWithCache
}: SidebarProps) => {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  // Do not include the DebugScratch in the production build
  let DebugScratchElement = () => null;
  if (import.meta.env.NODE_ENV === "development") {
    try {
      const DebugScratch = require("./DebugScratch").default;
      DebugScratchElement = () =>
        DebugScratch({
          componentSpec: componentSpec,
          setComponentSpec: setComponentSpec,
          downloadData: downloadData,
        });
    } catch (e) {}
  }

  return (
    <aside className="nodeList">
      <details style={{ border: "1px solid #aaa", borderRadius: "4px", padding: "4px" }}>
        <summary style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}>Save/Load pipeline</summary>
        <PipelineLibrary
          componentSpec={componentSpec}
          setComponentSpec={setComponentSpec}
          samplePipelineLibraryUrl={appSettings.pipelineLibraryUrl}
          downloadData={downloadData}
        />
      </details>
      <details style={{ border: "1px solid #aaa", borderRadius: "4px", padding: "4px" }}>
        <summary style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}>Run pipeline</summary>
        <PipelineSubmitter
          componentSpec={componentSpec}
          googleCloudOAuthClientId={appSettings.googleCloudOAuthClientId}
        />
      </details>
      <h3>Drag components to the canvas:</h3>
      <details style={{ border: "1px solid #aaa", borderRadius: "4px", padding: "4px" }}>
        <summary><strong>Special</strong></summary>
        <div className="react-flow__node react-flow__node-input sidebar-node" onDragStart={(event: DragEvent) => onDragStart(event, { input: { label: "Input" } })} draggable>
          Input
        </div>
        <div className="react-flow__node react-flow__node-output sidebar-node" onDragStart={(event: DragEvent) => onDragStart(event, { output: { label: "Output" } })} draggable>
          Output
        </div>
      </details>
      <details open>
        <summary style={{ border: "1px solid #aaa", borderRadius: "4px", padding: "4px" }}>
          <strong>Component library</strong>
        </summary>
        <div style={{ paddingLeft: "10px" }}>
          <ComponentLibrary
            url={appSettings.componentLibraryUrl}
            downloadData={downloadData}
          />
        </div>
      </details>
      <details style={{ border: "1px solid #aaa", borderRadius: "4px", padding: "4px" }}>
        <summary style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}>User components</summary>
        <UserComponentLibrary/>
      </details>
      <details open style={{ border: "1px solid #aaa", borderRadius: "4px", padding: "4px" }}>
        <summary style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}>Component search</summary>
        <ComponentSearch
          componentFeedUrls={appSettings.componentFeedUrls}
          gitHubSearchLocations={appSettings.gitHubSearchLocations}
          downloadData={downloadData}
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
        <button
          onClick={() => {
            setIsSettingsDialogOpen(true);
          }}
        >
          Settings
        </button>
        {componentSpec && <GraphComponentExporter componentSpec={componentSpec}/>}
        {componentSpec && <VertexAiExporter componentSpec={componentSpec}/>}
        <DebugScratchElement/>
      </details>
    </aside>
  );
};

export default Sidebar;
