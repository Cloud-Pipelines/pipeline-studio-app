/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useEffect, useState } from "react";
import type { ArgumentType, ComponentSpec } from "../componentSpec";
import ArgumentsEditor from "./ArgumentsEditor";
import GoogleCloudSubmitter from "./GoogleCloud";
import KubeflowPipelinesSubmitter from "./KubeflowPipelinesSubmitter";

interface PipelineSubmitterProps {
  componentSpec?: ComponentSpec;
  googleCloudOAuthClientId: string;
}

const PipelineSubmitter = ({
  componentSpec,
  googleCloudOAuthClientId,
}: PipelineSubmitterProps) => {
  const [pipelineArguments, setPipelineArguments] = useState<
    Record<string, ArgumentType>
  >({});

  const [stringPipelineArguments, setStringPipelineArguments] = useState<
    Map<string, string>
  >(new Map());

  useEffect(() => {
    // This filtering is just for typing as the pipeline arguments can only be strings here.
    const newStringPipelineArguments = new Map(
      Object.entries(pipelineArguments).filter(
        // Type guard predicate
        (pair): pair is [string, string] => typeof pair[1] === "string",
      ),
    );
    setStringPipelineArguments(newStringPipelineArguments);
  }, [pipelineArguments]);

  return (
    <>
      {componentSpec === undefined || // This check is redundant, but TypeScript needs it.
      (componentSpec?.inputs?.length ?? 0) === 0 ? undefined : (
        <fieldset
          style={{
            // Reduce the default padding
            padding: "2px",
            marginBottom: "4px",
          }}
        >
          <legend>Arguments</legend>
          <ArgumentsEditor
            componentSpec={componentSpec}
            componentArguments={pipelineArguments}
            setComponentArguments={setPipelineArguments}
            shrinkToWidth={true}
          />
        </fieldset>
      )}
      <details
        style={{
          border: "1px solid #aaa",
          borderRadius: "4px",
          padding: "4px",
        }}
      >
        <summary
          style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}
        >
          Submit to Google Cloud
        </summary>
        <GoogleCloudSubmitter
          componentSpec={componentSpec}
          pipelineArguments={stringPipelineArguments}
          googleCloudOAuthClientId={googleCloudOAuthClientId}
        />
      </details>
      <details
        style={{
          border: "1px solid #aaa",
          borderRadius: "4px",
          padding: "4px",
        }}
      >
        <summary
          style={{ borderWidth: "1px", padding: "4px", fontWeight: "bold" }}
        >
          Submit to Kubeflow Pipelines
        </summary>
        <KubeflowPipelinesSubmitter
          componentSpec={componentSpec}
          pipelineArguments={stringPipelineArguments}
          googleCloudOAuthClientId={googleCloudOAuthClientId}
        />
      </details>
    </>
  );
};

export default PipelineSubmitter;
