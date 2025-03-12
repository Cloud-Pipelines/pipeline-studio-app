import { useState, useEffect } from "react";
import { downloadDataWithCache, loadObjectFromYamlData } from "@/cacheUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { savePipelineSpecToSessionStorage } from "@/DragNDrop/PipelineAutoSaver";
import {
  fullyLoadComponentRefFromUrl,
  type ComponentReferenceWithSpec,
  preloadComponentReferences,
  loadComponentAsRefFromText,
  deleteComponentFileFromList,
} from "@/componentStore";
import { isGraphImplementation } from "@/componentSpec";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  PencilLine,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { EDITOR_PATH, USER_PIPELINES_LIST_NAME } from "@/utils/constants";

interface PipelineCardProps {
  url?: string;
  componentRef?: ComponentReferenceWithSpec;
  name?: string;
  canDelete?: boolean;
}

const PipelineCard = ({
  url,
  componentRef,
  name,
  canDelete = false,
}: PipelineCardProps) => {
  const [isDeleted, setIsDeleted] = useState(false);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [cardData, setCardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (componentRef) {
      if (!componentRef.spec) {
        console.error(`Component ref for ${name} has no spec:`, componentRef);
        setError("Invalid component reference");
        return;
      }

      setCardData(componentRef.spec);
      return;
    }

    if (url) {
      const fetchCardData = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const data = await downloadDataWithCache(url, loadObjectFromYamlData);
          setCardData(data);
        } catch (error) {
          console.error(`Error fetching data from ${url}:`, error);
          setError("Failed to load pipeline data");
        } finally {
          setIsLoading(false);
        }
      };

      fetchCardData();
    }
  }, [url, componentRef, name]);

  const handleOpenInEditor = async () => {
    try {
      setIsLoading(true);

      if (componentRef) {
        await prepareComponentRefForEditor(componentRef);
      } else if (url) {
        const loadedComponentRef = await fullyLoadComponentRefFromUrl(
          url,
          downloadDataWithCache,
        );
        savePipelineSpecToSessionStorage(loadedComponentRef.spec);
      }
      navigate({ to: `${EDITOR_PATH}/${name?.replace(" ", "_")}` });
    } catch (error) {
      console.error("Error preparing pipeline for editor:", error);
      setError(
        `Failed to open pipeline in editor: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isDeleted) {
    return null;
  }

  const prepareComponentRefForEditor = async (
    ref: ComponentReferenceWithSpec,
  ) => {
    const safeSpec = structuredClone(ref.spec);

    if (
      safeSpec.implementation &&
      isGraphImplementation(safeSpec.implementation)
    ) {
      const graphImpl = structuredClone(safeSpec.implementation.graph);

      if (graphImpl.tasks) {
        await loadInlineComponentRefs(graphImpl.tasks);
      }

      safeSpec.implementation.graph = graphImpl;
    }

    await preloadComponentReferences(safeSpec, downloadDataWithCache);
    savePipelineSpecToSessionStorage(safeSpec);
  };

  const loadInlineComponentRefs = async (tasks: Record<string, any>) => {
    for (const taskId in tasks) {
      const task = tasks[taskId];

      if (
        task.componentRef &&
        task.componentRef.text &&
        !task.componentRef.text.startsWith("http") &&
        !task.componentRef.spec
      ) {
        try {
          const loadedRef = await loadComponentAsRefFromText(
            task.componentRef.text,
          );
          task.componentRef.spec = loadedRef.spec;
        } catch (err) {
          console.warn(
            `Could not parse component text for task ${taskId}`,
            err,
          );
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="min-h-[150px] flex items-center justify-center">
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="min-h-[150px] border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>{error}</CardContent>
      </Card>
    );
  }

  if (!cardData && !componentRef?.spec) {
    return (
      <Card className="min-h-[150px] border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-500">No Data</CardTitle>
        </CardHeader>
        <CardContent>
          {name || "Unnamed Pipeline"} (No pipeline data available)
        </CardContent>
      </Card>
    );
  }

  const pipelineSpec = componentRef?.spec || cardData;
  const displayName = name || pipelineSpec?.name || "Unnamed Pipeline";
  const taskCount = pipelineSpec?.implementation?.graph?.tasks
    ? Object.keys(pipelineSpec.implementation.graph.tasks).length
    : 0;

  const handleRunSelection = (value: string) => {
    setSelectedRun(value);
  };

  const handleDelete = async () => {
    if (name) {
      await deleteComponentFileFromList(USER_PIPELINES_LIST_NAME, name);
      setIsDeleted(true);
    }
  };

  return (
    <Card className="min-h-[150px]">
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        {pipelineSpec?.description && (
          <CardDescription>{pipelineSpec.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">
          {taskCount > 0 ? `${taskCount} tasks` : "No tasks"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleOpenInEditor}>
          <PencilLine className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-0 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 focus-within:ring-offset-background rounded-md">
          <Select onValueChange={handleRunSelection}>
            <SelectTrigger className="w-[180px] max-w-[180px] rounded-r-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <SelectValue placeholder="Runs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1234567890">
                ID: 1234567890 <CircleAlert className="w-4 h-4" color="red" />
              </SelectItem>
              <SelectItem value="0987654321">
                ID: 0987654321 <CircleCheck className="w-4 h-4" color="green" />
              </SelectItem>
              <SelectItem value="5647382910">
                ID: 5647382910{" "}
                <RefreshCcw
                  className="w-4 h-4 animate-spin [animation-duration:3s]"
                  color="blue"
                />
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            disabled={!selectedRun}
          >
            <ChevronRight />
          </Button>
        </div>
        {canDelete && (
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PipelineCard;
