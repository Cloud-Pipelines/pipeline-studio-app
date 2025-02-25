import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import SideBar from "./SideBar";

describe("App", () => {
  test("renders", () => {
    render(<SideBar />);
    expect(screen.getByText("SideBar")).toBeDefined();
  });
});
