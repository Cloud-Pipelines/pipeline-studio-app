import { ReactFlowProvider } from "@xyflow/react";
import AppFooter from "./AppFooter";
import DnDFlow from "./DragNDrop";
import { DnDProvider } from "./contex/DNDContext";

function App() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <div className="App" style={{ width: "100%", height: "calc(100vh - 30px)" }}>
          <DnDFlow />
          <AppFooter />
        </div>
      </DnDProvider>
    </ReactFlowProvider>
  );
}


export default App;

