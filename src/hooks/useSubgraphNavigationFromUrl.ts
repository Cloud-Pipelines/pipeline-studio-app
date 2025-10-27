import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { useComponentSpec } from "@/providers/ComponentSpecProvider";

function hasSubgraphPath(search: unknown): search is { subgraphPath: string } {
  if (search === null || typeof search !== "object") {
    return false;
  }

  if (!("subgraphPath" in search)) {
    return false;
  }

  const value = (search as Record<string, unknown>)["subgraphPath"];
  return typeof value === "string";
}

/**
 * Navigates to a subgraph from URL parameters on mount
 *
 * For run routes, recursively navigates through each level to ensure execution
 * data is fetched at each step. For editor routes, navigates directly.
 *
 * @param isLoading - Wait for this to be false before starting navigation
 * @param currentExecutionId - Current execution ID (run routes only)
 * @param isEditorRoute - True for editor routes (direct navigation)
 * @returns isNavigatingToUrl - True while navigation is in progress
 */
export const useSubgraphNavigationFromUrl = (
  isLoading = false,
  currentExecutionId?: string,
  isEditorRoute = false,
) => {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const { componentSpec, navigateToPath, currentSubgraphPath } =
    useComponentSpec();
  const initialSearchRef = useRef(search);
  const [targetPath, setTargetPath] = useState<string[] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const isNavigatingRef = useRef(false);

  const hasUrlSubgraphPath =
    search !== null &&
    typeof search === "object" &&
    "subgraphPath" in search &&
    typeof (search as Record<string, unknown>).subgraphPath === "string";

  const isNavigatingToUrl =
    hasUrlSubgraphPath && targetPath !== null && targetPath.length > 0;

  useEffect(() => {
    if (!componentSpec || isLoading || targetPath !== null) {
      return;
    }

    const urlSubgraphPath = hasSubgraphPath(initialSearchRef.current)
      ? initialSearchRef.current.subgraphPath
      : undefined;

    if (!urlSubgraphPath) {
      setTargetPath([]);
      return;
    }

    try {
      const decodedPath = decodeURIComponent(urlSubgraphPath);
      const pathArray = decodedPath.split(",");

      if (pathArray.length > 0 && pathArray[0] === "root") {
        setTargetPath(pathArray);
        setCurrentStep(1);
      } else {
        setTargetPath([]);
      }
    } catch (error) {
      console.warn("Failed to parse subgraphPath URL parameter:", error);
      setTargetPath([]);
    }
  }, [componentSpec, isLoading, targetPath]);

  useEffect(() => {
    if (!isEditorRoute || !targetPath || targetPath.length === 0) {
      return;
    }

    if (currentStep === 1 && currentSubgraphPath.length === 1) {
      navigateToPath(targetPath);

      const timer = setTimeout(() => {
        const searchObj = initialSearchRef.current;
        if (
          searchObj &&
          typeof searchObj === "object" &&
          "subgraphPath" in searchObj
        ) {
          const { subgraphPath: _removed, ...rest } = searchObj;
          void navigate({
            search: rest as any,
            replace: true,
          });
        }
        setCurrentStep(999);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [
    isEditorRoute,
    targetPath,
    currentStep,
    currentSubgraphPath,
    navigateToPath,
    navigate,
  ]);

  useEffect(() => {
    if (
      isEditorRoute ||
      !targetPath ||
      targetPath.length === 0 ||
      currentStep === 0
    ) {
      return;
    }

    const currentDepth = currentSubgraphPath.length;
    const targetDepth = targetPath.length;

    if (currentDepth === targetDepth) {
      const isAtTarget =
        JSON.stringify(currentSubgraphPath) === JSON.stringify(targetPath);

      if (isAtTarget) {
        const searchObj = initialSearchRef.current;
        if (
          searchObj &&
          typeof searchObj === "object" &&
          "subgraphPath" in searchObj
        ) {
          const { subgraphPath: _removed, ...rest } = searchObj;
          void navigate({
            search: rest as any,
            replace: true,
          });
        }
        setCurrentStep(999);
      }
      return;
    }

    if (isNavigatingRef.current) {
      return;
    }

    const nextLevelPath = targetPath.slice(0, currentDepth + 1);
    const shouldNavigate =
      JSON.stringify(currentSubgraphPath) ===
      JSON.stringify(targetPath.slice(0, currentDepth));

    if (shouldNavigate) {
      isNavigatingRef.current = true;
      navigateToPath(nextLevelPath);

      const timer = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    isEditorRoute,
    targetPath,
    currentStep,
    currentSubgraphPath,
    currentExecutionId,
    navigateToPath,
    navigate,
  ]);

  return { isNavigatingToUrl };
};
