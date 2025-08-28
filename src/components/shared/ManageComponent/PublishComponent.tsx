import { Separator } from "@radix-ui/react-separator";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  type ComponentProps,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heading, Text } from "@/components/ui/typography";
import useConfirmationDialog from "@/hooks/useConfirmationDialog";
import { useHydrateComponentReference } from "@/hooks/useHydrateComponentReference";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import {
  type ComponentReference,
  type ComponentReferenceWithDigest,
  type HydratedComponentReference,
  isDiscoverableComponentReference,
  isGraphImplementation,
} from "@/utils/componentSpec";

import ConfirmationDialog from "../Dialogs/ConfirmationDialog";
import { InfoBox } from "../InfoBox";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import TaskImplementation from "../TaskDetails/Implementation";
import { getUserDetails } from "./user.utils";

interface ComponentPublishProps {
  component: HydratedComponentReference;
  displayName: string;
}

const ComponentSpecCheckStatement = ({
  isValid,
  validLabel,
  invalidLabel,
  children,
}: PropsWithChildren<{
  isValid: boolean;
  validLabel: string;
  invalidLabel: string;
}>) => {
  return (
    <InlineStack gap="2" align="start" blockAlign="center">
      {isValid ? (
        <Icon name="Check" className="text-green-500" />
      ) : (
        <Icon name="OctagonAlert" className="text-yellow-500" />
      )}
      <Text as="span" size="sm">
        {isValid ? validLabel : invalidLabel}
      </Text>
      {children}
    </InlineStack>
  );
};

const ComponentSpecQualityCheck = ({
  component,
}: {
  component: HydratedComponentReference;
}) => {
  const { spec: componentSpec } = component;

  // Check if all inputs have Type and Description
  const invalidInputs =
    componentSpec.inputs?.filter(
      (input) => !input.type || !input.description,
    ) ?? [];
  const inputsValid = invalidInputs.length === 0;

  // Check if all outputs have Type and Description
  const invalidOutputs =
    componentSpec.outputs?.filter(
      (output) => !output.type || !output.description,
    ) ?? [];
  const outputsValid = invalidOutputs.length === 0;

  // Check if component has a description
  const hasDescription = !!componentSpec.description;

  // Check if component has a name
  const hasName = !!component.name;

  return (
    <BlockStack gap="1">
      <Heading level={2}>ComponentSpec quality check</Heading>
      <Text as="p" size="xs" tone="subdued">
        Although following the ComponentSpec quality standard is not strictly
        required for publishing, we strongly encourage you to adhere to it.
        High-quality specifications help ensure your component is
        well-documented, maintainable, and easily reusable by others in your
        workspace. Meeting these standards improves discoverability and
        collaboration across teams.
      </Text>
      <BlockStack gap="1" className="border-l pl-2">
        <ComponentSpecCheckStatement
          isValid={hasName}
          validLabel="Component has a name"
          invalidLabel="Component is missing a name"
        />

        <ComponentSpecCheckStatement
          isValid={hasDescription}
          validLabel="Component has a description"
          invalidLabel="Component is missing a description"
        />

        <ComponentSpecCheckStatement
          isValid={inputsValid}
          validLabel="All inputs have Type and Description"
          invalidLabel="Missing Type or Description for inputs"
        >
          <Text tone="critical" size="xs">
            {invalidInputs.map((i) => i.name).join(", ")}
          </Text>
        </ComponentSpecCheckStatement>

        <ComponentSpecCheckStatement
          isValid={outputsValid}
          validLabel="All outputs have Type and Description"
          invalidLabel="Missing Type or Description for outputs"
        >
          <Text tone="critical" size="xs">
            {invalidOutputs.map((o) => o.name).join(", ")}
          </Text>
        </ComponentSpecCheckStatement>
      </BlockStack>
    </BlockStack>
  );
};

const ComponentSpecProperty = ({
  label,
  value,
  tooltip,
}: {
  label: string;
  value?: string;
  tooltip?: string;
}) => {
  if (!value) {
    return null;
  }

  return (
    <InlineStack gap="1">
      <Text as="span" size="xs" weight="semibold">
        {`${label}:`}
      </Text>
      <Text as="span" size="xs">
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Text tone="info">{value}</Text>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          value
        )}
      </Text>
    </InlineStack>
  );
};

const ComponentQuickDetailsDialogTrigger = ({
  component,
}: {
  component: ComponentReferenceWithDigest;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="link-info"
        size="inline-xs"
        onClick={() => setIsOpen(true)}
      >
        {trimDigest(component.digest)}
      </Button>
      {/* not showing the dialog prevents excessive requests */}
      {isOpen ? (
        <ComponentQuickDetailsDialog
          component={component}
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      ) : null}
    </>
  );
};

const ComponentQuickDetailsDialogSkeleton = () => {
  /**
   * this appears as a tiny spinner inline, next to the trigger.
   */
  return <Spinner size={10} />;
};

const ComponentQuickDetailsDialog = withSuspenseWrapper(
  ({
    component,
    open,
    onOpenChange,
  }: {
    component: ComponentReferenceWithDigest;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    const hydratedComponent = useHydrateComponentReference(component);

    if (!hydratedComponent) {
      return null;
    }

    const displayName = hydratedComponent.name;

    return (
      <Dialog modal open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl min-w-2xl overflow-hidden"
          aria-label={`${displayName} component details`}
        >
          <DialogTitle className="flex items-center gap-2 mr-5">
            <Text>
              {displayName}: {trimDigest(hydratedComponent.digest)}
            </Text>
          </DialogTitle>

          <BlockStack gap="1" className="h-[400px]" align="stretch">
            <ComponentSpecProperty
              label="Digest"
              value={hydratedComponent.digest}
            />

            <TaskImplementation
              displayName={displayName}
              componentSpec={hydratedComponent.spec}
            />
          </BlockStack>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
  ComponentQuickDetailsDialogSkeleton,
);

/**
 * Publish a component.
 *
 * @param component - The component to publish.
 * @param onSuccess - Callback function to be called when the mutation is successful.
 * @returns A button to publish the component.
 */
const PublishComponentButton = ({
  component,
  onSuccess,
}: {
  component: HydratedComponentReference;
  onSuccess?: () => void;
}) => {
  const {
    handlers: confirmationHandlers,
    triggerDialog: triggerConfirmation,
    ...confirmationProps
  } = useConfirmationDialog();
  const { getComponentLibrary } = useComponentLibrary();
  const publishedComponentsLibrary = getComponentLibrary(
    "published_components",
  );
  const queryClient = useQueryClient();
  const notify = useToastNotification();
  const {
    mutate: publishComponent,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      await publishedComponentsLibrary.addComponent(component);
    },
    onSuccess: () => {
      notify("Component published successfully", "success");
      queryClient.invalidateQueries({
        queryKey: ["component-library", "published", "has", component.digest],
      });
      onSuccess?.();
    },
    onError: (error) => {
      notify(`Failed to publish component: ${error.message}`, "error");
    },
  });

  const confirmationContent = useMemo(
    () => (
      <>
        <BlockStack gap="1">
          <Text as="p" size="xs" tone="subdued">
            Published Components are shared components that are available to all
            users in the workspace. By publishing, you make this component
            discoverable and reusable by others through the component library.
          </Text>

          <ComponentSpecQualityCheck component={component} />
        </BlockStack>
      </>
    ),
    [component],
  );

  const confirmProcess = useCallback(async () => {
    const confirmed = await triggerConfirmation({
      title: "Publish component",
      content: confirmationContent,
    });

    if (confirmed) {
      publishComponent();
    }
  }, [triggerConfirmation, publishComponent, confirmationContent]);

  return (
    <>
      <Button disabled={isPending} onClick={confirmProcess} size="xs">
        Publish component {isPending ? <Spinner /> : null}
      </Button>
      {isError && (
        <InfoBox title="Error" variant="error">
          {error.message}
        </InfoBox>
      )}
      <ConfirmationDialog
        {...confirmationProps}
        onConfirm={() => confirmationHandlers?.onConfirm()}
        onCancel={() => confirmationHandlers?.onCancel()}
      />
    </>
  );
};

/**
 * Delete a published component.
 * If a successor component is provided, it will be published instead of deprecated.
 *
 * @param predecessorComponent - The component to delete (deprecate).
 * @param successorComponent - The component to publish instead of deprecated.
 * @param onSuccess - Callback function to be called when the mutation is successful.
 * @returns A button to delete the component.
 */
const DeletePublishedComponentButton = ({
  predecessorComponent,
  successorComponent,
  onSuccess,
}: {
  predecessorComponent: HydratedComponentReference;
  successorComponent?: HydratedComponentReference;
  onSuccess?: () => void;
}) => {
  const {
    handlers: confirmationHandlers,
    triggerDialog: triggerConfirmation,
    ...confirmationProps
  } = useConfirmationDialog();
  const { getComponentLibrary } = useComponentLibrary();
  const publishedComponentsLibrary = getComponentLibrary(
    "published_components",
  );
  const queryClient = useQueryClient();
  const notify = useToastNotification();

  // strings and content for the confirmation dialog
  const { title, description, content, successMessage, buttonLabel } =
    useMemo(() => {
      if (successorComponent) {
        return {
          buttonLabel: "Release new version",
          title: predecessorComponent.name,
          description:
            "Are you sure you want to release a new version of this component?",
          successMessage: "Component updated successfully",
          content: (
            <BlockStack gap="1">
              <Text as="p" size="xs" tone="subdued">
                This will create a new version of the component with the same
                name. Previous version will be marked as deprecated. In search
                results, the new version will be listed. Users who have already
                used the previous version will still be able to use it or
                upgrade to the new version.
              </Text>
              <ComponentSpecQualityCheck component={successorComponent} />
            </BlockStack>
          ),
        };
      }

      return {
        buttonLabel: "Deprecate component",
        title: predecessorComponent.name,
        description: "Are you sure you want to deprecate this component?",
        successMessage: "Component deprecated successfully",
        content: (
          <Text as="p" size="sm">
            This will deprecate the component and it will no longer be available
            in search results. The component will still be available in the
            component library for users who have already used it.
          </Text>
        ),
      };
    }, [successorComponent, predecessorComponent]);

  const {
    mutate: deletePublishedComponent,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      await publishedComponentsLibrary.removeComponent(predecessorComponent, {
        supersedeBy: successorComponent,
      });
    },
    onSuccess: () => {
      notify(successMessage, "success");
      if (successorComponent) {
        queryClient.invalidateQueries({
          queryKey: [
            "component-library",
            "published",
            "has",
            successorComponent.digest,
          ],
        });
      }
      onSuccess?.();
    },
    onError: (error) => {
      notify(`Failed to update component: ${error.message}`, "error");
    },
  });

  const confirmProcess = useCallback(async () => {
    const confirmed = await triggerConfirmation({
      title,
      description,
      content,
    });

    if (confirmed) {
      deletePublishedComponent();
    }
  }, [
    title,
    description,
    content,
    triggerConfirmation,
    deletePublishedComponent,
  ]);

  return (
    <>
      <Button disabled={isPending} onClick={confirmProcess} size="xs">
        {buttonLabel} {isPending ? <Spinner /> : null}
      </Button>
      {isError && (
        <InfoBox title="Error" variant="error">
          {error.message}
        </InfoBox>
      )}
      <ConfirmationDialog
        {...confirmationProps}
        onConfirm={() => confirmationHandlers?.onConfirm()}
        onCancel={() => confirmationHandlers?.onCancel()}
      />
    </>
  );
};

/**
 * Trim a digest to 10 characters - 4 characters from the start and 6 characters from the end.
 *
 * @param digest - The digest to trim.
 * @returns The trimmed digest.
 */
function trimDigest(digest: string) {
  return digest.slice(0, 4) + "..." + digest.slice(-6);
}

const TrimmedDigest = ({
  digest,
  children,
}: {
  digest: string;
  children: (trimmedDigest: string, digest: string) => ReactNode;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children(trimDigest(digest), digest)}
      </TooltipTrigger>
      <TooltipContent>{digest}</TooltipContent>
    </Tooltip>
  );
};

const ComponentsOnCanvas = withSuspenseWrapper(
  ({
    digest,
    children,
  }: {
    digest: string;
    children: (count: number) => ReactNode;
  }) => {
    const { componentSpec } = useComponentSpec();

    if (!isGraphImplementation(componentSpec.implementation)) {
      return null;
    }

    const tasks = componentSpec.implementation?.graph?.tasks;

    const componentsOnCanvas = Object.values(tasks).filter(
      (task) => task.componentRef.digest === digest,
    );

    if (componentsOnCanvas.length === 0) {
      return null;
    }

    return children(componentsOnCanvas.length);
  },
);

const ComponentHistoryTimelineItem = ({
  icon,
  iconClassName,
  children,
}: PropsWithChildren<{
  icon: ComponentProps<typeof Icon>["name"];
  iconClassName?: string;
}>) => {
  return (
    <li className="relative">
      <InlineStack align="center" blockAlign="center" gap="3">
        <Icon
          name={icon}
          size="xs"
          className={cn(
            "relative z-10 flex-shrink-0 bg-background rounded-full",
            iconClassName,
          )}
        />

        <BlockStack gap="1" className="flex-1 min-w-0">
          {children}
        </BlockStack>
      </InlineStack>
    </li>
  );
};

const ComponentHistoryTimeline = withSuspenseWrapper(
  ({
    history,
    currentComponent,
    currentUserName,
    onChange,
  }: {
    history: ComponentReferenceWithDigest[];
    currentComponent: HydratedComponentReference;
    currentUserName?: string;
    onChange?: () => void;
  }) => {
    const lastHydratedComponent = useHydrateComponentReference(
      history.length === 0 ? {} : history[history.length - 1],
    );

    const isPotentiallyOutdated = Boolean(
      history.length > 0 &&
        history.find((c) => c.digest === currentComponent.digest) !==
          history[history.length - 1],
    );

    const isPotentialNewRelease =
      lastHydratedComponent &&
      !history.find((c) => c.digest === currentComponent.digest) &&
      lastHydratedComponent.name === currentComponent.name &&
      !lastHydratedComponent.deprecated &&
      lastHydratedComponent.published_by === currentUserName;

    const isFirstPublish = history.length === 0;

    // todo: add a link to the component version
    return (
      <BlockStack gap="2">
        <Heading level={2}>Publish History</Heading>
        <BlockStack className="relative">
          {/* Timeline line - absolute positioned */}
          <div
            className={cn("absolute left-[5px] top-0 bottom-0 w-0.5 bg-border")}
            aria-hidden="true"
          />
          <BlockStack gap="2" as="ul" className="relative">
            {history.map((item, index, { length }) => {
              const isMostRecent = index === length - 1;
              const isMatchCurrentComponent =
                item.digest === currentComponent.digest;

              const icon = [
                isMostRecent && "CircleDot",
                isMatchCurrentComponent && "OctagonAlert",
                "Circle",
              ].find(Boolean) as ComponentProps<typeof Icon>["name"];

              return (
                <ComponentHistoryTimelineItem key={item.digest} icon={icon}>
                  <InlineStack gap="1" blockAlign="center">
                    <ComponentQuickDetailsDialogTrigger component={item} />
                    <Text size="xs">by {item.published_by}</Text>

                    {isMatchCurrentComponent && isPotentiallyOutdated ? (
                      <Text size="xs" tone="critical">
                        | You`re using an outdated version of this component.
                      </Text>
                    ) : null}
                  </InlineStack>
                  {/* <TrimmedDigest digest={item.digest}>
                    {(trimmedDigest) => (
                      <InlineStack gap="1" blockAlign="center">
                        <Link
                          href="#" // todo: add link to the component version
                          className="hover:underline underline decoration-dotted text-xs"
                        >
                          {trimmedDigest}
                        </Link>
                        <Text size="xs">by {item.published_by}</Text>

                        {isMatchCurrentComponent && isPotentiallyOutdated ? (
                          <Text size="xs" tone="critical">
                            | You`re using an outdated version of this
                            component.
                          </Text>
                        ) : null}
                      </InlineStack>
                    )}
                  </TrimmedDigest> */}
                  <ComponentsOnCanvas digest={item.digest}>
                    {(count) => (
                      <Text size="xs" tone="subdued">
                        Used in {count} canvas tasks.
                        {isMostRecent ? null : (
                          <Button variant="secondary" size="xs">
                            Update?
                          </Button>
                        )}
                      </Text>
                    )}
                  </ComponentsOnCanvas>
                </ComponentHistoryTimelineItem>
              );
            })}
            {isPotentialNewRelease || isFirstPublish ? (
              <ComponentHistoryTimelineItem
                icon="CircleFadingArrowUp"
                iconClassName="text-green-500"
              >
                <BlockStack gap="1">
                  <InlineStack gap="1" blockAlign="center">
                    <TrimmedDigest digest={currentComponent.digest}>
                      {(trimmedDigest) => (
                        <Text size="xs" weight="semibold">
                          {trimmedDigest}
                        </Text>
                      )}
                    </TrimmedDigest>
                    <Text size="xs" tone="subdued">
                      | you have a version of component that is not published
                      yet
                    </Text>
                  </InlineStack>
                  <InlineStack gap="1" blockAlign="center">
                    {isPotentialNewRelease ? (
                      <DeletePublishedComponentButton
                        predecessorComponent={lastHydratedComponent}
                        successorComponent={currentComponent}
                        onSuccess={onChange}
                      />
                    ) : null}
                    {isFirstPublish ? (
                      <PublishComponentButton
                        component={currentComponent}
                        onSuccess={onChange}
                      />
                    ) : null}
                  </InlineStack>
                </BlockStack>
              </ComponentHistoryTimelineItem>
            ) : null}

            {!isFirstPublish && !isPotentiallyOutdated ? (
              <ComponentHistoryTimelineItem
                icon="CircleDashed"
                iconClassName="text-gray-500"
              >
                <InlineStack gap="1" blockAlign="center">
                  <Button variant="secondary" size="xs">
                    Release new version?
                  </Button>
                  <Button variant="destructive" size="xs">
                    Deprecate
                  </Button>
                </InlineStack>
              </ComponentHistoryTimelineItem>
            ) : null}
          </BlockStack>
        </BlockStack>
      </BlockStack>
    );
  },
);

function hasSupersededBy(
  c: ComponentReference,
): c is ComponentReference & { superseded_by: string } {
  return Boolean(c.superseded_by);
}

function buildComponentHistory(
  componentVersions: ComponentReference[],
  component: HydratedComponentReference,
  userName: string,
) {
  const relatedComponents = componentVersions
    .filter((c) => c.name === component.name && c.published_by === userName)
    .filter((c) => isDiscoverableComponentReference(c));

  const index = new Map<string, ComponentReferenceWithDigest>(
    relatedComponents
      .filter((c) => hasSupersededBy(c))
      .map((c) => [c.superseded_by, c]),
  );

  /**
   * [
   *  {a, supersededBy: b}
   *  {b, supersededBy: c}
   *  {c, supersededBy: d}
   * ] => [d, c, b, a]
   */
  const lastList = relatedComponents.filter((c) => !c.superseded_by);

  if (lastList.length !== 1) {
    return [];
  }

  const timeline: ComponentReferenceWithDigest[] = [];

  let current: ComponentReferenceWithDigest | undefined = lastList[0];
  while (current) {
    timeline.unshift(current);
    const predecessor = index.get(current.digest);
    current = predecessor;
  }

  return timeline;
}

export const PublishComponent = withSuspenseWrapper(
  ({ component }: ComponentPublishProps) => {
    const { getComponentLibrary } = useComponentLibrary();
    const publishedComponentsLibrary = getComponentLibrary(
      "published_components",
    );

    const { data: currentUserDetails } = useSuspenseQuery({
      queryKey: ["user"],
      staleTime: 1000 * 60 * 60 * 0.5, // 30 minutes
      queryFn: () => getUserDetails(),
    });

    const { data: history, refetch: refetchHistory } = useSuspenseQuery({
      queryKey: ["component-library", "published", "history", component.name],
      queryFn: async () => {
        const components = await publishedComponentsLibrary.getComponents({
          searchTerm: component.name,
          filters: ["name", "deprecated"],
        });

        /**
         * Assuming that component name never changed
         */
        const history = buildComponentHistory(
          components.components ?? [],
          component,
          currentUserDetails.name,
        );

        return history;
      },
    });

    const onChange = useCallback(() => {
      refetchHistory();
    }, [refetchHistory]);

    return (
      <ScrollArea className="h-full">
        <BlockStack inlineAlign="space-between" className="h-full" gap="3">
          <Text as="p" size="xs" tone="subdued">
            Published Components are shared components that are available to all
            users in the workspace. By publishing, you make this component
            discoverable and reusable by others through the component library.
            Once published, the component will appear in the components search
            result for easy access and collaboration.
          </Text>

          <BlockStack gap="2" className="border rounded-md p-2 h-full">
            <Heading level={2}>Component Review</Heading>

            <BlockStack gap="1" className="border-l pl-2">
              <ComponentSpecProperty
                label="Author"
                value={component.spec.metadata?.annotations?.author}
              />
              <ComponentSpecProperty label="Name" value={component.name} />
              <ComponentSpecProperty
                label="Description"
                value={component.spec.description}
              />
              <ComponentSpecProperty label="Digest" value={component.digest} />
              <Separator />
              <ComponentSpecProperty
                label="Publish by"
                value={currentUserDetails.name}
                tooltip="Your current user name"
              />
            </BlockStack>

            <ComponentHistoryTimeline
              history={history}
              currentComponent={component}
              currentUserName={currentUserDetails.name}
              onChange={onChange}
            />
          </BlockStack>
        </BlockStack>
      </ScrollArea>
    );
  },
);
