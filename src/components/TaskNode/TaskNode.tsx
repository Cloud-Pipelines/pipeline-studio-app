import { Handle, Position } from '@xyflow/react';
import type { InputSpec, OutputSpec } from '../../componentSpec';


interface TaskNodeData {
  taskSpec: {
    componentRef: {
      spec: {
        inputs: InputSpec[];
        outputs: OutputSpec[];
        name: string;
      };
    };
  };
}
interface TaskNodeProps {
  data: TaskNodeData;
  isConnectable: boolean;
}
function TaskNode({ data, isConnectable }: TaskNodeProps) {

  const inputHandles = data.taskSpec.componentRef.spec.inputs.map((input: InputSpec) => {
    return (
      <div key={input.name} className="flex w-full justify-start bg-gray-50 odd:bg-gray-200">
        <div className="relative translate-x-[-11px]">
          <Handle
            type="target"
            position={Position.Right}
            isConnectable={isConnectable}
            id={input.name}
          />
        </div>
        <span className="text-xs text-left">{input.name.replace(/_/g, ' ')}</span>

      </div>
    )
  });


  const outputHandles = data.taskSpec.componentRef.spec.outputs.map((output: OutputSpec) => {
    return (
      <div key={output.name} className="flex w-full justify-end bg-gray-50 odd:bg-gray-200">
        <span className="text-xs text-left">{output.name.replace(/_/g, ' ')} - outbut</span>
        <div className="relative translate-x-[11px]">
          <Handle
            type="source"
            position={Position.Left}
            isConnectable={isConnectable}
            id={output.name}
          />
        </div>
      </div>
    )
  });

  return (
    <div  className="flex flex-col gap-1">
      <div className="text-xs">{data?.taskSpec?.componentRef?.spec?.name || "Task"}</div>

      {inputHandles}
      {outputHandles}
    </div>

  );
}

export default TaskNode;
