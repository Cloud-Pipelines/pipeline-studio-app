import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComponentSpec, InputSpec } from "@/utils/componentSpec";

import { InputValueEditor } from "./InputValueEditor";

// Mock all the dependencies
const mockSetComponentSpec = vi.fn();
const mockNotify = vi.fn();
const mockClearContent = vi.fn();
const mockUpdateRefId = vi.fn();

vi.mock("@/providers/ComponentSpecProvider", () => ({
  useComponentSpec: () => ({
    componentSpec: {
      inputs: [
        { name: "TestInput", type: "String" },
        { name: "ExistingInput", type: "String" },
      ],
      implementation: {
        container: {
          image: "test-image",
        },
      },
    },
    currentSubgraphSpec: {
      inputs: [
        { name: "TestInput", type: "String" },
        { name: "ExistingInput", type: "String" },
      ],
      implementation: {
        container: {
          image: "test-image",
        },
      },
    },
    currentSubgraphPath: ["root"],
    setComponentSpec: mockSetComponentSpec,
  }),
}));

vi.mock("@/providers/ContextPanelProvider", () => ({
  useContextPanel: () => ({
    content: null,
    setContent: vi.fn(),
    clearContent: mockClearContent,
  }),
}));

vi.mock("@/hooks/useNodeManager", () => ({
  useNodeManager: () => ({
    updateRefId: mockUpdateRefId,
    getNodeId: vi.fn(),
    getHandleNodeId: vi.fn(),
    nodeManager: {},
  }),
}));

vi.mock("@/hooks/useToastNotification", () => ({
  default: () => mockNotify,
}));

vi.mock("@/utils/inputConnectionUtils", () => ({
  checkInputConnectionToRequiredFields: () => ({
    isConnectedToRequired: false,
    connectedFields: [],
  }),
}));

vi.mock("@/utils/componentSpecValidation", () => ({
  checkNameCollision: (
    newName: string,
    currentName: string,
    _: ComponentSpec,
    type: string,
  ) => {
    if (
      type === "inputs" &&
      newName === "ExistingInput" &&
      newName !== currentName
    ) {
      return true;
    }
    return false;
  },
}));

describe("InputValueEditor", () => {
  const mockInput: InputSpec = {
    name: "TestInput",
    type: "String",
    description: "A test input",
    default: "default value",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays input description", () => {
    render(<InputValueEditor input={mockInput} />);

    const descriptionElements = screen.getAllByText("A test input");
    expect(descriptionElements.length).toBeGreaterThan(0);
    expect(descriptionElements[0]).toBeInTheDocument();
  });

  it("calls onChange when input value changes", () => {
    render(<InputValueEditor input={mockInput} />);

    const valueInput = screen.getByLabelText("Value") as HTMLTextAreaElement;
    fireEvent.change(valueInput, { target: { value: "new value" } });
    fireEvent.blur(valueInput);

    // Verify that the component spec was updated
    expect(mockSetComponentSpec).toHaveBeenCalled();
  });

  it("calls onNameChange when input name changes", () => {
    render(<InputValueEditor input={mockInput} />);
    const nameInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "NewName" } });
    fireEvent.blur(nameInput);

    // Verify that the component spec was updated and selection was transferred
    expect(mockSetComponentSpec).toHaveBeenCalled();
    expect(mockUpdateRefId).toHaveBeenCalledWith("TestInput", "NewName");
  });

  it("shows validation error when renaming to existing input name", () => {
    render(<InputValueEditor input={mockInput} />);

    const nameInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "ExistingInput" } });

    // Should show error message
    expect(
      screen.getByText("An input with this name already exists"),
    ).toBeInTheDocument();

    // Input should have red border
    expect(nameInput.className).toContain("border-red-500");
  });

  it("clears validation error when renaming to unique name", () => {
    render(<InputValueEditor input={mockInput} />);

    const nameInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;

    // First, create a collision
    fireEvent.change(nameInput, { target: { value: "ExistingInput" } });
    expect(
      screen.getByText("An input with this name already exists"),
    ).toBeInTheDocument();

    // Then, change to unique name
    fireEvent.change(nameInput, { target: { value: "UniqueName" } });
    expect(
      screen.queryByText("An input with this name already exists"),
    ).toBeNull();
    expect(nameInput.className).not.toContain("border-red-500");
  });

  it("shows placeholder when no default value", () => {
    const inputWithoutDefault: InputSpec = {
      name: "NoDefaultInput",
      type: "String",
    };

    render(<InputValueEditor input={inputWithoutDefault} />);

    const valueInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    expect(valueInput.getAttribute("placeholder")).toBe(
      "Enter NoDefaultInput...",
    );
  });

  it("shows default value as placeholder when available", () => {
    render(<InputValueEditor input={mockInput} />);

    const valueInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    expect(valueInput.getAttribute("placeholder")).toBe("default value");
  });
});
