import { useSuspenseQuery } from "@tanstack/react-query";
import { loadPyodide, version as pyodideVersion } from "pyodide";

import { HOURS } from "../constants";

type YamlGenerator = (text: string) => Promise<string>;

export function usePythonYamlGenerator() {
  const { data: yamlGenerator } = useSuspenseQuery({
    queryKey: ["yaml-generator", "python"],
    queryFn: initializePythonYamlGenerator,
    staleTime: 24 * HOURS,
  });

  return yamlGenerator;
}

async function initializePythonYamlGenerator(): Promise<YamlGenerator> {
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
    // Error will be caught by the suspense wrapper
    console.error("Pyodide loading error:", error);
    throw error;
  }
}
