import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";

import {
  ComponentEditorProvider,
  useComponentEditor,
} from "./ComponentEditorProvider";

vi.mock("./ComponentEditorDialog", () => ({
  ComponentEditorDialog: ({
    text,
    onClose,
  }: {
    text?: string;
    onClose: () => void;
  }) => (
    <div data-testid="component-editor-dialog">
      {text}
      <button type="button" onClick={onClose}>
        Close editor
      </button>
    </div>
  ),
}));

function TransientEditorTrigger({ onOpen }: { onOpen: () => void }) {
  const { openComponentEditor } = useComponentEditor();

  return (
    <button
      type="button"
      onClick={() => {
        openComponentEditor({ text: "name: draft" });
        onOpen();
      }}
    >
      Edit component
    </button>
  );
}

test("keeps the component editor open when its trigger unmounts", () => {
  function TestHarness() {
    const [showTrigger, setShowTrigger] = useState(true);

    return (
      <ComponentEditorProvider>
        {showTrigger && (
          <TransientEditorTrigger onOpen={() => setShowTrigger(false)} />
        )}
      </ComponentEditorProvider>
    );
  }

  render(<TestHarness />);

  fireEvent.click(screen.getByRole("button", { name: "Edit component" }));

  expect(
    screen.queryByRole("button", { name: "Edit component" }),
  ).not.toBeInTheDocument();
  expect(screen.getByTestId("component-editor-dialog")).toHaveTextContent(
    "name: draft",
  );

  fireEvent.click(screen.getByRole("button", { name: "Close editor" }));

  expect(
    screen.queryByTestId("component-editor-dialog"),
  ).not.toBeInTheDocument();
});
