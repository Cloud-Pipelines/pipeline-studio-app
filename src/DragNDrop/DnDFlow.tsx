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

import { ComponentSpecProvider } from "../providers/ComponentSpecProvider";
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
      <Sidebar />
      <PipelineAutoSaver />
    </>
  );
};

export default DnDFlow;
