import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import App from "./App.tsx";

describe("App", () => {
  test("renders", () => {
    render(
      <App>
        <div>Hello</div>
      </App>,
    );
    expect(screen.getByText("Hello")).toBeDefined();
  });
});
