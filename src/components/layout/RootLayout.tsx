import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ToastContainer } from "react-toastify";

import { FullscreenProvider } from "@/components/shared/CodeViewer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

import AppFooter from "./AppFooter";
import AppMenu from "./AppMenu";

const RootLayout = () => {
  useDocumentTitle();

  return (
    <SidebarProvider>
      <FullscreenProvider>
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
      </FullscreenProvider>
    </SidebarProvider>
  );
};

export default RootLayout;
