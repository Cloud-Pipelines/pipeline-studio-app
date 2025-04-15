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
import { useEffect, useState } from "react";

import loadPipelineByName from "@/utils/loadPipelineByName";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

import { getAppSettings } from "../appSettings";
import { downloadDataWithCache } from "../cacheUtils";
import type { ComponentSpec } from "../componentSpec";
import { type ComponentReferenceWithSpec } from "../componentStore";
import { PipelineAutoSaver } from "../utils/PipelineAutoSaver";
import GraphComponentSpecFlow from "./GraphComponentSpecFlow";
import Sidebar from "./Sidebar";

const GRID_SIZE = 10;

const DnDFlow = () => {
  const location = useLocation();
  const [isDirty, setIsDirty] = useState(false);
  const [componentSpec, setComponentSpec] = useState<
    ComponentSpec | undefined
  >();
  const [appSettings] = useState(getAppSettings());

  const downloadData = downloadDataWithCache;

  useEffect(() => {
    const loadPipeline = async () => {
      const experimentName = location.pathname.split("/").pop();
      if (!experimentName) {
        return;
      }

      const result = await loadPipelineByName(experimentName);

      const preparedComponentRef = await prepareComponentRefForEditor(
        result.experiment?.componentRef as ComponentReferenceWithSpec,
      );

      setComponentSpec(preparedComponentRef);
    };
    loadPipeline();
  }, []);

  if (componentSpec === undefined) {
    return <></>;
  }

  const handleSetComponentSpec = (componentSpec: ComponentSpec) => {
    setComponentSpec(componentSpec);
    setIsDirty(true);
  };

  return (
    <div className="dndflow">
      <DndContext>
        <ReactFlowProvider>
          <div className="reactflow-wrapper">
            <GraphComponentSpecFlow
              componentSpec={componentSpec}
              setComponentSpec={handleSetComponentSpec}
              snapToGrid={true}
              snapGrid={[GRID_SIZE, GRID_SIZE]}
            >
              <MiniMap />
              <Controls />
              <Background gap={GRID_SIZE} />
            </GraphComponentSpecFlow>
          </div>
          <Sidebar
            componentSpec={componentSpec}
            setComponentSpec={handleSetComponentSpec}
            isDirty={isDirty}
            setIsDirty={setIsDirty}
            appSettings={appSettings}
            downloadData={downloadData}
          />
          <PipelineAutoSaver componentSpec={componentSpec} />
        </ReactFlowProvider>
      </DndContext>
    </div>
  );
};

export default DnDFlow;
