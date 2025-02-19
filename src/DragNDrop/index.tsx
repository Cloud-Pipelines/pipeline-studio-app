/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useEffect, useState } from 'react';
import {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
} from '@xyflow/react';

import { downloadDataWithCache } from '../cacheUtils';
import type { ComponentSpec } from '../componentSpec';
import GraphComponentSpecFlow, {
  EMPTY_GRAPH_COMPONENT_SPEC,
} from "./GraphComponentSpecFlow";
import Sidebar from './Sidebar';
import { getAppSettings } from '../appSettings';
import { fullyLoadComponentRefFromUrl } from "../componentStore";
import {
  loadPipelineSpecFromSessionStorage,
  PipelineAutoSaver,
} from "./PipelineAutoSaver";

import './dnd.css';

const GRID_SIZE = 10;

const DnDFlow = () => {
  const [componentSpec, setComponentSpec] = useState<ComponentSpec | undefined>();
  const [appSettings] = useState(getAppSettings());

  const downloadData = downloadDataWithCache;

  useEffect(() => {
    (async () => {
      const restoredComponentSpec = loadPipelineSpecFromSessionStorage();
      if (restoredComponentSpec !== undefined) {
        setComponentSpec(restoredComponentSpec);
        return;
      }
      const defaultPipelineUrl = appSettings.defaultPipelineUrl;
      try {
        const defaultPipelineRef = await fullyLoadComponentRefFromUrl(
          defaultPipelineUrl,
          downloadData
        );
        setComponentSpec(defaultPipelineRef.spec);
      } catch (err) {
        console.error(
          `Failed to load the default pipeline from ${defaultPipelineUrl}`
        );
        console.error(err);
        setComponentSpec(EMPTY_GRAPH_COMPONENT_SPEC);
      }
    })();
  }, [appSettings.defaultPipelineUrl, downloadData]);

  if (componentSpec === undefined) {
    return <></>;
  }


  return (
    <div className="dndflow">
      <ReactFlowProvider>
        <div className="h-[100vh] w-full">
          <GraphComponentSpecFlow
            componentSpec={componentSpec}
            setComponentSpec={setComponentSpec}
            snapToGrid={true}
            snapGrid={[GRID_SIZE, GRID_SIZE]}
          >
            <MiniMap/>
            <Controls />
            <Background gap={GRID_SIZE}/>
          </GraphComponentSpecFlow>
        </div>
        <Sidebar
          componentSpec={componentSpec}
          setComponentSpec={setComponentSpec}
          appSettings={appSettings}
          downloadData={downloadData}
        />
        <PipelineAutoSaver componentSpec={componentSpec}/>
      </ReactFlowProvider>
    </div>
  );
};

export default DnDFlow;
