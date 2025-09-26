import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { BackendProvider } from "@/providers/BackendProvider";

import { RerunPipelineButton } from "./RerunPipelineButton";

const {
  navigateMock,
  notifyMock,
  mockSubmitPipelineRun,
  mockIsAuthorizationRequired,
  mockAwaitAuthorization,
  mockIsAuthorized,
  mockGetToken,
  mockFetch,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  notifyMock: vi.fn(),
  mockSubmitPipelineRun: vi.fn(),
  mockIsAuthorizationRequired: vi.fn(),
  mockAwaitAuthorization: vi.fn(),
  mockIsAuthorized: vi.fn(),
  mockGetToken: vi.fn(),
  mockFetch: vi.fn(),
}));

// Set up mocks
global.fetch = mockFetch;

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

vi.mock("@/hooks/useToastNotification", () => ({
  default: () => notifyMock,
}));

vi.mock("@/components/shared/GitHubAuth/helpers", () => ({
  isAuthorizationRequired: mockIsAuthorizationRequired,
}));
vi.mock("@/components/shared/GitHubAuth/useAwaitAuthorization", () => ({
  useAwaitAuthorization: () => ({
    awaitAuthorization: mockAwaitAuthorization,
    get isAuthorized() {
      return mockIsAuthorized();
    },
  }),
}));

vi.mock("@/components/shared/GitHubAuth/useAuthLocalStorage", () => ({
  useAuthLocalStorage: () => ({
    getToken: mockGetToken,
  }),
}));

vi.mock("@/utils/submitPipeline", () => ({
  submitPipelineRun: mockSubmitPipelineRun,
}));

const testOrigin = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

Object.defineProperty(window, "location", {
  value: {
    origin: testOrigin,
  },
  writable: true,
});

describe("<RerunPipelineButton/>", () => {
  const componentSpec = { name: "Test Pipeline" } as any;

  const renderWithProvider = (ui: React.ReactElement) =>
    render(<BackendProvider>{ui}</BackendProvider>);

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });

    navigateMock.mockClear();
    notifyMock.mockClear();
    mockSubmitPipelineRun.mockClear();
    mockIsAuthorizationRequired.mockReturnValue(false);
    mockIsAuthorized.mockReturnValue(true);
    mockGetToken.mockReturnValue("mock-token");
    mockAwaitAuthorization.mockClear();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    cleanup();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  test("renders rerun button", async () => {
    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    expect(screen.getByTestId("rerun-pipeline-button")).toBeInTheDocument();
  });

  test("calls submitPipelineRun on click", async () => {
    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    expect(mockSubmitPipelineRun).toHaveBeenCalledWith(
      componentSpec,
      expect.any(String),
      expect.objectContaining({
        authorizationToken: "mock-token",
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  test("handles successful rerun", async () => {
    mockSubmitPipelineRun.mockImplementation(async (_, __, { onSuccess }) => {
      onSuccess({ root_execution_id: 123 });
    });

    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/runs/123",
      });
    });
  });

  test("handles rerun error", async () => {
    const testError = new Error("Test error");
    mockSubmitPipelineRun.mockImplementation(async (_, __, { onError }) => {
      onError(testError);
    });

    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith(
        "Failed to submit pipeline. Test error",
        "error",
      );
    });
  });

  test("disables button while submitting", async () => {
    let resolveSubmit: (value: any) => void;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    mockSubmitPipelineRun.mockImplementation(() => submitPromise);

    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    expect(rerunButton).toBeDisabled();

    await act(async () => {
      resolveSubmit!({ root_execution_id: 123 });
    });
  });

  test("handles authorization when required and not authorized", async () => {
    mockIsAuthorizationRequired.mockReturnValue(true);
    mockIsAuthorized.mockReturnValue(false);
    mockAwaitAuthorization.mockResolvedValue("new-token");

    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    expect(mockAwaitAuthorization).toHaveBeenCalled();
    expect(mockSubmitPipelineRun).toHaveBeenCalledWith(
      componentSpec,
      expect.any(String),
      expect.objectContaining({
        authorizationToken: "new-token",
      }),
    );
  });

  test("handles authorization failure", async () => {
    mockIsAuthorizationRequired.mockReturnValue(true);
    mockIsAuthorized.mockReturnValue(false);
    mockAwaitAuthorization.mockResolvedValue(null);

    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    expect(mockAwaitAuthorization).toHaveBeenCalled();
    expect(mockSubmitPipelineRun).toHaveBeenCalledWith(
      componentSpec,
      expect.any(String),
      expect.objectContaining({
        authorizationToken: "mock-token",
      }),
    );
  });

  test("handles string error", async () => {
    const stringError = "String error message";
    mockSubmitPipelineRun.mockImplementation(async (_, __, { onError }) => {
      onError(stringError);
    });

    await act(async () => {
      renderWithProvider(<RerunPipelineButton componentSpec={componentSpec} />);
    });

    const rerunButton = screen.getByTestId("rerun-pipeline-button");

    await act(async () => {
      fireEvent.click(rerunButton);
    });

    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith(
        "Failed to submit pipeline. String error message",
        "error",
      );
    });
  });
});
