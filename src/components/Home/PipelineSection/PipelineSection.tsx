import { type ChangeEvent, useCallback, useEffect, useState } from "react";

import NewPipelineButton from "@/components/shared/NewPipelineButton";
import { withSuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paragraph } from "@/components/ui/typography";
import {
  type ComponentFileEntry,
  getAllComponentFilesFromList,
} from "@/utils/componentStore";
import { USER_PIPELINES_LIST_NAME } from "@/utils/constants";

import BulkActionsBar from "./BulkActionsBar";
import PipelineRow from "./PipelineRow";

type Pipelines = Map<string, ComponentFileEntry>;

const PipelineSectionSkeleton = () => {
  return (
    <BlockStack className="h-full" gap="3">
      <BlockStack>
        <InlineStack gap="2" align="space-between" className="w-full">
          <Skeleton size="lg" shape="button" />
          <Skeleton size="lg" shape="button" />
          <Skeleton size="lg" shape="button" />
        </InlineStack>
      </BlockStack>
      <BlockStack className="h-[40vh] mt-4" gap="2" inlineAlign="space-between">
        <BlockStack gap="2">
          <Skeleton size="full" />
          <Skeleton size="half" />
          <Skeleton size="full" />
          <Skeleton size="half" />
          <Skeleton size="full" />
        </BlockStack>
        <BlockStack gap="2" align="end">
          <Skeleton size="lg" shape="button" />
        </BlockStack>
      </BlockStack>
    </BlockStack>
  );
};

export const PipelineSection = withSuspenseWrapper(() => {
  const [pipelines, setPipelines] = useState<Pipelines>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPipelines, setSelectedPipelines] = useState<Set<string>>(
    new Set(),
  );

  const filteredPipelines = Array.from(pipelines.entries()).filter(([name]) => {
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const fetchUserPipelines = useCallback(async () => {
    setIsLoading(true);
    try {
      const pipelines = await getAllComponentFilesFromList(
        USER_PIPELINES_LIST_NAME,
      );
      const sortedPipelines = new Map(
        [...pipelines.entries()].sort((a, b) => {
          return (
            new Date(b[1].modificationTime).getTime() -
            new Date(a[1].modificationTime).getTime()
          );
        }),
      );
      setPipelines(sortedPipelines);
    } catch (error) {
      console.error("Failed to load user pipelines:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allPipelineNames = new Set(
          filteredPipelines.map(([name]) => name),
        );
        setSelectedPipelines(allPipelineNames);
      } else {
        setSelectedPipelines(new Set());
      }
    },
    [filteredPipelines],
  );

  const handleSelectPipeline = useCallback(
    (pipelineName: string, checked: boolean) => {
      const newSelected = new Set(selectedPipelines);
      if (checked) {
        newSelected.add(pipelineName);
      } else {
        newSelected.delete(pipelineName);
      }
      setSelectedPipelines(newSelected);
    },
    [selectedPipelines],
  );

  const handleBulkDelete = useCallback(() => {
    setSelectedPipelines(new Set());
    fetchUserPipelines();
  }, [fetchUserPipelines]);

  useEffect(() => {
    fetchUserPipelines();
  }, [fetchUserPipelines]);

  if (isLoading) {
    return (
      <InlineStack gap="2" blockAlign="center" className="mt-4">
        <Spinner /> Loading...
      </InlineStack>
    );
  }

  if (pipelines.size === 0) {
    return (
      <BlockStack gap="2" align="center" className="mt-4">
        <Paragraph>No pipelines found.</Paragraph>
        <NewPipelineButton />
      </BlockStack>
    );
  }

  const isAllSelected =
    filteredPipelines.length > 0 &&
    filteredPipelines.every(([name]) => selectedPipelines.has(name));

  return (
    <BlockStack gap="4" className="w-full">
      <Alert variant="destructive">
        <Icon name="Terminal" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          Your pipelines are stored in your browser&apos;s local storage.
          Clearing your browser data or cookies will delete all saved pipelines.
          Consider exporting important pipelines to files for backup.
        </AlertDescription>
      </Alert>

      <BlockStack className="w-full">
        <Label className="mb-2">Search pipelines</Label>
        <InlineStack gap="1" wrap="nowrap">
          <Input type="text" value={searchQuery} onChange={handleSearch} />
          {!!searchQuery && (
            <Button variant="ghost" onClick={() => setSearchQuery("")}>
              <Icon name="CircleX" />
            </Button>
          )}
        </InlineStack>
      </BlockStack>

      {pipelines.size > 0 && (
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Modified at</TableHead>
              <TableHead>Last run</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPipelines.length === 0 && (
              <TableRow>No Pipelines found.</TableRow>
            )}
            {filteredPipelines.map(([name, fileEntry]) => (
              <PipelineRow
                key={fileEntry.componentRef.digest}
                name={name.replace(/_/g, " ")}
                modificationTime={fileEntry.modificationTime}
                onDelete={fetchUserPipelines}
                isSelected={selectedPipelines.has(name)}
                onSelect={(checked) => handleSelectPipeline(name, checked)}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <Button onClick={fetchUserPipelines} className="mt-6 max-w-96">
        Refresh
      </Button>

      {selectedPipelines.size > 0 && (
        <BulkActionsBar
          selectedPipelines={Array.from(selectedPipelines)}
          onDeleteSuccess={handleBulkDelete}
          onClearSelection={() => setSelectedPipelines(new Set())}
        />
      )}
    </BlockStack>
  );
}, PipelineSectionSkeleton);
