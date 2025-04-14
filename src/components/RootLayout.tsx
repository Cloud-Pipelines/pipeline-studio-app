import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import AppFooter from "./AppFooter";
import AppMenu from "./AppMenu";

const RootLayout = () => (
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
);

export default RootLayout;
