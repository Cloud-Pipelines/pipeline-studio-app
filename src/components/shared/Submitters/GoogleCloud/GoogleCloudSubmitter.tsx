import { type ChangeEvent, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleCloudSubmitter } from "@/hooks/useGoogleCloudSubmitter";
import type { ComponentSpec } from "@/utils/componentSpec";

import { ManualSubmissionInstructions } from "./ManualSubmissionInstructions";
import { ProjectInput } from "./ProjectInput";
import { RegionInput } from "./RegionInput";

interface GoogleCloudSubmitterProps {
  componentSpec?: ComponentSpec;
}

const GoogleCloudSubmitter = ({ componentSpec }: GoogleCloudSubmitterProps) => {
  const {
    project,
    cloudProjects,
    jsonBlobUrl,
    jobWebUrl,
    isValid,
    updateProject,
    submit,
    refreshProjectList,
  } = useGoogleCloudSubmitter({
    componentSpec,
  });

  const handleOAuthClientIdChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateProject({ googleCloudOAuthClientId: e.target.value });
    },
    [],
  );

  const handleDirectoryInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateProject({ gcsOutputDirectory: e.target.value });
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">OAuth Client Id</p>
        <Input
          type="text"
          value={project.googleCloudOAuthClientId}
          onChange={handleOAuthClientIdChange}
          autoFocus={!project.googleCloudOAuthClientId}
        />
      </div>
      <ProjectInput
        project={project}
        projectList={cloudProjects}
        onChange={updateProject}
        refreshProjectList={refreshProjectList}
      />
      <RegionInput project={project} onChange={updateProject} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">Output Directory</p>
        <Input
          type="text"
          value={project.gcsOutputDirectory}
          onChange={handleDirectoryInputChange}
          disabled={!project.googleCloudOAuthClientId}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Button onClick={submit} disabled={!isValid}>
          Submit pipeline job
        </Button>
        {jobWebUrl && (
          <a
            href={jobWebUrl}
            target="_blank"
            rel="noreferrer"
            style={{ margin: "5px" }}
          >
            Job
          </a>
        )}
      </div>
      {jsonBlobUrl && (
        <ManualSubmissionInstructions downloadUrl={jsonBlobUrl} />
      )}
    </div>
  );
};

export default GoogleCloudSubmitter;
