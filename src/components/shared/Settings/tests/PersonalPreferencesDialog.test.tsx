import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PersonalPreferencesDialog } from "../PersonalPreferencesDialog";
import { useBetaFlagsReducer } from "../useBetaFlagReducer";

// Mock the useBetaFlagsReducer hook
vi.mock("../useBetaFlagReducer");

describe("PersonalPreferencesDialog", () => {
  const mockDispatch = vi.fn();
  const mockSetOpen = vi.fn();

  const mockBetaFlags = [
    {
      key: "codeViewer",
      name: "Code Viewer virtualization",
      description: "Enable the code viewer virtualization.",
      enabled: false,
      default: false,
    },
    {
      key: "testFeature",
      name: "Test Feature",
      description: "A test feature for testing purposes.",
      enabled: true,
      default: false,
    },
  ];

  const mockUseBetaFlagsReducer = vi.mocked(useBetaFlagsReducer);

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementation
    mockUseBetaFlagsReducer.mockReturnValue([mockBetaFlags, mockDispatch]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render dialog when open is true", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    expect(
      screen.getByRole("dialog", { name: "Personal Preferences" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Personal Preferences")).toBeInTheDocument();
    expect(
      screen.getByText("Configure your personal preferences."),
    ).toBeInTheDocument();
  });

  it("should not render dialog when open is false", () => {
    render(<PersonalPreferencesDialog open={false} setOpen={mockSetOpen} />);

    expect(
      screen.queryByRole("dialog", { name: "Personal Preferences" }),
    ).not.toBeInTheDocument();
  });

  it("should render beta features section", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    expect(screen.getByText("Beta Features")).toBeInTheDocument();
  });

  it("should render all beta flags with correct information", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    // Check first beta flag
    expect(screen.getByText("Code Viewer virtualization")).toBeInTheDocument();
    expect(
      screen.getByText("Enable the code viewer virtualization."),
    ).toBeInTheDocument();

    // Check second beta flag
    expect(screen.getByText("Test Feature")).toBeInTheDocument();
    expect(
      screen.getByText("A test feature for testing purposes."),
    ).toBeInTheDocument();
  });

  it("should render switches with correct initial states", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(2);

    // First switch should be unchecked (enabled: false)
    expect(switches[0]).not.toBeChecked();

    // Second switch should be checked (enabled: true)
    expect(switches[1]).toBeChecked();
  });

  it("should dispatch setFlag action when switch is toggled", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    const switches = screen.getAllByRole("switch");

    // Toggle first switch (currently false, should become true)
    fireEvent.click(switches[0]);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "setFlag",
      payload: {
        key: "codeViewer",
        enabled: true,
      },
    });

    // Toggle second switch (currently true, should become false)
    fireEvent.click(switches[1]);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "setFlag",
      payload: {
        key: "testFeature",
        enabled: false,
      },
    });
  });

  it("should render Close button", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    const closeButton = screen.getByTestId("close-button");
    expect(closeButton).toBeInTheDocument();
  });

  it("should call setOpen(false) when OK button is clicked", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it("should call setOpen when dialog is closed via onOpenChange", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    // Simulate closing the dialog via ESC key or backdrop click
    // This would trigger the onOpenChange callback
    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockSetOpen).toHaveBeenCalled();
  });

  it("should have proper accessibility attributes", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    const dialog = screen.getByRole("dialog", { name: "Personal Preferences" });
    expect(dialog).toHaveAttribute("aria-label", "Personal Preferences");

    // Check that the dialog description exists (the aria-label is on the parent DialogDescription component)
    expect(
      screen.getByText("Configure your personal preferences."),
    ).toBeInTheDocument();
  });

  it("should handle empty beta flags array", () => {
    // Mock empty beta flags
    mockUseBetaFlagsReducer.mockReturnValue([[], mockDispatch]);

    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    expect(screen.getByText("Beta Features")).toBeInTheDocument();
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
  });

  it("should maintain consistent dialog structure", () => {
    render(<PersonalPreferencesDialog open={true} setOpen={mockSetOpen} />);

    // Check dialog structure
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Personal Preferences")).toBeInTheDocument();
    expect(
      screen.getByText("Configure your personal preferences."),
    ).toBeInTheDocument();
    expect(screen.getByText("Beta Features")).toBeInTheDocument();
    expect(screen.getByTestId("close-button")).toBeInTheDocument();
  });
});
