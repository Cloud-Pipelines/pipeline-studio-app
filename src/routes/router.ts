import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import RootLayout from "../components/layout2/RootLayout";
import Editor from "./Editor";
import Home from "./Home";
import PipelineRun from "./PipelineRun";

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
  component: RootLayout,
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
  component: PipelineRun,
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
