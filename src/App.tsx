import type { ReactNode } from "react";

import AppFooter from "./components/AppFooter";

function App({ children }: { children: ReactNode }) {
  return (
    <div className="App">
      {children}
      <AppFooter />
    </div>
  );
}

export default App;
