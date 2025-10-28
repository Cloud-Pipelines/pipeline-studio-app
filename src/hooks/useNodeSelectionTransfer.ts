import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

/* 
   Transfer the node selection state from old node to new node when the node name changes.
   This is a workaround for the fact that React Flow does not automatically transfer the selection state
   when a node's id changes (which is derived from the input/output/task name).
*/

type NodeIdGenerator = (name: string) => string;

export const useNodeSelectionTransfer = (nodeIdGenerator: NodeIdGenerator) => {
  const { setNodes, getNodes } = useReactFlow();

  const transferSelection = useCallback(
    (oldName: string, newName: string) => {
      if (oldName === newName) return;

      const oldNodeId = nodeIdGenerator(oldName);
      const newNodeId = nodeIdGenerator(newName);

      const currentNodes = getNodes();
      const oldNode = currentNodes.find((node) => node.id === oldNodeId);
      const wasSelected = oldNode?.selected ?? false;

      // Schedule the selection update after any component spec update (not an ideal solution -- we will revisit later)
      setTimeout(() => {
        setNodes((nodes) => {
          return nodes.map((node) => {
            if (node.id === oldNodeId) {
              return { ...node, selected: false };
            }
            if (node.id === newNodeId) {
              return { ...node, selected: wasSelected };
            }
            return node;
          });
        });
      }, 0);
    },
    [nodeIdGenerator, getNodes, setNodes],
  );

  return { transferSelection };
};
