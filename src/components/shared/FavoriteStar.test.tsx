import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FavoriteStar } from "./FavoriteStar";

describe("FavoriteStar", () => {
    it("renders star button", () => {
        render(<FavoriteStar />);

        const button = screen.getByRole("button");
        expect(button).toBeDefined();
    });

    it("renders with inactive state by default", () => {
        render(<FavoriteStar />);

        const button = screen.getByRole("button");
        expect(button).toHaveClass("text-gray-500/50");
        expect(button).not.toHaveClass("text-yellow-500");
    });

    it("renders with active state when active prop is true", () => {
        render(<FavoriteStar active={true} />);

        const button = screen.getByRole("button");
        expect(button).toHaveClass("text-yellow-500");
        expect(button).not.toHaveClass("text-gray-500/50");
    });

    it("calls onClick when clicked", () => {
        const mockOnClick = vi.fn();
        render(<FavoriteStar onClick={mockOnClick} />);

        const button = screen.getByRole("button");
        fireEvent.click(button);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("does not throw error when clicked without onClick handler", () => {
        render(<FavoriteStar />);

        const button = screen.getByRole("button");
        expect(() => fireEvent.click(button)).not.toThrow();
    });

    it("stops event propagation when clicked", () => {
        const mockOnClick = vi.fn();
        const mockParentClick = vi.fn();

        render(
            <div onClick={mockParentClick}>
                <FavoriteStar onClick={mockOnClick} />
            </div>
        );

        const button = screen.getByRole("button");
        fireEvent.click(button);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
        expect(mockParentClick).not.toHaveBeenCalled();
    });

    it("renders star icon with correct fill based on active state", () => {
        const { rerender } = render(<FavoriteStar active={false} />);

        let star = screen.getByRole("button").querySelector("svg");
        expect(star).toHaveAttribute("fill", "none");

        rerender(<FavoriteStar active={true} />);

        star = screen.getByRole("button").querySelector("svg");
        expect(star).toHaveAttribute("fill", "oklch(79.5% 0.184 86.047)");
    });

    it("has correct button styling", () => {
        render(<FavoriteStar />);

        const button = screen.getByRole("button");
        expect(button).toHaveClass("w-fit", "h-fit", "p-1", "hover:text-yellow-500");
    });
});
