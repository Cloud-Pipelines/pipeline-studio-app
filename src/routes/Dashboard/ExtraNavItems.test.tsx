import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUserDetails } from "@/utils/user";

import { ExtraNavItems } from "./ExtraNavItems";

vi.mock("@/utils/user", () => ({
  getUserDetails: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ExtraNavItems />
    </QueryClientProvider>,
  );
}

function mockPermissions(permissions: string[]) {
  vi.mocked(getUserDetails).mockResolvedValue({
    id: "someone@example.com",
    permissions,
  });
}

describe("ExtraNavItems", () => {
  beforeEach(() => {
    window.__TANGLE_EXTRA_NAV_ITEMS__ = [
      {
        label: "Admin",
        href: "/admin/",
        icon: "ShieldCheck",
        requiresPermission: "admin",
      },
    ];
  });

  afterEach(() => {
    delete window.__TANGLE_EXTRA_NAV_ITEMS__;
    vi.resetAllMocks();
  });

  it("links to an injected item once the user's permissions arrive", async () => {
    mockPermissions(["read", "write", "admin"]);

    renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
        "href",
        "/admin/",
      );
    });
  });

  it("does not open same-origin items in a new tab", async () => {
    mockPermissions(["admin"]);

    renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Admin" })).not.toHaveAttribute(
        "target",
      );
    });
  });

  it("renders nothing for a user without the required permission", async () => {
    mockPermissions(["read", "write"]);

    renderWithQueryClient();

    await waitFor(() => expect(getUserDetails).toHaveBeenCalled());

    expect(screen.queryByRole("link")).toBeNull();
  });
});
