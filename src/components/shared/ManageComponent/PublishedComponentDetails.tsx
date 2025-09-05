import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Heading, Paragraph, Text } from "@/components/ui/typography";
import type { HydratedComponentReference } from "@/utils/componentSpec";

import { withSuspenseWrapper } from "../SuspenseWrapper";
import { ComponentUsageCount } from "./ComponentUsageCount";
import { useForceUpdateTasks } from "./hooks/useForceUpdateTasks";
import { useHasPublishedComponent } from "./hooks/useHasPublishedComponent";
import { useOutdatedComponents } from "./hooks/useOutdatedComponents";
import { TrimmedDigest } from "./TrimmedDigest";

const PublishedComponentDetailsSkeleton = () => {
  return (
    <InlineStack gap="1" blockAlign="center" align="center">
      <Spinner size={10} />
      <Text size="xs" tone="subdued">
        Looking for updates...
      </Text>
    </InlineStack>
  );
};

export const PublishedComponentDetails = withSuspenseWrapper(
  ({
    component,
    onUpdateTasks,
  }: {
    component: HydratedComponentReference;
    onUpdateTasks?: () => void;
  }) => {
    const { data: isPublished } = useHasPublishedComponent(component);
    const { data: outdatedComponents } = useOutdatedComponents([component]);

    const outdatedComponentIndex = useMemo(
      () => new Map(outdatedComponents.map(([c, m]) => [c.digest, m])),
      [outdatedComponents],
    );

    const onForceUpdate = useForceUpdateTasks(
      outdatedComponentIndex.get(component.digest) ?? null,
    );

    if (!isPublished) {
      return null;
    }

    const isOutdated = outdatedComponentIndex.has(component.digest);

    const handleUpdateTasks = useCallback(() => {
      onForceUpdate(component.digest);
      onUpdateTasks?.();
    }, [onUpdateTasks, onForceUpdate, component.digest]);

    return (
      <BlockStack className="w-full py-2 my-2 border rounded-md">
        <InlineStack
          blockAlign="start"
          align="space-between"
          className="w-full"
          gap="1"
        >
          <BlockStack
            className="w-[10%] p-2"
            inlineAlign="center"
            align="center"
          >
            <Icon name="BookCheck" size="fill" />
          </BlockStack>
          <BlockStack className="w-[85%]">
            <Heading level={2}>This is a published component</Heading>
            <InlineStack gap="1" align="center">
              <TrimmedDigest digest={component.digest} tone="info" />
              <ComponentUsageCount digest={component.digest}>
                {(count) => (
                  <Text size="xs" tone="subdued">
                    | Used {count} times in this Pipeline.
                  </Text>
                )}
              </ComponentUsageCount>
            </InlineStack>
            {isOutdated ? (
              <InlineStack gap="1" blockAlign="center" align="center">
                <Paragraph size="xs" tone="critical">
                  There is a newer version of this component available.
                </Paragraph>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={handleUpdateTasks}
                >
                  Upgrade tasks?
                </Button>
              </InlineStack>
            ) : null}
          </BlockStack>
        </InlineStack>
      </BlockStack>
    );
  },
  PublishedComponentDetailsSkeleton,
);
