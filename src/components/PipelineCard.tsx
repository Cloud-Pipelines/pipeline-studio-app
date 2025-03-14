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
import {
  type ComponentReferenceWithSpec,
  deleteComponentFileFromList,
} from "@/componentStore";
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
import localForage from "localforage";

interface PipelineRun {
  id: number;
  root_execution_id: number;
  created_at: string;
  pipeline_name: string;
  pipeline_digest?: string;
  status?: string;
}

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
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
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

  useEffect(() => {
    const fetchPipelineRuns = async () => {
      if (!name) return;

      setIsLoadingRuns(true);
      try {
        const pipelineRunsDb = localForage.createInstance({
          name: "components",
          storeName: "pipeline_runs",
        });

        const runs: PipelineRun[] = [];

        await pipelineRunsDb.iterate<PipelineRun, void>((run) => {
          if (run.pipeline_name === name) {
            runs.push(run);
          }
        });
        runs.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setPipelineRuns(runs);
      } catch (error) {
        console.error("Error fetching pipeline runs:", error);
      } finally {
        setIsLoadingRuns(false);
      }
    };

    fetchPipelineRuns();
  }, [name]);

  const handleOpenInEditor = async () => {
    navigate({
      to: `${EDITOR_PATH}/${name}`,
    });
  };

  const handleRunSelection = (value: string) => {
    setSelectedRun(value);
  };

  const handleDelete = async () => {
    if (name) {
      await deleteComponentFileFromList(USER_PIPELINES_LIST_NAME, name);
      setIsDeleted(true);
    }
  };

  const getRunStatusIcon = (run: PipelineRun) => {
    const statuses = ["SUCCEEDED", "FAILED", "RUNNING"];
    const status = run.status || statuses[run.id % 3]; // Mock status based on ID

    switch (status) {
      case "SUCCEEDED":
        return <CircleCheck className="w-4 h-4" color="green" />;
      case "FAILED":
        return <CircleAlert className="w-4 h-4" color="red" />;
      case "RUNNING":
        return (
          <RefreshCcw
            className="w-4 h-4 animate-spin [animation-duration:3s]"
            color="blue"
          />
        );
      default:
        return null;
    }
  };

  const handleViewRun = () => {
    if (selectedRun) {
      navigate({
        to: `/runs/${selectedRun}`,
      });
    }
  };

  if (isDeleted) {
    return null;
  }

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
              <SelectValue
                placeholder={isLoadingRuns ? "Loading..." : "Runs"}
              />
            </SelectTrigger>
            <SelectContent>
              {pipelineRuns.length === 0 ? (
                <SelectItem value="no-runs" disabled>
                  No runs available
                </SelectItem>
              ) : (
                pipelineRuns.map((run) => (
                  <SelectItem key={run.id} value={run.id.toString()}>
                    ID: {run.id} {getRunStatusIcon(run)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            disabled={!selectedRun}
            onClick={handleViewRun}
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
