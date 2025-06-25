import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InputSpec } from "@/utils/componentSpec";

import { InputValueEditor } from "./InputValueEditor";

describe("InputValueEditor", () => {
  const mockInput: InputSpec = {
    name: "TestInput",
    type: "String",
    description: "A test input",
    default: "default value",
  };

  const mockOnChange = vi.fn();
  const mockOnTypeChange = vi.fn();
  const mockOnNameChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input with correct label and type selector", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    // The first input is for the name, the second is for the value
    const nameInputs = screen.getAllByRole("textbox");
    expect((nameInputs[0] as HTMLInputElement).value).toBe("TestInput");
    expect(screen.getByText("Type:")).toBeDefined();
    expect(screen.getByText("Text")).toBeDefined();
  });

  it("displays input description", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    expect(screen.getByText("A test input")).toBeDefined();
  });

  it("calls onChange when input value changes", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    // The second input is for the value
    const valueInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    fireEvent.change(valueInput, { target: { value: "new value" } });
    fireEvent.blur(valueInput);
    expect(mockOnChange).toHaveBeenCalledWith("TestInput", "new value");
  });

  it("calls onNameChange when input name changes", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );
    const nameInput = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "NewName" } });
    fireEvent.blur(nameInput);
    expect(mockOnNameChange).toHaveBeenCalledWith("NewName", "TestInput");
  });

  it("calls onTypeChange when type selector changes", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    const typeSelector = screen.getByRole("combobox");
    expect(typeSelector).toBeDefined();
  });

  it("uses correct input type for different data types", () => {
    const numberInput: InputSpec = {
      name: "NumberInput",
      type: "Integer",
    };

    render(
      <InputValueEditor
        input={numberInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    // For number input, use role 'spinbutton' (ARIA role for <input type="number">)
    const valueInput = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(valueInput.getAttribute("type")).toBe("number");
  });

  it("displays current value", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value="current value"
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    const valueInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    expect(valueInput.getAttribute("value")).toBe("current value");
  });

  it("shows placeholder when no default value", () => {
    const inputWithoutDefault: InputSpec = {
      name: "NoDefaultInput",
      type: "String",
    };

    render(
      <InputValueEditor
        input={inputWithoutDefault}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    const valueInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    expect(valueInput.getAttribute("placeholder")).toBe(
      "Enter NoDefaultInput...",
    );
  });

  it("shows default value as placeholder when available", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    const valueInput = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    expect(valueInput.getAttribute("placeholder")).toBe("default value");
  });

  it("maps type variations correctly", () => {
    const integerInput: InputSpec = {
      name: "IntInput",
      type: "int",
    };

    render(
      <InputValueEditor
        input={integerInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
      />,
    );

    expect(screen.getByText("Number")).toBeDefined();
  });

  it("hides type selector when showTypeSelector is false", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        onNameChange={mockOnNameChange}
        showTypeSelector={false}
      />,
    );

    expect(screen.queryByText("Type:")).toBeNull();
  });

  it("hides type selector when onTypeChange is not provided", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onNameChange={mockOnNameChange}
      />,
    );

    expect(screen.queryByText("Type:")).toBeNull();
  });
});
