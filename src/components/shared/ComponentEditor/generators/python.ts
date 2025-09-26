import { useSuspenseQuery } from "@tanstack/react-query";
import { loadPyodide, version as pyodideVersion } from "pyodide";

// type YamlGenerator = (text: string) => Promise<string>;

export function usePythonYamlGenerator() {
  const { data: yamlGenerator } = useSuspenseQuery({
    queryKey: ["yaml-generator", "python"],
    queryFn: initializePythonYamlGenerator,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return yamlGenerator;
}

async function initializePythonYamlGenerator() {
  try {
    const createComponentFromPythonFunctionText = (
      await import("./create_component_from_python_function_text.py?raw")
    ).default;

    const pyodide = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    });
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("cloud-pipelines");
    await pyodide.runPython(createComponentFromPythonFunctionText);

    const transformTextToYaml = pyodide.globals.get(
      "create_component_from_python_function_text",
    ) as (text: string) => string;

    return async (text: string) => transformTextToYaml(text);
  } catch (error) {
    // TODO: Handle error
    console.error("Pyodide loading error:", error);
    throw error;
  }
}
