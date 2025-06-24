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
      />,
    );

    expect(screen.getByLabelText("TestInput")).toBeDefined();
    expect(screen.getByText("Type:")).toBeDefined();
    expect(screen.getByText("String")).toBeDefined();
  });

  it("displays input description", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
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
      />,
    );

    const input = screen.getByLabelText("TestInput");
    fireEvent.change(input, { target: { value: "new value" } });
    fireEvent.blur(input);

    expect(mockOnChange).toHaveBeenCalledWith("TestInput", "new value");
  });

  it("calls onTypeChange when type selector changes", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
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
      />,
    );

    const input = screen.getByLabelText("NumberInput");
    expect(input.getAttribute("type")).toBe("number");
  });

  it("displays current value", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value="current value"
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
      />,
    );

    const input = screen.getByLabelText("TestInput");
    expect(input.getAttribute("value")).toBe("current value");
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
      />,
    );

    const input = screen.getByLabelText("NoDefaultInput");
    expect(input.getAttribute("placeholder")).toBe("Enter NoDefaultInput...");
  });

  it("shows default value as placeholder when available", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
      />,
    );

    const input = screen.getByLabelText("TestInput");
    expect(input.getAttribute("placeholder")).toBe("default value");
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
      />,
    );

    expect(screen.getByText("Integer")).toBeDefined();
  });

  it("hides type selector when showTypeSelector is false", () => {
    render(
      <InputValueEditor
        input={mockInput}
        value=""
        onChange={mockOnChange}
        onTypeChange={mockOnTypeChange}
        showTypeSelector={false}
      />,
    );

    expect(screen.queryByText("Type:")).toBeNull();
  });

  it("hides type selector when onTypeChange is not provided", () => {
    render(
      <InputValueEditor input={mockInput} value="" onChange={mockOnChange} />,
    );

    expect(screen.queryByText("Type:")).toBeNull();
  });
});
