import yaml from "js-yaml";

import CondensedUrl from "@/components/shared/CondensedUrl";
import type { TaskSpec } from "@/utils/componentSpec";

interface InfoProps {
  taskSpec: TaskSpec;
  taskId: string;
  runStatus?: string;
}

const Info = ({ taskSpec, runStatus, taskId }: InfoProps) => {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">Basic Info</h4>
        <div className="border rounded-md divide-y">
          <div className="flex items-center px-3 py-1.5">
            <div className="w-36 text-sm text-gray-500">Name</div>
            <div className="text-sm">{taskSpec.componentRef.spec?.name}</div>
          </div>
          <div className="flex items-center px-3 py-1.5">
            <div className="w-36 text-sm text-gray-500">Status</div>
            <div className="text-sm">{runStatus || "Not started"}</div>
          </div>
          <div className="flex items-center px-3 py-1.5">
            <div className="w-36 text-sm text-gray-500">Task ID</div>
            <div className="text-sm">{taskId}</div>
          </div>
          {taskSpec.componentRef.url && (
            <div className="flex items-center px-3 py-1.5">
              <div className="w-36 text-sm text-gray-500">URL</div>
              <CondensedUrl
                url={taskSpec.componentRef.url}
                className="text-sm"
              />
            </div>
          )}
          {taskSpec.componentRef.digest && (
            <div className="flex items-center px-3 py-1.5">
              <div className="w-36 text-sm text-gray-500">Digest</div>
              <div className="text-sm font-mono break-all">
                {taskSpec.componentRef.digest}
              </div>
            </div>
          )}
        </div>
      </section>

      {taskSpec.componentRef.spec?.description && (
        <section>
          <h4 className="text-sm font-medium mb-2">Description</h4>
          <div className="border rounded-md">
            <div className="text-sm p-3">
              {taskSpec.componentRef.spec.description}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Task Specification</h4>
        </div>
        <div className="border rounded-md">
          <pre className="text-xs p-3 overflow-x-auto">
            {yaml.dump(taskSpec, {
              lineWidth: 10000,
              quotingType: '"',
            })}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default Info;
