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

import FlowSidebar from "@/components/FlowSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import loadPipelineByName from "@/utils/loadPipelineByName";
import { prepareComponentRefForEditor } from "@/utils/prepareComponentRefForEditor";

import type { ComponentSpec } from "../componentSpec";
import { type ComponentReferenceWithSpec } from "../componentStore";
import GraphComponentSpecFlow from "./GraphComponentSpecFlow";
import { PipelineAutoSaver } from "./PipelineAutoSaver";

const GRID_SIZE = 10;

const DnDFlow = () => {
  const location = useLocation();
  const [componentSpec, setComponentSpec] = useState<
    ComponentSpec | undefined
  >();

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
  }, [location.pathname]);

  if (!componentSpec) {
    return <></>;
  }

  const handleSetComponentSpec = (componentSpec: ComponentSpec) => {
    setComponentSpec(componentSpec);
  };

  return (
    <SidebarProvider>
      <div className="dndflow w-full">
        <DndContext>
          <ReactFlowProvider>
            <div className="reactflow-wrapper w-full">
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

            <FlowSidebar componentSpec={componentSpec} />

            <PipelineAutoSaver componentSpec={componentSpec} />
          </ReactFlowProvider>
        </DndContext>
      </div>
    </SidebarProvider>
  );
};

export default DnDFlow;
