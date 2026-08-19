import { QueryClient } from "@tanstack/react-query";

/**
 * The app's single QueryClient. Exported as a module singleton so non-React
 * code (socket event handlers, imperative cache writes) can reach the same
 * cache the provider serves.
 */
export const queryClient = new QueryClient();
