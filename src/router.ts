import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import RootLayout from "./components/RootLayout";
import Editor from "./routes/Editor";
import Home from "./routes/Home";
import RunDetails from "./routes/RunDetails";
import { APP_ROUTES } from "./utils/constants";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

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
