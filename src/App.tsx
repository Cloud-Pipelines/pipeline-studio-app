import AppFooter from "./AppFooter";

function App({ children }: { children: React.ReactNode }) {
  return (
    <div className="App">
      {children}
      <AppFooter />
    </div>
  );
}

export default App;
