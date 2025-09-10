import { useReactFlow } from "@xyflow/react";
import { useCallback, useRef } from "react";

import { type ComponentSpec } from "@/utils/componentSpec";

export const useIOSelectionPersistence = () => {
  const { setNodes, getNodes } = useReactFlow();
  const prevSpecRef = useRef<ComponentSpec | null>(null);

  const preserveIOSelectionOnSpecChange = useCallback(
    (newSpec: ComponentSpec) => {
      const prevSpec = prevSpecRef.current;

      if (!prevSpec) {
        prevSpecRef.current = newSpec;
        return;
      }

      requestAnimationFrame(() => {
        const currentNodes = getNodes();
        const selectedIONodes = new Map<
          string,
          { type: "input" | "output"; index: number; name: string }
        >();

        currentNodes.forEach((node) => {
          if (
            !node.selected ||
            (node.type !== "input" && node.type !== "output")
          ) {
            return;
          }

          const index = prevSpec[
            node.type === "input" ? "inputs" : "outputs"
          ]?.findIndex((input) => input.name === node.data.label);

          if (index === undefined || index < 0) {
            return;
          }

          selectedIONodes.set(`${node.type}-${index}`, {
            type: node.type,
            index,
            name: node.data.label as string,
          });
        });

        if (selectedIONodes.size > 0) {
          requestAnimationFrame(() => {
            setNodes((nodes) => {
              return nodes.map((node) => {
                if (node.type !== "input" && node.type !== "output") {
                  return node;
                }

                const spec =
                  node.type === "input" ? newSpec.inputs : newSpec.outputs;

                const index = spec?.findIndex(
                  (item) => item.name === node.data.label,
                );

                if (index === undefined || index < 0) {
                  return node;
                }

                const selectionKey = `${node.type}-${index}`;
                const wasSelected = selectedIONodes.has(selectionKey);

                if (wasSelected) {
                  return { ...node, selected: true };
                }

                return node;
              });
            });
          });
        }
      });

      prevSpecRef.current = newSpec;
    },
    [setNodes, getNodes],
  );

  const resetPrevSpec = useCallback(() => {
    prevSpecRef.current = null;
  }, []);

  return {
    preserveIOSelectionOnSpecChange,
    resetPrevSpec,
  };
};
