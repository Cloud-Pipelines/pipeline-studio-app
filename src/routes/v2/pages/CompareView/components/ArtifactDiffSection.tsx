import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/typography";
import { useExecutionArtifacts } from "@/hooks/useExecutionArtifacts";
import { cn } from "@/lib/utils";
import { useBackend } from "@/providers/BackendProvider";
import { outputArtifactsOf } from "@/routes/v2/pages/CompareView/utils/compareArtifacts";
import { unionKeysAFirst } from "@/routes/v2/pages/CompareView/utils/comparePipelines";
import { tracking } from "@/utils/tracking";

import { ArtifactDiffRow } from "./ArtifactDiffRow";

interface ArtifactDiffSectionProps {
  executionIdA?: string;
  executionIdB?: string;
  labelA: string;
  labelB: string;
}

function ArtifactDiffList({
  executionIdA,
  executionIdB,
  labelA,
  labelB,
}: ArtifactDiffSectionProps) {
  const queryA = useExecutionArtifacts(executionIdA);
  const queryB = useExecutionArtifacts(executionIdB);

  const isLoading =
    (queryA.isFetching && !queryA.data) || (queryB.isFetching && !queryB.data);

  if (isLoading) {
    return (
      <InlineStack gap="2" blockAlign="center">
        <Spinner />
        <Text as="span" size="xs" tone="subdued">
          Loading artifacts…
        </Text>
      </InlineStack>
    );
  }

  const artifactsA = outputArtifactsOf(queryA.data);
  const artifactsB = outputArtifactsOf(queryB.data);
  const names = unionKeysAFirst(artifactsA, artifactsB);

  if (names.length === 0) {
    return (
      <Text as="span" size="xs" tone="subdued">
        No output artifacts.
      </Text>
    );
  }

  return (
    <BlockStack gap="2">
      {names.map((name) => (
        <ArtifactDiffRow
          key={name}
          name={name}
          a={artifactsA[name]}
          b={artifactsB[name]}
          labelA={labelA}
          labelB={labelB}
        />
      ))}
    </BlockStack>
  );
}

/**
 * A section is rendered per compared task, so keeping the two artifact queries
 * in a child that Radix only mounts once expanded is what stops a wide pipeline
 * from firing two requests per task the moment the tab opens.
 */
export function ArtifactDiffSection({
  executionIdA,
  executionIdB,
  labelA,
  labelB,
}: ArtifactDiffSectionProps) {
  const { configured } = useBackend();
  const [open, setOpen] = useState(false);

  if (!configured || (!executionIdA && !executionIdB)) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="-ml-1 gap-1 px-1"
          {...tracking("compare_runs.task.toggle_artifacts")}
        >
          <Icon
            name="ChevronRight"
            size="xs"
            className={cn("transition-transform", open && "rotate-90")}
          />
          <Text as="span" size="xs" weight="semibold" tone="subdued">
            Artifacts
          </Text>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <ArtifactDiffList
          executionIdA={executionIdA}
          executionIdB={executionIdB}
          labelA={labelA}
          labelB={labelB}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
