import { createStringList } from "@/utils/string";

import type { NodesAndEdges } from "../types";
import { thisCannotBeUndone } from "./shared";

export function getDeleteConfirmationDetails(deletedElements: NodesAndEdges) {
  const deletedNodes = deletedElements.nodes;
  const deletedEdges = deletedElements.edges;

  if (deletedNodes.length > 0) {
    const isDeletingMultipleNodes = deletedNodes.length > 1;

    if (!isDeletingMultipleNodes) {
      const singleDeleteTitle =
        "Delete Node" +
        (deletedNodes.length > 0 ? ` '${deletedNodes[0].id}'` : "") +
        "?";

      const singleDeleteDesc = (
        <div className="text-sm">
          <p>This will also delete all connections to and from the Node.</p>
          <br />
          {thisCannotBeUndone}
        </div>
      );

      return {
        title: singleDeleteTitle,
        content: singleDeleteDesc,
        description: "",
      };
    }

    const multiDeleteTitle = `Delete Nodes?`;

    const deletedNodeList = createStringList(
      deletedNodes.map((node) => node.id),
      2,
      "node",
    );

    const multiDeleteDesc = (
      <div className="text-sm">
        <p>{`Deleting ${deletedNodeList} will also remove all connections to and from these nodes.`}</p>
        <br />
        {thisCannotBeUndone}
      </div>
    );

    return {
      title: multiDeleteTitle,
      content: multiDeleteDesc,
      description: "",
    };
  }

  if (deletedEdges.length > 0) {
    const isDeletingMultipleEdges = deletedEdges.length > 1;

    const edgeDeleteTitle = isDeletingMultipleEdges
      ? "Delete Connections?"
      : "Delete Connection?";

    const edgeDeleteDesc = (
      <div className="text-sm">
        <p>This will remove the follow connections between task nodes:</p>
        <p>
          {deletedEdges
            .map((edge) => {
              return `'${edge.id}'`;
            })
            .join(", ")}
        </p>
        <br />
        {thisCannotBeUndone}
      </div>
    );

    return {
      title: edgeDeleteTitle,
      content: edgeDeleteDesc,
      description: "",
    };
  }

  // Fallback to default
  return {};
}
