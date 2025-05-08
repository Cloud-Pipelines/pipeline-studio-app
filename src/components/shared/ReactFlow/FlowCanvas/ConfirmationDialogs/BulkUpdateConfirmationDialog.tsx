import type { Node } from "@xyflow/react";

import type { InputSpec } from "@/utils/componentSpec";

import { thisCannotBeUndone } from "./shared";

export function getBulkUpdateConfirmationDetails(
  nodesToUpdate: Node[],
  unchangedNodes: Node[],
  allLostInputs: InputSpec[],
) {
  const hasLostInputs = allLostInputs.length > 0;
  const hasExcludedNodes = unchangedNodes.length > 0;

  const nodeToUpdatePluralSuffix = nodesToUpdate.length === 1 ? "" : "s";

  const title = `Upgrade Component${nodeToUpdatePluralSuffix}`;
  const description = "";
  const content = (
    <div className="text-sm">
      <p>
        Are you sure you want to update{" "}
        {nodesToUpdate.length === 1 ? "this node" : "these nodes"}?
      </p>
      <p>
        This will upgrade {nodesToUpdate.length} node
        {nodeToUpdatePluralSuffix} to {nodesToUpdate.length === 1 ? "a " : ""}{" "}
        new version
        {nodeToUpdatePluralSuffix} from{" "}
        {nodesToUpdate.length === 1 ? "its" : "their"} source URL.
      </p>
      {hasExcludedNodes && (
        <>
          <br />
          <p>
            {unchangedNodes.length} custom component
            {unchangedNodes.length === 1 ? "" : "s"} will not be updated.
          </p>
        </>
      )}
      {hasLostInputs && (
        <>
          <br />
          <p>Some input arguments may be lost.</p>
        </>
      )}
      <br />
      {thisCannotBeUndone}
    </div>
  );

  return {
    title,
    content,
    description,
  };
}
