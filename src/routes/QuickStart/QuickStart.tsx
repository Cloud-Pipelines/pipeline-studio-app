import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { InfoBox } from "@/components/shared/InfoBox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Heading, Paragraph } from "@/components/ui/typography";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { EDITOR_PATH } from "@/routes/router";

import { importPipelineFromUrl } from "./importPipelineFromUrl";
import { type SamplePipeline, samplePipelines } from "./samplePipelines";

const QuickStart = () => {
  const navigate = useNavigate();
  const notify = useToastNotification();

  const {
    mutate: importPipeline,
    isPending,
    error,
  } = useMutation({
    mutationFn: async (url: string) => await importPipelineFromUrl(url),
    onSuccess: (result) => {
      notify(`Pipeline "${result.name}" created successfully`, "success");
      navigate({
        to: `${EDITOR_PATH}/${encodeURIComponent(result.name)}`,
      });
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <Heading level={1}>
          <InlineStack gap="2">
            <Icon name="Sparkles" size="lg" className="text-purple-600" />
            Quick Start with Sample Pipelines
          </InlineStack>
        </Heading>
        <Paragraph size="md" tone="subdued">
          Get started quickly with our pre-built pipeline templates. Each
          template demonstrates different ML workflow patterns and best
          practices. Simply click on any template to import it and start
          customizing.
        </Paragraph>
      </div>

      {!!error && (
        <InfoBox title="Error importing pipeline" variant="error">
          <Paragraph>{error.message}</Paragraph>
        </InfoBox>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {samplePipelines.map((pipeline: SamplePipeline) => (
          <Card
            key={pipeline.name}
            className={cn(
              "overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group",
              isPending && "opacity-50 pointer-events-none",
            )}
            onClick={() => importPipeline(pipeline.url)}
          >
            <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
              {pipeline.previewImage ? (
                <img
                  src={pipeline.previewImage}
                  alt={pipeline.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    // If image fails to load, hide it and show fallback gradient
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="Sparkles" size="lg" className="text-gray-400" />
                </div>
              )}
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner size={20} />
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">
                {pipeline.name}
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {pipeline.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pipeline.tags && pipeline.tags.length > 0 && (
                <InlineStack
                  gap="1"
                  wrap="wrap"
                  blockAlign="start"
                  align="start"
                >
                  {pipeline.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </InlineStack>
              )}
            </CardContent>
            <CardFooter></CardFooter>
          </Card>
        ))}
      </div>

      {samplePipelines.length === 0 && (
        <InfoBox title="No sample pipelines available yet." variant="info">
          <Paragraph>No sample pipelines available yet.</Paragraph>
        </InfoBox>
      )}
    </div>
  );
};

export default QuickStart;
