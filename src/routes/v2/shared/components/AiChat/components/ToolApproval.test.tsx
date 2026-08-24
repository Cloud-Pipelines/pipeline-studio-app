import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AgentApproval } from "@/routes/v2/shared/components/AiChat/agentClient";

import { ToolApproval } from "./ToolApproval";

function createApproval(decision: AgentApproval["decision"]): AgentApproval {
  return {
    id: "approval-1",
    toolName: "connect_nodes",
    input: { sourceEntityId: "input-1" },
    decision,
    approve: vi.fn(),
    reject: vi.fn(),
  };
}

describe("ToolApproval", () => {
  it("shows an approved choice in green in both themes", () => {
    render(
      <ToolApproval approval={createApproval("approved")} disabled={false} />,
    );

    expect(screen.getByText("Approved connect nodes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approved" })).toHaveClass(
      "bg-success",
      "text-white",
      "dark:bg-success",
    );
    expect(screen.getByRole("button", { name: "Approved" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows a rejected choice in red", () => {
    render(
      <ToolApproval approval={createApproval("rejected")} disabled={false} />,
    );

    expect(screen.getByText("Rejected connect nodes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rejected" })).toHaveClass(
      "bg-destructive",
      "text-white",
    );
    expect(screen.getByRole("button", { name: "Rejected" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("updates the selected decision immediately", () => {
    const approval = createApproval(null);
    render(<ToolApproval approval={approval} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    expect(approval.approve).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Approved" })).toHaveClass(
      "bg-success",
      "text-white",
      "dark:bg-success",
    );
    expect(screen.getByText("Approved connect nodes")).toBeInTheDocument();
  });
});
