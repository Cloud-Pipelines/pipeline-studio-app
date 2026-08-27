import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AiModelQuickSelect } from "./AiModelQuickSelect";

const STORAGE_KEY = "tangle.aiProvider.config";
describe("AiModelQuickSelect", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.__TANGLE_AI_MODELS__;
  });

  afterEach(() => {
    window.localStorage.clear();
    delete window.__TANGLE_AI_MODELS__;
  });

  it("does not render until AI provider settings are configured", () => {
    render(<AiModelQuickSelect />);

    expect(screen.queryByRole("combobox", { name: "AI model" })).toBeNull();
  });

  it("shows configured model choices", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        apiBase: "https://api.example.com/v1",
        apiKey: "",
        model: "gpt-4.1-mini",
      }),
    );

    render(<AiModelQuickSelect />);

    fireEvent.click(screen.getByRole("combobox", { name: "AI model" }));

    expect(
      screen.queryByRole("option", { name: "Provider default" }),
    ).toBeNull();
    expect(screen.getByRole("option", { name: "GPT-5.5" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "GPT-4.1 mini" }),
    ).toBeInTheDocument();
  });
});
