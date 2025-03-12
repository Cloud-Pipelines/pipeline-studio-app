import { scan } from "react-scan";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

import AppFooter from "./AppFooter.tsx";
import Editor from "./routes/Editor.tsx";

import "@xyflow/react/dist/style.css";
import Home from "./routes/Home.tsx";

const queryClient = new QueryClient();

scan({
  enabled: import.meta.env.VITE_ENABLE_SCAN === "true",
});

const rootRoute = createRootRoute({
  component: () => (
    <div className="App grid grid-rows-[1fr_auto] min-h-screen w-full">
      <div>
        <Outlet />
      </div>
      <AppFooter />
      {import.meta.env.VITE_ENABLE_ROUTER_DEVTOOLS === "true" && (
        <TanStackRouterDevtools />
      )}
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pipeline-editor",
  component: Editor,
});

const routeTree = rootRoute.addChildren([indexRoute, editorRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
