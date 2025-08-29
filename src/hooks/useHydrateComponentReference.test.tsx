import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ComponentReference } from "@/utils/componentSpec";

import { useHydrateComponentReference } from "./useHydrateComponentReference";

// Mock only the hydrateComponentReference function from componentService
vi.mock("@/services/componentService", () => ({
  hydrateComponentReference: vi.fn(),
}));

import { hydrateComponentReference } from "@/services/componentService";
import type { HydratedComponentReference } from "@/utils/componentSpec";

describe("useHydrateComponentReference", () => {
  let queryClient: QueryClient;

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should hydrate a component reference with URL", async () => {
    const mockComponent: ComponentReference = {
      name: "test-component",
      url: "https://example.com/component.yaml",
    };

    const mockHydratedComponent: HydratedComponentReference = {
      name: mockComponent.name || "test-component",
      spec: {
        name: "test-component",
        description: "Test component spec",
        inputs: [],
        outputs: [],
        implementation: {
          container: {
            image: "test:latest",
            command: ["echo"],
            args: ["hello"],
          },
        },
      },
      text: "component yaml content",
      digest: "abc123",
      url: mockComponent.url,
    };

    vi.mocked(hydrateComponentReference).mockResolvedValue(
      mockHydratedComponent,
    );

    const { result } = renderHook(
      () => useHydrateComponentReference(mockComponent),
      { wrapper: createWrapper },
    );

    await waitFor(() => {
      expect(result.current).toEqual(mockHydratedComponent);
    });

    expect(hydrateComponentReference).toHaveBeenCalledWith(mockComponent);
    expect(hydrateComponentReference).toHaveBeenCalledTimes(1);
  });

  it("should cache the result for 1 hour", async () => {
    const mockComponent: ComponentReference = {
      name: "cached-component",
      digest: "cache-test",
    };

    const mockHydratedComponent: HydratedComponentReference = {
      name: mockComponent.name || "cached-component",
      digest: mockComponent.digest || "cache-test",
      spec: {
        name: "cached",
        inputs: [],
        outputs: [],
        implementation: {
          container: {
            image: "test:latest",
            command: ["cached"],
          },
        },
      },
      text: "cached content",
    };

    vi.mocked(hydrateComponentReference).mockResolvedValue(
      mockHydratedComponent,
    );

    // First render
    const { result: result1 } = renderHook(
      () => useHydrateComponentReference(mockComponent),
      { wrapper: createWrapper },
    );

    await waitFor(() => {
      expect(result1.current).toEqual(mockHydratedComponent);
    });

    // Second render with same component
    const { result: result2 } = renderHook(
      () => useHydrateComponentReference(mockComponent),
      { wrapper: createWrapper },
    );

    await waitFor(() => {
      expect(result2.current).toEqual(mockHydratedComponent);
    });

    // Should only be called once due to caching
    expect(hydrateComponentReference).toHaveBeenCalledTimes(1);
  });
});
