import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactFlowInstance } from "@xyflow/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  HydratedComponentReference,
  TaskSpec,
} from "@/utils/componentSpec";

import {
  NodesOverlayProvider,
  type NotifyMessage,
  type UpdateOverlayMessage,
  useNodesOverlay,
} from "./NodesOverlayProvider";

describe("NodesOverlayProvider", () => {
  const mockGetNode = vi.fn();
  const mockFitView = vi.fn();

  const mockReactFlowInstance = {
    getNode: mockGetNode,
    fitView: mockFitView,
  } as unknown as ReactFlowInstance;

  const mockTaskSpec: TaskSpec = {
    componentRef: {
      digest: "digest-123",
      name: "test-component",
      version: "1.0.0",
    },
    arguments: {},
  } as TaskSpec;

  const mockHydratedComponentRef: HydratedComponentReference = {
    digest: "digest-456",
    name: "updated-component",
    version: "2.0.0",
    spec: {
      name: "updated-component",
      implementation: { container: { image: "test:latest" } },
    },
    text: "component: updated-component",
  } as unknown as HydratedComponentReference;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render children correctly", () => {
      render(
        <NodesOverlayProvider>
          <div data-testid="child">Test Child</div>
        </NodesOverlayProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toHaveTextContent("Test Child");
    });
  });

  describe("setReactFlowInstance()", () => {
    it("should set ReactFlow instance", async () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      act(() => {
        result.current.setReactFlowInstance(
          mockReactFlowInstance as ReactFlowInstance,
        );
      });

      // Test that the instance is stored by trying to use fitNodeIntoView
      mockGetNode.mockReturnValue({
        id: "test-node",
      } as any);
      mockFitView.mockResolvedValue(true);

      const fitResult = await act(async () => {
        return await result.current.fitNodeIntoView("test-node");
      });

      expect(mockGetNode).toHaveBeenCalledWith("test-node");
      expect(mockFitView).toHaveBeenCalledWith({
        nodes: [{ id: "test-node" }],
        duration: 200,
        maxZoom: 1,
      });
      expect(fitResult).toBe(true);
    });
  });

  describe("registerNode()", () => {
    it("should register a node and return unregister function", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const onNotify = vi.fn();
      let unregister: () => void;

      act(() => {
        unregister = result.current.registerNode({
          nodeId: "node-1",
          taskSpec: mockTaskSpec,
          onNotify,
        });
      });

      // Verify node is registered by checking getNodeIdsByDigest
      expect(result.current.getNodeIdsByDigest("digest-123")).toContain(
        "node-1",
      );

      // Verify notification works
      const message: NotifyMessage = { type: "highlight" };
      act(() => {
        result.current.notifyNode("node-1", message);
      });
      expect(onNotify).toHaveBeenCalledWith(message);

      // Unregister and verify node is removed
      act(() => {
        unregister();
      });
      expect(result.current.getNodeIdsByDigest("digest-123")).not.toContain(
        "node-1",
      );
    });

    it("should handle multiple node registrations", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const unregister1 = result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
      });

      const unregister2 = result.current.registerNode({
        nodeId: "node-2",
        taskSpec: mockTaskSpec,
      });

      const unregister3 = result.current.registerNode({
        nodeId: "node-3",
        taskSpec: {
          ...mockTaskSpec,
          componentRef: { ...mockTaskSpec.componentRef, digest: "digest-456" },
        },
      });

      expect(result.current.getNodeIdsByDigest("digest-123")).toEqual([
        "node-1",
        "node-2",
      ]);
      expect(result.current.getNodeIdsByDigest("digest-456")).toEqual([
        "node-3",
      ]);

      unregister1();
      expect(result.current.getNodeIdsByDigest("digest-123")).toEqual([
        "node-2",
      ]);

      unregister2();
      expect(result.current.getNodeIdsByDigest("digest-123")).toEqual([]);

      unregister3();
      expect(result.current.getNodeIdsByDigest("digest-456")).toEqual([]);
    });
  });

  describe("fitNodeIntoView()", () => {
    it("should fit node into view when node exists", async () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      act(() => {
        result.current.setReactFlowInstance(
          mockReactFlowInstance as ReactFlowInstance,
        );
      });

      mockGetNode.mockReturnValue({
        id: "existing-node",
      } as any);
      mockFitView.mockResolvedValue(true);

      const fitResult = await act(async () => {
        return await result.current.fitNodeIntoView("existing-node");
      });

      expect(mockGetNode).toHaveBeenCalledWith("existing-node");
      expect(mockFitView).toHaveBeenCalledWith({
        nodes: [{ id: "existing-node" }],
        duration: 200,
        maxZoom: 1,
      });
      expect(fitResult).toBe(true);
    });

    it("should return false when ReactFlow instance is not set", async () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const fitResult = await act(async () => {
        return await result.current.fitNodeIntoView("any-node");
      });

      expect(fitResult).toBe(false);
    });
  });

  describe("getNodeIdsByDigest()", () => {
    it("should return node IDs matching the digest", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
      });

      result.current.registerNode({
        nodeId: "node-2",
        taskSpec: mockTaskSpec,
      });

      result.current.registerNode({
        nodeId: "node-3",
        taskSpec: {
          ...mockTaskSpec,
          componentRef: {
            ...mockTaskSpec.componentRef,
            digest: "different-digest",
          },
        },
      });

      const matchingNodes = result.current.getNodeIdsByDigest("digest-123");
      expect(matchingNodes).toEqual(["node-1", "node-2"]);
      expect(matchingNodes).not.toContain("node-3");
    });

    it("should return empty array when no nodes match", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const matchingNodes = result.current.getNodeIdsByDigest(
        "non-existing-digest",
      );
      expect(matchingNodes).toEqual([]);
    });

    it("should update results after nodes are unregistered", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const unregister1 = result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
      });

      const unregister2 = result.current.registerNode({
        nodeId: "node-2",
        taskSpec: mockTaskSpec,
      });

      expect(result.current.getNodeIdsByDigest("digest-123")).toEqual([
        "node-1",
        "node-2",
      ]);

      unregister1();
      expect(result.current.getNodeIdsByDigest("digest-123")).toEqual([
        "node-2",
      ]);

      unregister2();
      expect(result.current.getNodeIdsByDigest("digest-123")).toEqual([]);
    });
  });

  describe("notifyNode()", () => {
    it("should notify registered node with highlight message", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const onNotify = vi.fn();
      result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
        onNotify,
      });

      const message: NotifyMessage = { type: "highlight" };
      result.current.notifyNode("node-1", message);

      expect(onNotify).toHaveBeenCalledTimes(1);
      expect(onNotify).toHaveBeenCalledWith(message);
    });

    it("should notify registered node with clear message", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const onNotify = vi.fn();
      result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
        onNotify,
      });

      const message: NotifyMessage = { type: "clear" };
      result.current.notifyNode("node-1", message);

      expect(onNotify).toHaveBeenCalledTimes(1);
      expect(onNotify).toHaveBeenCalledWith(message);
    });

    it("should notify registered node with update-overlay message", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const onNotify = vi.fn();
      result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
        onNotify,
      });

      const message: UpdateOverlayMessage = {
        type: "update-overlay",
        data: {
          replaceWith: mockHydratedComponentRef,
          ids: ["node-1", "node-2"],
        },
      };
      result.current.notifyNode("node-1", message);

      expect(onNotify).toHaveBeenCalledTimes(1);
      expect(onNotify).toHaveBeenCalledWith(message);
    });

    it("should not throw when notifying non-existing node", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      expect(() => {
        result.current.notifyNode("non-existing-node", { type: "highlight" });
      }).not.toThrow();
    });

    it("should not throw when node has no onNotify callback", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      result.current.registerNode({
        nodeId: "node-without-notify",
        taskSpec: mockTaskSpec,
      });

      expect(() => {
        result.current.notifyNode("node-without-notify", { type: "highlight" });
      }).not.toThrow();
    });

    it("should handle multiple notifications to the same node", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const onNotify = vi.fn();
      result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
        onNotify,
      });

      const messages: NotifyMessage[] = [
        { type: "highlight" },
        { type: "clear" },
        {
          type: "update-overlay",
          data: {
            replaceWith: mockHydratedComponentRef,
            ids: ["node-1"],
          },
        },
      ];

      messages.forEach((message) => {
        result.current.notifyNode("node-1", message);
      });

      expect(onNotify).toHaveBeenCalledTimes(3);
      messages.forEach((message, index) => {
        expect(onNotify).toHaveBeenNthCalledWith(index + 1, message);
      });
    });

    it("should only notify the specific node, not all nodes", () => {
      const { result } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const onNotify1 = vi.fn();
      const onNotify2 = vi.fn();

      result.current.registerNode({
        nodeId: "node-1",
        taskSpec: mockTaskSpec,
        onNotify: onNotify1,
      });

      result.current.registerNode({
        nodeId: "node-2",
        taskSpec: mockTaskSpec,
        onNotify: onNotify2,
      });

      const message: NotifyMessage = { type: "highlight" };
      result.current.notifyNode("node-1", message);

      expect(onNotify1).toHaveBeenCalledWith(message);
      expect(onNotify2).not.toHaveBeenCalled();
    });
  });

  describe("context stability", () => {
    it("should maintain stable function references", () => {
      const { result, rerender } = renderHook(() => useNodesOverlay(), {
        wrapper: NodesOverlayProvider,
      });

      const initialFunctions = {
        setReactFlowInstance: result.current.setReactFlowInstance,
        registerNode: result.current.registerNode,
        fitNodeIntoView: result.current.fitNodeIntoView,
        getNodeIdsByDigest: result.current.getNodeIdsByDigest,
        notifyNode: result.current.notifyNode,
      };

      rerender();

      expect(result.current.setReactFlowInstance).toBe(
        initialFunctions.setReactFlowInstance,
      );
      expect(result.current.registerNode).toBe(initialFunctions.registerNode);
      expect(result.current.fitNodeIntoView).toBe(
        initialFunctions.fitNodeIntoView,
      );
      expect(result.current.getNodeIdsByDigest).toBe(
        initialFunctions.getNodeIdsByDigest,
      );
      expect(result.current.notifyNode).toBe(initialFunctions.notifyNode);
    });
  });
});
