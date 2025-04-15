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
import { PipelineAutoSaver } from "../utils/PipelineAutoSaver";
import {
  ComponentSpecProvider,
  useComponentSpec,
} from "./ComponentSpecProvider";
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
  const { componentSpec } = useComponentSpec();

  if (!componentSpec) {
    return null;
  }

  return (
    <>
      <div className="reactflow-wrapper">
        <GraphComponentSpecFlowWrapper />
      </div>
      <SidebarWrapper />
      <PipelineAutoSaverWrapper />
    </>
  );
};

const GraphComponentSpecFlowWrapper = () => {
  const { componentSpec, setComponentSpec } = useComponentSpec();

  if (!componentSpec) {
    return null;
  }

  return (
    <GraphComponentSpecFlow
      componentSpec={componentSpec}
      setComponentSpec={setComponentSpec}
      snapToGrid={true}
      snapGrid={[GRID_SIZE, GRID_SIZE]}
    >
      <MiniMap />
      <Controls />
      <Background gap={GRID_SIZE} />
    </GraphComponentSpecFlow>
  );
};

const SidebarWrapper = () => {
  const { componentSpec, setComponentSpec, isDirty, setIsDirty } =
    useComponentSpec();
  const appSettings = getAppSettings();
  const downloadData = downloadDataWithCache;

  return (
    <Sidebar
      componentSpec={componentSpec}
      setComponentSpec={setComponentSpec}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
      appSettings={appSettings}
      downloadData={downloadData}
    />
  );
};

const PipelineAutoSaverWrapper = () => {
  const { componentSpec } = useComponentSpec();

  if (!componentSpec) {
    return null;
  }

  return <PipelineAutoSaver componentSpec={componentSpec} />;
};

export default DnDFlow;
