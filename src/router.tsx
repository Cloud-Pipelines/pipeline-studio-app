import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ToastContainer } from "react-toastify";

import AppFooter from "./components/AppFooter";
import AppMenu from "./components/AppMenu";
import Editor from "./routes/Editor";
import Home from "./routes/Home";
import RunDetails from "./routes/RunDetails";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const EDITOR_PATH = "/editor";
export const RUNS_BASE_PATH = "/runs";
export const APP_ROUTES = {
  HOME: "/",
  PIPELINE_EDITOR: `${EDITOR_PATH}/$name`,
  RUN_DETAIL: `${RUNS_BASE_PATH}/$id`,
  RUNS: RUNS_BASE_PATH,
};

const rootRoute = createRootRoute({
  component: () => (
    <>
      <ToastContainer />
      <div className="App flex flex-col min-h-screen w-full">
        <AppMenu />
        <main className="flex-1 grid">
          <Outlet />
        </main>
        <AppFooter />
        {import.meta.env.VITE_ENABLE_ROUTER_DEVTOOLS === "true" && (
          <TanStackRouterDevtools />
        )}
      </div>
    </>
  ),
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: APP_ROUTES.HOME,
  component: Home,
});

export const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: APP_ROUTES.PIPELINE_EDITOR,
  component: Editor,
  beforeLoad: ({ params, search }) => {
    const name = params._splat || (search as { name?: string }).name || "";
    return { name };
  },
});

export interface RunDetailParams {
  id: string;
}

export const runDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: APP_ROUTES.RUN_DETAIL,
  component: RunDetails,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  editorRoute,
  runDetailRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});
