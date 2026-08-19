import { Outlet } from "@tanstack/react-router";
import type { FallbackProps } from "react-error-boundary";

import { InfoBox } from "@/components/shared/InfoBox";
import { SuspenseWrapper } from "@/components/shared/SuspenseWrapper";
import { Button } from "@/components/ui/button";
import { BlockStack } from "@/components/ui/layout";
import { Spinner } from "@/components/ui/spinner";
import { Paragraph } from "@/components/ui/typography";

function SecretsSettingsSkeleton() {
  return (
    <BlockStack align="center" className="py-8">
      <Spinner size={10} />
    </BlockStack>
  );
}

function SecretsSettingsErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <BlockStack gap="4" className="py-8">
      <InfoBox title="Secrets could not be loaded" variant="error">
        <Paragraph size="sm">{errorMessage}</Paragraph>
      </InfoBox>
      <Button
        onClick={resetErrorBoundary}
        variant="secondary"
        className="w-fit"
      >
        Try Again
      </Button>
    </BlockStack>
  );
}

export function SecretsSettings() {
  return (
    <SuspenseWrapper
      fallback={<SecretsSettingsSkeleton />}
      errorFallback={SecretsSettingsErrorFallback}
    >
      <Outlet />
    </SuspenseWrapper>
  );
}
