import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InfoIconButton from "./InfoIconButton";

describe("InfoIconButton", () => {
    it("renders info icon button", () => {
        render(<InfoIconButton />);

        const button = screen.getByRole("button");
        expect(button).toBeDefined();
        expect(button).toHaveClass("hover:bg-accent");
    });

    it("calls onClick when clicked", () => {
        const mockOnClick = vi.fn();
        render(<InfoIconButton onClick={mockOnClick} />);

        const button = screen.getByRole("button");
        fireEvent.click(button);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("does not throw error when clicked without onClick handler", () => {
        render(<InfoIconButton />);

        const button = screen.getByRole("button");
        expect(() => fireEvent.click(button)).not.toThrow();
    });

    it("renders with correct icon styling", () => {
        render(<InfoIconButton />);

        const button = screen.getByRole("button");
        const icon = button.querySelector("svg");

        expect(icon).toBeDefined();
        expect(icon).toHaveClass("size-4", "text-sky-500");
    });
});
