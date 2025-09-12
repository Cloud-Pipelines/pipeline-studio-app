import { act, renderHook } from "@testing-library/react";
import type { Node } from "@xyflow/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ComponentSpec,
  InputSpec,
  OutputSpec,
} from "@/utils/componentSpec";

import { useIOSelectionPersistence } from "./useIOSelectionPersistence";

// Mock only the ReactFlow hook we need
const mockSetNodes = vi.fn();
const mockGetNodes = vi.fn();

vi.mock("@xyflow/react", () => ({
  useReactFlow: () => ({
    setNodes: mockSetNodes,
    getNodes: mockGetNodes,
  }),
}));

// Helper function to create mock nodes
const createMockNode = (
  id: string,
  type: "input" | "output" | "task",
  label: string,
  selected = false,
) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { label },
  selected,
});

// Helper function to create mock component specs
const createMockComponentSpec = (
  inputs?: InputSpec[],
  outputs?: OutputSpec[],
): ComponentSpec => ({
  name: "test-component",
  inputs,
  outputs,
  implementation: {
    container: {
      image: "test-image",
    },
  },
});

describe("useIOSelectionPersistence - Selection Transfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(0);
      return 0;
    });
  });

  describe("input name changes", () => {
    it("should transfer selection when input name changes", async () => {
      const { result } = renderHook(() => useIOSelectionPersistence());

      // Set initial spec with original input name
      const initialSpec = createMockComponentSpec([
        { name: "original_input", type: "string" },
      ]);

      act(() => {
        result.current.preserveIOSelectionOnSpecChange(initialSpec);
      });

      // Mock nodes with selected input using original name
      const mockNodes = [
        createMockNode("input-0", "input", "original_input", true),
      ];
      mockGetNodes.mockReturnValue(mockNodes);

      // New spec with renamed input
      const newSpec = createMockComponentSpec([
        { name: "renamed_input", type: "string" },
      ]);

      await act(async () => {
        result.current.preserveIOSelectionOnSpecChange(newSpec);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Verify setNodes was called
      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));

      // Test the callback with new nodes that have the renamed input
      const setNodesCallback = mockSetNodes.mock.calls[0][0];
      const newNodes = [
        createMockNode("input-0", "input", "renamed_input", false),
      ];

      const updatedNodes = setNodesCallback(newNodes);
      const renamedInput = updatedNodes.find(
        (node: Node) => node.id === "input-0",
      );

      // Selection should be preserved on the renamed input
      expect(renamedInput?.selected).toBe(true);
    });

    it("should call setNodes but not restore selection when input is removed", async () => {
      const { result } = renderHook(() => useIOSelectionPersistence());

      // Set initial spec with input
      const initialSpec = createMockComponentSpec([
        { name: "input_to_remove", type: "string" },
      ]);

      act(() => {
        result.current.preserveIOSelectionOnSpecChange(initialSpec);
      });

      // Mock nodes with selected input
      const mockNodes = [
        createMockNode("input-0", "input", "input_to_remove", true),
      ];
      mockGetNodes.mockReturnValue(mockNodes);

      // New spec with no inputs
      const newSpec = createMockComponentSpec([]);

      await act(async () => {
        result.current.preserveIOSelectionOnSpecChange(newSpec);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should call setNodes because there were selected IO nodes to process
      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));

      // Test the callback - it should not restore selection since the input doesn't exist
      const setNodesCallback = mockSetNodes.mock.calls[0][0];
      const newNodes: Node[] = []; // No nodes since no inputs in new spec

      const updatedNodes = setNodesCallback(newNodes);

      // Should return empty array since no nodes match
      expect(updatedNodes).toEqual([]);
    });

    it("should preserve selection for unchanged input names", async () => {
      const { result } = renderHook(() => useIOSelectionPersistence());

      // Set initial spec
      const initialSpec = createMockComponentSpec([
        { name: "unchanged_input", type: "string" },
      ]);

      act(() => {
        result.current.preserveIOSelectionOnSpecChange(initialSpec);
      });

      // Mock nodes with selected input
      const mockNodes = [
        createMockNode("input-0", "input", "unchanged_input", true),
      ];
      mockGetNodes.mockReturnValue(mockNodes);

      // New spec with same input name
      const newSpec = createMockComponentSpec([
        { name: "unchanged_input", type: "string" },
      ]);

      await act(async () => {
        result.current.preserveIOSelectionOnSpecChange(newSpec);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));

      const setNodesCallback = mockSetNodes.mock.calls[0][0];
      const updatedNodes = setNodesCallback(mockNodes);
      const unchangedInput = updatedNodes.find(
        (node: Node) => node.id === "input-0",
      );

      expect(unchangedInput?.selected).toBe(true);
    });
  });

  describe("output name changes", () => {
    it("should transfer selection when output name changes", async () => {
      const { result } = renderHook(() => useIOSelectionPersistence());

      // Set initial spec with original output name
      const initialSpec = createMockComponentSpec(
        [],
        [{ name: "original_output", type: "string" }],
      );

      act(() => {
        result.current.preserveIOSelectionOnSpecChange(initialSpec);
      });

      // Mock nodes with selected output using original name
      const mockNodes = [
        createMockNode("output-0", "output", "original_output", true),
      ];
      mockGetNodes.mockReturnValue(mockNodes);

      // New spec with renamed output
      const newSpec = createMockComponentSpec(
        [],
        [{ name: "renamed_output", type: "string" }],
      );

      await act(async () => {
        result.current.preserveIOSelectionOnSpecChange(newSpec);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));

      // Test the callback with new nodes that have the renamed output
      const setNodesCallback = mockSetNodes.mock.calls[0][0];
      const newNodes = [
        createMockNode("output-0", "output", "renamed_output", false),
      ];

      const updatedNodes = setNodesCallback(newNodes);
      const renamedOutput = updatedNodes.find(
        (node: Node) => node.id === "output-0",
      );

      // Selection should be preserved on the renamed output
      expect(renamedOutput?.selected).toBe(true);
    });

    it("should handle multiple input and output name changes", async () => {
      const { result } = renderHook(() => useIOSelectionPersistence());

      // Set initial spec
      const initialSpec = createMockComponentSpec(
        [{ name: "old_input", type: "string" }],
        [{ name: "old_output", type: "string" }],
      );

      act(() => {
        result.current.preserveIOSelectionOnSpecChange(initialSpec);
      });

      // Mock nodes with both input and output selected
      const mockNodes = [
        createMockNode("input-0", "input", "old_input", true),
        createMockNode("output-0", "output", "old_output", true),
      ];
      mockGetNodes.mockReturnValue(mockNodes);

      // New spec with renamed input and output
      const newSpec = createMockComponentSpec(
        [{ name: "new_input", type: "string" }],
        [{ name: "new_output", type: "string" }],
      );

      await act(async () => {
        result.current.preserveIOSelectionOnSpecChange(newSpec);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));

      // Test the callback with new nodes
      const setNodesCallback = mockSetNodes.mock.calls[0][0];
      const newNodes = [
        createMockNode("input-0", "input", "new_input", false),
        createMockNode("output-0", "output", "new_output", false),
      ];

      const updatedNodes = setNodesCallback(newNodes);
      const renamedInput = updatedNodes.find(
        (node: Node) => node.id === "input-0",
      );
      const renamedOutput = updatedNodes.find(
        (node: Node) => node.id === "output-0",
      );

      // Both selections should be preserved
      expect(renamedInput?.selected).toBe(true);
      expect(renamedOutput?.selected).toBe(true);
    });
  });

  describe("no selection transfer needed", () => {
    it("should not call setNodes when no IO nodes are selected", async () => {
      const { result } = renderHook(() => useIOSelectionPersistence());

      const initialSpec = createMockComponentSpec([
        { name: "input1", type: "string" },
      ]);

      act(() => {
        result.current.preserveIOSelectionOnSpecChange(initialSpec);
      });

      // Mock nodes with no selected IO nodes
      const mockNodes = [
        createMockNode("input-0", "input", "input1", false),
        createMockNode("task-1", "task", "task1", true), // Only task selected
      ];
      mockGetNodes.mockReturnValue(mockNodes);

      const newSpec = createMockComponentSpec([
        { name: "renamed_input", type: "string" },
      ]);

      await act(async () => {
        result.current.preserveIOSelectionOnSpecChange(newSpec);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should not call setNodes since no IO nodes were selected
      expect(mockSetNodes).not.toHaveBeenCalled();
    });

    it("should do nothing on initial spec set", () => {
      const { result } = renderHook(() => useIOSelectionPersistence());

      const newSpec = createMockComponentSpec([
        { name: "input1", type: "string" },
      ]);

      act(() => {
        result.current.preserveIOSelectionOnSpecChange(newSpec);
      });

      // Should not interact with ReactFlow on initial spec
      expect(mockGetNodes).not.toHaveBeenCalled();
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
  });
});
