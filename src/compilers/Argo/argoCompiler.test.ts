/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { test, expect } from "vitest";
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import type { ComponentSpec } from "../../componentSpec";
import { buildArgoWorkflowFromGraphComponent } from "./argoCompiler";

test("buildArgoWorkflowFromGraphComponent compiles Data_passing_pipeline", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../testData/Data_passing_pipeline/pipeline.component.yaml"
  );
  const expectedPath = path.resolve(
    __dirname,
    "./testData/Data_passing_pipeline/argo_workflow.yaml"
  );
  const pipelineText = fs.readFileSync(sourcePath).toString();
  const pipelineSpec = yaml.load(pipelineText) as ComponentSpec;
  const actualResult = buildArgoWorkflowFromGraphComponent(
    pipelineSpec,
    new Map(
      Object.entries({
        anything_param: "anything_param",
        something_param: "something_param",
        string_param: "string_param_override",
      })
    )
  );
  if (fs.existsSync(expectedPath)) {
    const expectedResultText = fs
      .readFileSync(expectedPath)
      .toString();
    const expectedResult = yaml.load(expectedResultText);
    expect(actualResult).toEqual(expectedResult);
  } else {
    fs.writeFileSync(
      expectedPath,
      yaml.dump(actualResult, {
        lineWidth: -1, // Don't fold long strings
        quotingType: "\"",
      })
    );
  }
});

test("buildArgoWorkflowFromGraphComponent compiles XGBoost_pipeline", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../testData/XGBoost_pipeline/pipeline.component.yaml"
  );
  const expectedPath = path.resolve(
    __dirname,
    "./testData/XGBoost_pipeline/argo_workflow.yaml"
  );
  const pipelineText = fs.readFileSync(sourcePath).toString();
  const pipelineSpec = yaml.load(pipelineText) as ComponentSpec;
  const actualResult = buildArgoWorkflowFromGraphComponent(
    pipelineSpec,
    new Map()
  );
  if (fs.existsSync(expectedPath)) {
    const expectedResultText = fs
      .readFileSync(expectedPath)
      .toString();
    const expectedResult = yaml.load(expectedResultText);
    expect(actualResult).toEqual(expectedResult);
  } else {
    fs.writeFileSync(
      expectedPath,
      yaml.dump(actualResult, {
        lineWidth: -1, // Don't fold long strings
        quotingType: "\"",
      })
    );
  }
});

test("buildArgoWorkflowFromGraphComponent compiles Name_collision_pipeline", () => {
  const sourcePath = path.resolve(
    __dirname,
    "../testData/Name_collision_pipeline/pipeline.component.yaml"
  );
  const expectedPath = path.resolve(
    __dirname,
    "testData/Name_collision_pipeline/argo_workflow.yaml"
  );
  const pipelineText = fs.readFileSync(sourcePath).toString();
  const pipelineSpec = yaml.load(pipelineText) as ComponentSpec;
  const actualResult = buildArgoWorkflowFromGraphComponent(
    pipelineSpec,
    new Map()
  );
  if (fs.existsSync(expectedPath)) {
    const expectedResultText = fs.readFileSync(expectedPath).toString();
    const expectedResult = yaml.load(expectedResultText);
    expect(actualResult).toEqual(expectedResult);
  } else {
    fs.writeFileSync(
      expectedPath,
      yaml.dump(actualResult, {
        lineWidth: -1, // Don't fold long strings
        quotingType: '"',
      })
    );
  }
});
