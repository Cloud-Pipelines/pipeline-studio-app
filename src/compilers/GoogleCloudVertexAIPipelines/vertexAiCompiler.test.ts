/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { test, expect } from 'vitest';
import type { ComponentSpec } from "../../componentSpec";
import { buildVertexPipelineJobFromGraphComponent } from "./vertexAiCompiler";

test("buildVertexPipelineJobFromGraphComponent compiles Data_passing_pipeline", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../testData/Data_passing_pipeline/pipeline.component.yaml"
  );
  const expectedPath = path.resolve(
    __dirname,
    "./testData/Data_passing_pipeline/google_cloud_vertex_pipeline.json"
  );
  const pipelineText = fs.readFileSync(sourcePath).toString();
  const pipelineSpec = yaml.load(pipelineText) as ComponentSpec;
  const actualResult = buildVertexPipelineJobFromGraphComponent(
    pipelineSpec,
    "gs://some-bucket/",
    new Map(
      Object.entries({
        anything_param: "anything_param",
        something_param: "something_param",
        string_param: "string_param_override",
      })
    )
  );
  if (fs.existsSync(expectedPath)) {
    const expectedResultText = fs.readFileSync(expectedPath).toString();
    const expectedResult = JSON.parse(expectedResultText);
    expect(actualResult).toEqual(expectedResult);
  } else {
    fs.writeFileSync(expectedPath, JSON.stringify(actualResult, undefined, 2));
    expect.fail("Expected result file doesn't exist. A new file has been created.");
  }
});

test("buildVertexPipelineJobFromGraphComponent compiles XGBoost_pipeline", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../testData/XGBoost_pipeline/pipeline.component.yaml"
  );
  const expectedPath = path.resolve(
    __dirname,
    "./testData/XGBoost_pipeline/google_cloud_vertex_pipeline.json"
  );
  const pipelineText = fs.readFileSync(sourcePath).toString();
  const pipelineSpec = yaml.load(pipelineText) as ComponentSpec;
  const actualResult = buildVertexPipelineJobFromGraphComponent(
    pipelineSpec,
    "gs://some-bucket/",
    new Map()
  );
  if (fs.existsSync(expectedPath)) {
    const expectedResultText = fs.readFileSync(expectedPath).toString();
    const expectedResult = JSON.parse(expectedResultText);
    expect(actualResult).toEqual(expectedResult);
  } else {
    fs.writeFileSync(expectedPath, JSON.stringify(actualResult, undefined, 2));
    expect.fail("Expected result file doesn't exist. A new file has been created.");
  }
});

test("buildVertexPipelineJobFromGraphComponent compiles Name_collision_pipeline", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../testData/Name_collision_pipeline/pipeline.component.yaml"
  );
  const expectedPath = path.resolve(
    __dirname,
    "./testData/Name_collision_pipeline/google_cloud_vertex_pipeline.json"
  );
  const pipelineText = fs.readFileSync(sourcePath).toString();
  const pipelineSpec = yaml.load(pipelineText) as ComponentSpec;
  const actualResult = buildVertexPipelineJobFromGraphComponent(
    pipelineSpec,
    "gs://some-bucket/",
    new Map()
  );
  if (fs.existsSync(expectedPath)) {
    const expectedResultText = fs.readFileSync(expectedPath).toString();
    const expectedResult = JSON.parse(expectedResultText);
    expect(actualResult).toEqual(expectedResult);
  } else {
    fs.writeFileSync(expectedPath, JSON.stringify(actualResult, undefined, 2));
    expect.fail("Expected result file doesn't exist. A new file has been created.");
  }
});
