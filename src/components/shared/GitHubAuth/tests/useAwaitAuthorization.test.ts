import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

import { useAwaitAuthorization } from "../useAwaitAuthorization";

// Mock dependencies
vi.mock("../helpers", () => ({
  isAuthorizationRequired: vi.fn(),
}));

vi.mock("../useAuthLocalStorage", () => ({
  useAuthLocalStorage: vi.fn(),
}));

vi.mock("../useGitHubAuthPopup", () => ({
  useGitHubAuthPopup: vi.fn(),
}));

vi.mock("@/hooks/useToastNotification", () => ({
  default: vi.fn(),
}));

describe("useAwaitAuthorization()", () => {
  let mockIsAuthorizationRequired: Mock;
  let mockUseAuthLocalStorage: Mock;
  let mockUseGitHubAuthPopup: Mock;
  let mockNotify: Mock;

  let mockAuthStorage: {
    subscribe: Mock;
    getToken: Mock;
    setToken: Mock;
    setProfile: Mock;
    clear: Mock;
  };

  let mockPopupHandlers: {
    openPopup: Mock;
    closePopup: Mock;
    bringPopupToFront: Mock;
    isLoading: boolean;
    isPopupOpen: boolean;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock notification
    mockNotify = vi.fn();
    const mockUseToastNotification = vi.mocked(
      (await import("@/hooks/useToastNotification")).default,
    );
    mockUseToastNotification.mockReturnValue(mockNotify);

    // Mock isAuthorizationRequired
    mockIsAuthorizationRequired = vi.mocked(
      (await import("../helpers")).isAuthorizationRequired,
    );

    // Mock auth storage
    mockAuthStorage = {
      subscribe: vi.fn(),
      getToken: vi.fn(),
      setToken: vi.fn(),
      setProfile: vi.fn(),
      clear: vi.fn(),
    };

    mockUseAuthLocalStorage = vi.mocked(
      (await import("../useAuthLocalStorage")).useAuthLocalStorage,
    );
    mockUseAuthLocalStorage.mockReturnValue(mockAuthStorage);

    // Mock popup handlers
    mockPopupHandlers = {
      openPopup: vi.fn(),
      closePopup: vi.fn(),
      bringPopupToFront: vi.fn(),
      isLoading: false,
      isPopupOpen: false,
    };

    mockUseGitHubAuthPopup = vi.mocked(
      (await import("../useGitHubAuthPopup")).useGitHubAuthPopup,
    );
    mockUseGitHubAuthPopup.mockReturnValue(mockPopupHandlers);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should return correct initial state when not authorized", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result } = renderHook(() => useAwaitAuthorization());

      expect(result.current.isAuthorized).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isPopupOpen).toBe(false);
    });

    it("should return correct initial state when authorized with token", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue("bearer token123");
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result } = renderHook(() => useAwaitAuthorization());

      expect(result.current.isAuthorized).toBe(true);
    });

    it("should return correct initial state when authorization not required", () => {
      mockIsAuthorizationRequired.mockReturnValue(false);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result } = renderHook(() => useAwaitAuthorization());

      expect(result.current.isAuthorized).toBe(true);
    });
  });

  describe("awaitAuthorization function", () => {
    it("should open popup and return promise", async () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result } = renderHook(() => useAwaitAuthorization());

      const promise = result.current.awaitAuthorization();

      expect(mockPopupHandlers.openPopup).toHaveBeenCalled();
      expect(promise).toBeInstanceOf(Promise);
    });

    it("should create new promise on each call", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result } = renderHook(() => useAwaitAuthorization());

      const promise1 = result.current.awaitAuthorization();
      const promise2 = result.current.awaitAuthorization();

      expect(promise1).not.toBe(promise2);
      expect(mockPopupHandlers.openPopup).toHaveBeenCalledTimes(2);
    });
  });

  describe("Success flow", () => {
    it("should handle successful authorization", async () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const mockResponse = {
        userData: {
          login: "testuser",
          avatar_url: "https://example.com/avatar.png",
        },
        token: "access-token",
        tokenType: "bearer",
      };

      // Mock the popup hook to capture the onSuccess callback
      let capturedOnSuccess: ((response: any) => void) | undefined;
      mockUseGitHubAuthPopup.mockImplementation(({ onSuccess }) => {
        capturedOnSuccess = onSuccess;
        return mockPopupHandlers;
      });

      const { result } = renderHook(() => useAwaitAuthorization());

      const promise = result.current.awaitAuthorization();

      // Simulate successful authorization
      await act(async () => {
        capturedOnSuccess?.(mockResponse);
      });

      await expect(promise).resolves.toBe(true);

      expect(mockNotify).toHaveBeenCalledWith(
        "GitHub authentication successful!",
        "success",
      );
      expect(mockAuthStorage.setToken).toHaveBeenCalledWith(
        "bearer access-token",
      );
      expect(mockAuthStorage.setProfile).toHaveBeenCalledWith({
        login: "testuser",
        avatar_url: "https://example.com/avatar.png",
      });
    });
  });

  describe("Error flow", () => {
    it("should handle authorization error", async () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const errorMessage = "access_denied";

      // Mock the popup hook to capture the onError callback
      let capturedOnError: ((error: string) => void) | undefined;
      mockUseGitHubAuthPopup.mockImplementation(({ onError }) => {
        capturedOnError = onError;
        return mockPopupHandlers;
      });

      const { result } = renderHook(() => useAwaitAuthorization());

      const promise = result.current.awaitAuthorization();

      // Simulate authorization error and ensure promise is handled properly
      let promiseRejected = false;
      const rejectionHandler = promise.catch((error) => {
        promiseRejected = true;
        expect(error.message).toBe(`Authorization failed: ${errorMessage}`);
      });

      await act(async () => {
        capturedOnError?.(errorMessage);
      });

      await rejectionHandler;

      expect(promiseRejected).toBe(true);
      expect(mockNotify).toHaveBeenCalledWith(
        `GitHub authentication error: ${errorMessage}`,
        "error",
      );
      expect(mockAuthStorage.clear).toHaveBeenCalled();
    });
  });

  describe("Close flow", () => {
    it("should resolve promise when popup closes and user is authorized", async () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      // Mock token to be available after popup closes
      mockAuthStorage.getToken.mockReturnValue("bearer token123");

      // Mock the popup hook to capture the onClose callback
      let capturedOnClose: (() => void) | undefined;
      mockUseGitHubAuthPopup.mockImplementation(({ onClose }) => {
        capturedOnClose = onClose;
        return mockPopupHandlers;
      });

      const { result } = renderHook(() => useAwaitAuthorization());

      const promise = result.current.awaitAuthorization();

      // Simulate popup close with token available
      await act(async () => {
        capturedOnClose?.();
      });

      await expect(promise).resolves.toBe(true);
    });

    it("should reject promise when popup closes and user is not authorized", async () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      // Mock the popup hook to capture the onClose callback
      let capturedOnClose: (() => void) | undefined;
      mockUseGitHubAuthPopup.mockImplementation((options) => {
        capturedOnClose = options.onClose;
        return mockPopupHandlers;
      });

      const { result } = renderHook(() => useAwaitAuthorization());

      const promise = result.current.awaitAuthorization();

      // Simulate popup close without token and ensure promise is handled properly
      let promiseRejected = false;
      const rejectionHandler = promise.catch((error) => {
        promiseRejected = true;
        expect(error.message).toBe("Authorization required");
      });

      await act(async () => {
        capturedOnClose?.();
      });

      await rejectionHandler;

      expect(promiseRejected).toBe(true);
    });
  });

  describe("Popup state propagation", () => {
    it("should propagate isLoading from popup hook", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      mockPopupHandlers.isLoading = true;

      const { result } = renderHook(() => useAwaitAuthorization());

      expect(result.current.isLoading).toBe(true);
    });

    it("should propagate isPopupOpen from popup hook", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      mockPopupHandlers.isPopupOpen = true;

      const { result } = renderHook(() => useAwaitAuthorization());

      expect(result.current.isPopupOpen).toBe(true);
    });

    it("should propagate closePopup from popup hook", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result } = renderHook(() => useAwaitAuthorization());

      result.current.closePopup();

      expect(mockPopupHandlers.closePopup).toHaveBeenCalled();
    });

    it("should propagate bringPopupToFront from popup hook", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result } = renderHook(() => useAwaitAuthorization());

      result.current.bringPopupToFront();

      expect(mockPopupHandlers.bringPopupToFront).toHaveBeenCalled();
    });
  });

  describe("Token subscription", () => {
    it("should subscribe to token changes", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      renderHook(() => useAwaitAuthorization());

      expect(mockAuthStorage.subscribe).toHaveBeenCalled();
    });

    it("should update isAuthorized when token changes", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);

      let subscribedCallback: (() => void) | undefined;
      mockAuthStorage.subscribe.mockImplementation((callback) => {
        subscribedCallback = callback;
        return () => {};
      });

      // Initially no token
      mockAuthStorage.getToken.mockReturnValue(undefined);

      const { result } = renderHook(() => useAwaitAuthorization());

      expect(result.current.isAuthorized).toBe(false);

      // Mock token being available
      mockAuthStorage.getToken.mockReturnValue("bearer token123");

      // Trigger the subscription callback
      act(() => {
        subscribedCallback?.();
      });

      expect(result.current.isAuthorized).toBe(true);
    });
  });

  describe("Memory stability", () => {
    it("should memoize returned object to prevent unnecessary re-renders", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);
      mockAuthStorage.getToken.mockReturnValue(undefined);
      mockAuthStorage.subscribe.mockReturnValue(() => {});

      const { result, rerender } = renderHook(() => useAwaitAuthorization());

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toStrictEqual(secondResult);
    });

    it("should update returned object when dependencies change", () => {
      mockIsAuthorizationRequired.mockReturnValue(true);

      let subscribedCallback: (() => void) | undefined;
      mockAuthStorage.subscribe.mockImplementation((callback) => {
        subscribedCallback = callback;
        return () => {};
      });

      // Initially no token
      mockAuthStorage.getToken.mockReturnValue(undefined);

      const { result } = renderHook(() => useAwaitAuthorization());

      const firstResult = result.current;
      expect(firstResult.isAuthorized).toBe(false);

      // Mock token being available
      mockAuthStorage.getToken.mockReturnValue("bearer token123");

      // Trigger the subscription callback
      act(() => {
        subscribedCallback?.();
      });

      const secondResult = result.current;
      expect(secondResult.isAuthorized).toBe(true);
      expect(firstResult).not.toStrictEqual(secondResult);
    });
  });
});
