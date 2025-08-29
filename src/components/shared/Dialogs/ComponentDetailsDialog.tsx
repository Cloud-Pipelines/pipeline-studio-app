import { Code, InfoIcon, ListFilter } from "lucide-react";
import { type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydrateComponentReference } from "@/hooks/useHydrateComponentReference";
import type { ComponentReference } from "@/utils/componentSpec";

import InfoIconButton from "../Buttons/InfoIconButton";
import { InfoBox } from "../InfoBox";
import { withSuspenseWrapper } from "../SuspenseWrapper";
import { TaskDetails, TaskImplementation, TaskIO } from "../TaskDetails";

interface ComponentDetailsProps {
  component: ComponentReference;
  displayName: string;
  trigger?: ReactNode;
  actions?: ReactNode[];
  onClose?: () => void;
  onDelete?: () => void;
}

const ComponentDetailsSkeleton = () => {
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

const ComponentDetailsDialog = withSuspenseWrapper(
  ({
    component,
    displayName,
    actions = [],
    onDelete,
  }: ComponentDetailsProps) => {
    const componentRef = useHydrateComponentReference(component);

    if (!componentRef) {
      return (
        <InfoBox title="Component not found" variant="error">
          Failed to load component.
        </InfoBox>
      );
    }

    const { url, spec: componentSpec, digest: componentDigest } = componentRef;

    return (
      <>
        {!componentSpec && (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">
              Component specification not found.
            </span>
          </div>
        )}

        {componentSpec && (
          <Tabs
            defaultValue="details"
            className="mt-4 flex flex-col"
            data-testid="component-details-tabs"
          >
            <TabsList className="w-full mb-4">
              <TabsTrigger value="details" className="flex-1">
                <InfoIcon className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="io" className="flex-1">
                <ListFilter className="h-4 w-4" />
                Inputs/Outputs
              </TabsTrigger>
              <TabsTrigger value="implementation" className="flex-1">
                <Code className="h-4 w-4" />
                Implementation
              </TabsTrigger>
            </TabsList>

            <div className="overflow-hidden h-[40vh]">
              <TabsContent value="details" className="h-full">
                <TaskDetails
                  displayName={displayName}
                  componentSpec={componentSpec}
                  componentDigest={componentDigest}
                  url={url}
                  actions={actions}
                  onDelete={onDelete}
                />
              </TabsContent>

              <TabsContent value="io" className="h-full">
                <TaskIO componentSpec={componentSpec} />
              </TabsContent>

              <TabsContent value="implementation" className="h-full">
                <TaskImplementation
                  displayName={displayName}
                  componentSpec={componentSpec}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </>
    );
  },
  ComponentDetailsSkeleton,
);

const ComponentDetails = ({
  component,
  displayName,
  trigger,
  actions = [],
  onClose,
  onDelete,
}: ComponentDetailsProps) => {
  const dialogTriggerButton = trigger || <InfoIconButton />;

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog modal onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{dialogTriggerButton}</DialogTrigger>

      <DialogDescription
        className="hidden"
        aria-label={`${displayName} component details`}
      >
        {`${displayName} component details`}
      </DialogDescription>
      <DialogContent
        className="max-w-2xl min-w-2xl overflow-hidden"
        aria-label={`${displayName} component details`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 mr-5">
            <span>{displayName}</span>
          </DialogTitle>
        </DialogHeader>

        <ComponentDetailsDialog
          component={component}
          displayName={displayName}
          trigger={dialogTriggerButton}
          actions={actions}
          onClose={onClose}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ComponentDetails;
