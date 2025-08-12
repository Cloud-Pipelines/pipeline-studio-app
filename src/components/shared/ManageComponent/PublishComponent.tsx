import { useMutation } from "@tanstack/react-query";

import { publishApiPublishedComponentsPost } from "@/api/sdk.gen";
import type { ComponentReferenceInput } from "@/api/types.gen";
import { Button } from "@/components/ui/button";
import { BlockStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/typography";
import useToastNotification from "@/hooks/useToastNotification";
import type { ComponentReferenceWithSpec } from "@/utils/componentStore";

import { InfoBox } from "../InfoBox";
import { TaskDetails } from "../TaskDetails";

interface ComponentPublishProps {
  component: ComponentReferenceWithSpec;
  displayName: string;
}

function getComponentReferenceInput(component: ComponentReferenceWithSpec) {
  return {
    name: component.name,
    digest: component.digest,
    url: component.url,
    spec: component.spec,
    text: component.text,
  } as ComponentReferenceInput;
}

export function PublishComponent({
  component,
  displayName,
}: ComponentPublishProps) {
  const notify = useToastNotification();
  const { url, spec: componentSpec, digest: componentDigest } = component;

  const {
    mutate: publishComponent,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async (component: ComponentReferenceWithSpec) => {
      await publishApiPublishedComponentsPost({
        body: getComponentReferenceInput(component),
      }).catch((error) => {
        console.error(error);
        throw error;
      });
    },
    onSuccess: () => {
      notify("Component published successfully", "success");
    },
    onError: (error) => {
      notify(`Failed to publish component: ${error.message}`, "error");
    },
  });

  return (
    <BlockStack inlineAlign="space-between" className="h-full">
      <TaskDetails
        displayName={displayName}
        componentSpec={componentSpec}
        componentDigest={componentDigest}
        url={url}
        readOnly={true}
      />

      <BlockStack gap="2">
        <Text as="p">Publish this component to the component library.</Text>
        <Button
          disabled={isPending}
          onClick={() => publishComponent(component)}
        >
          Publish {isPending ? <Spinner /> : null}
        </Button>
        {isError && (
          <InfoBox title="Error" variant="error">
            {error.message}
          </InfoBox>
        )}
      </BlockStack>
    </BlockStack>
  );
}
