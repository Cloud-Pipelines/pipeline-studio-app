import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import Editor from "./routes/Editor";
import Home from "./routes/Home";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import AppFooter from "./components/AppFooter";
import AppMenu from "./components/AppMenu";
import { APP_ROUTES } from "./utils/constants";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootRoute = createRootRoute({
  component: () => (
    <>
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

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: APP_ROUTES.HOME,
  component: Home,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: APP_ROUTES.PIPELINE_EDITOR,
  component: Editor,
});

const routeTree = rootRoute.addChildren([indexRoute, editorRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});
