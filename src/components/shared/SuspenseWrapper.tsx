import { QueryErrorResetBoundary } from "@tanstack/react-query";
import {
  type ComponentProps,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
  Suspense,
} from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { InfoBox } from "./InfoBox";

interface SuspenseWrapperProps {
  fallback?: ReactNode;
  errorFallback?: (props: FallbackProps) => ReactNode;
}

const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
  return (
    <InfoBox title="There was an error!" variant="error">
      <Button onClick={() => resetErrorBoundary()} variant={"ghost"} size="xs">
        Try again
      </Button>
    </InfoBox>
  );
};

export const SuspenseWrapper = ({
  children,
  fallback,
  errorFallback = ErrorFallback,
}: PropsWithChildren<SuspenseWrapperProps>) => {
  const fallbackMarkup = fallback ?? <Spinner />;

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallbackRender={errorFallback}>
          <Suspense fallback={fallbackMarkup}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
SuspenseWrapper.displayName = "SuspenseWrapper";

/**
 * Wraps a component in a SuspenseWrapper.
 *
 * @param Component - The component to wrap.
 * @param Skeleton - The skeleton to show while the component is loading. Must be a component with no required props.
 * @returns The wrapped component.
 */
export function withSuspenseWrapper<T extends ComponentType<any>>(
  Component: T,
  Skeleton?: ComponentType<Partial<ComponentProps<T>>>,
  errorFallback?: (props: FallbackProps) => ReactNode,
) {
  const ComponentWithSuspense = (props: ComponentProps<T>) => (
    <SuspenseWrapper
      fallback={Skeleton ? <Skeleton {...props} /> : undefined}
      errorFallback={errorFallback ?? ErrorFallback}
    >
      <Component {...props} />
    </SuspenseWrapper>
  );
  ComponentWithSuspense.displayName = `SuspenseWrapper(${Component.displayName ?? Component.name ?? "Component"})`;
  return ComponentWithSuspense;
}
