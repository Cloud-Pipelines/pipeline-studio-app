import { type Node } from "@xyflow/react";
import { beforeEach, describe, expect, type Mock,test, vi } from "vitest";

import {
  type ComponentSpec,
  type GraphImplementation,
  isGraphImplementation,
} from "../componentSpec";
import { updateComponentSpecFromNodes } from "./updateComponentSpecFromNodes";

vi.mock("../componentSpec", () => ({
  isGraphImplementation: vi.fn(),
}));

vi.mock("../DragNDrop/ComponentTaskNode", () => ({
  isComponentTaskNode: vi.fn((node) => node.type === "task"),
}));

const createBasicComponentSpec = (): ComponentSpec => ({
  name: "Test Component",
  inputs: [
    { name: "input1", type: "String" },
    { name: "input2", type: "Integer" },
  ],
  outputs: [
    { name: "output1", type: "String" },
    { name: "output2", type: "Integer" },
  ],
  implementation: {
    graph: {
      tasks: {
        task1: {
          componentRef: {
            url: "task1-url",
            name: "Task1Spec",
            digest: "task1-digest",
            spec: {
              name: "Task1Spec",
              implementation: { graph: { tasks: {} } },
              inputs: [],
              outputs: [],
            },
          },
        },
        task2: {
          componentRef: {
            url: "task2-url",
            name: "Task2Spec",
            digest: "task2-digest",
            spec: {
              name: "Task2Spec",
              implementation: { graph: { tasks: {} } },
              inputs: [],
              outputs: [],
            },
          },
        },
      },
    },
  },
  metadata: {
    annotations: {
      existing: "annotation",
    },
  },
});

const createNodes = (): Node[] => [
  {
    id: "input_input1",
    type: "input",
    position: { x: 100, y: 100 },
    measured: { width: 150, height: 40 },
    data: {},
  },
  {
    id: "input_input2",
    type: "input",
    position: { x: 100, y: 200 },
    measured: { width: 150, height: 40 },
    data: {},
  },
  {
    id: "output_output1",
    type: "output",
    position: { x: 500, y: 100 },
    measured: { width: 150, height: 40 },
    data: {},
  },
  {
    id: "output_output2",
    type: "output",
    position: { x: 500, y: 200 },
    measured: { width: 150, height: 40 },
    data: {},
  },
  {
    id: "task_task1",
    type: "task",
    position: { x: 300, y: 100 },
    measured: { width: 200, height: 80 },
    data: {},
  },
  {
    id: "task_task2",
    type: "task",
    position: { x: 300, y: 200 },
    measured: { width: 200, height: 80 },
    data: {},
  },
];

describe("updateComponentSpecFromNodes", () => {
  let componentSpec: ReturnType<typeof createBasicComponentSpec>;
  let nodes: Node[];

  beforeEach(() => {
    vi.resetAllMocks();
    (isGraphImplementation as unknown as Mock).mockReturnValue(true);

    componentSpec = createBasicComponentSpec();
    nodes = createNodes();
  });

  test("should add position annotations and sort nodes correctly", () => {
    const result = updateComponentSpecFromNodes(componentSpec, nodes);

    expect(result.inputs?.[0].annotations).toHaveProperty("editor.position");
    expect(
      JSON.parse(result.inputs?.[0].annotations?.["editor.position"] as string),
    ).toEqual({
      x: 100,
      y: 100,
      width: 150,
      height: 40,
    });

    expect(result.outputs?.[0].annotations).toHaveProperty("editor.position");
    expect(
      JSON.parse(
        result.outputs?.[0].annotations?.["editor.position"] as string,
      ),
    ).toEqual({
      x: 500,
      y: 100,
      width: 150,
      height: 40,
    });

    const taskSpecs = (result.implementation as GraphImplementation).graph
      .tasks;
    expect(taskSpecs.task1.annotations).toHaveProperty("editor.position");
    expect(
      JSON.parse(taskSpecs.task1.annotations?.["editor.position"] as string),
    ).toEqual({
      x: 300,
      y: 100,
      width: 200,
      height: 80,
    });

    expect(result.metadata?.annotations).toHaveProperty("sdk");
    expect(result.metadata?.annotations?.sdk).toBe(
      "https://cloud-pipelines.net/pipeline-editor/",
    );
  });

  test("should handle configuration options correctly", () => {
    const resultNoPositions = updateComponentSpecFromNodes(
      componentSpec,
      nodes,
      true,
      false,
    );
    expect(resultNoPositions.inputs?.[0].annotations).toBeUndefined();

    const resultNoSpecs = updateComponentSpecFromNodes(
      componentSpec,
      nodes,
      false,
    );
    const taskSpecsNoSpecs = (
      resultNoSpecs.implementation as GraphImplementation
    ).graph.tasks;
    expect(taskSpecsNoSpecs.task1.componentRef).not.toHaveProperty("spec");
    expect(taskSpecsNoSpecs.task1.componentRef).toHaveProperty("url");
    expect(taskSpecsNoSpecs.task1.componentRef).toHaveProperty("name");
    expect(taskSpecsNoSpecs.task1.componentRef).toHaveProperty("digest");

    const resultWithSpecs = updateComponentSpecFromNodes(
      componentSpec,
      nodes,
      true,
    );
    const taskSpecsWithSpecs = (
      resultWithSpecs.implementation as GraphImplementation
    ).graph.tasks;
    expect(taskSpecsWithSpecs.task1.componentRef).toHaveProperty("spec");
  });

  test("should throw errors for missing nodes", () => {
    const nodesNoInput = createNodes().filter(
      (node) => node.id !== "input_input1",
    );
    expect(() =>
      updateComponentSpecFromNodes(componentSpec, nodesNoInput),
    ).toThrow("The nodes array does not have input node input1");

    const nodesNoOutput = createNodes().filter(
      (node) => node.id !== "output_output1",
    );
    expect(() =>
      updateComponentSpecFromNodes(componentSpec, nodesNoOutput),
    ).toThrow("The nodes array does not have output node output1");

    const nodesNoTask = createNodes().filter(
      (node) => node.id !== "task_task1",
    );
    expect(() =>
      updateComponentSpecFromNodes(componentSpec, nodesNoTask),
    ).toThrow("The nodes array does not have task node task1");
  });

  test("should handle non-graph implementations correctly", () => {
    (isGraphImplementation as unknown as Mock).mockReturnValue(false);
    const result = updateComponentSpecFromNodes(componentSpec, nodes);
    expect(result.implementation).toEqual(componentSpec.implementation);
  });
});
