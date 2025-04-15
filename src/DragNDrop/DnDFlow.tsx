/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import "./dnd.css";

import { DndContext } from "@dnd-kit/core";
import { useLocation } from "@tanstack/react-router";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "@xyflow/react";

import { getAppSettings } from "../appSettings";
import { downloadDataWithCache } from "../cacheUtils";
import {
  ComponentSpecProvider,
  useComponentSpec,
} from "../providers/ComponentSpecProvider";
import { PipelineAutoSaver } from "../utils/PipelineAutoSaver";
import GraphComponentSpecFlow from "./GraphComponentSpecFlow";
import Sidebar from "./Sidebar";

const GRID_SIZE = 10;

const DnDFlow = () => {
  const location = useLocation();
  const experimentName = location.pathname.split("/").pop() || "";

  return (
    <ComponentSpecProvider experimentName={experimentName}>
      <div className="dndflow">
        <DndContext>
          <ReactFlowProvider>
            <PageWrapper />
          </ReactFlowProvider>
        </DndContext>
      </div>
    </ComponentSpecProvider>
  );
};

const PageWrapper = () => {
  return (
    <>
      <div className="reactflow-wrapper">
        <GraphComponentSpecFlow snapGrid={[GRID_SIZE, GRID_SIZE]} snapToGrid>
          <MiniMap />
          <Controls />
          <Background gap={GRID_SIZE} />
        </GraphComponentSpecFlow>
      </div>
      <SidebarWrapper />
      <PipelineAutoSaverWrapper />
    </>
  );
};

const SidebarWrapper = () => {
  const { componentSpec, setComponentSpec, isDirty } = useComponentSpec();
  const appSettings = getAppSettings();
  const downloadData = downloadDataWithCache;

  return (
    <Sidebar
      componentSpec={componentSpec}
      setComponentSpec={setComponentSpec}
      isDirty={isDirty}
      appSettings={appSettings}
      downloadData={downloadData}
    />
  );
};

const PipelineAutoSaverWrapper = () => {
  const { componentSpec } = useComponentSpec();

  return <PipelineAutoSaver componentSpec={componentSpec} />;
};

export default DnDFlow;
