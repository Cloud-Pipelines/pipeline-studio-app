import { InfoBox } from "../../InfoBox";

interface ManualSubmissionInstructionsProps {
  downloadUrl: string;
}

const VERTEX_PIPELINES_URL =
  "https://console.cloud.google.com/vertex-ai/pipelines";
const CREATE_RUN_DOCS_URL =
  "https://cloud.google.com/vertex-ai/docs/pipelines/run-pipeline#console";

export const ManualSubmissionInstructions = ({
  downloadUrl,
}: ManualSubmissionInstructionsProps) => {
  return (
    <InfoBox title="Manual Submission" className="text-xs text-gray-700">
      Download{" "}
      <a
        href={downloadUrl}
        download="vertex_pipeline_job.json"
        className="text-blue-600 hover:underline"
      >
        pipeline_job.json
      </a>
      , then go to{" "}
      <a
        href={VERTEX_PIPELINES_URL}
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        Vertex Pipelines
      </a>{" "}
      and{" "}
      <a
        href={CREATE_RUN_DOCS_URL}
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        create a new run
      </a>
      .
    </InfoBox>
  );
};
