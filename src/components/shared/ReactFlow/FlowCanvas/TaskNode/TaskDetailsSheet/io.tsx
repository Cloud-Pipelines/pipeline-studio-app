import type { TaskSpec } from "@/utils/componentSpec";

interface IoProps {
  taskSpec: TaskSpec;
}

const Io = ({ taskSpec }: IoProps) => {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium mb-2">Inputs</h4>
        <div className="border rounded-md divide-y">
          {taskSpec.componentRef.spec?.inputs?.map((input) => (
            <div key={input.name} className="px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{input.name}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {input.type?.toString()}
                  </span>
                </div>
              </div>
              {input.description && (
                <div className="text-xs text-gray-500 mb-1">
                  {input.description}
                </div>
              )}
              <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                {JSON.stringify(taskSpec.arguments?.[input.name]) ||
                  "No value set"}
              </div>
            </div>
          ))}
          {!taskSpec.componentRef.spec?.inputs?.length && (
            <div className="p-2 text-sm text-gray-500">No inputs defined</div>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-medium mb-2">Outputs</h4>
        <div className="border rounded-md divide-y">
          {taskSpec.componentRef.spec?.outputs?.map((output) => (
            <div key={output.name} className="px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{output.name}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {output.type?.toString()}
                  </span>
                </div>
              </div>
              {output.description && (
                <div className="text-xs text-gray-500">
                  {output.description}
                </div>
              )}
            </div>
          ))}
          {!taskSpec.componentRef.spec?.outputs?.length && (
            <div className="p-2 text-sm text-gray-500">No outputs defined</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Io;
