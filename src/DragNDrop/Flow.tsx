import { useCallback, type DragEvent, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';


interface FlowProps {
    nodes: Node[];
    edges: Edge[];
    children: React.ReactNode;
    nodeTypes: NodeTypes;
}

const Flow = ({nodes, edges, children, nodeTypes}: FlowProps) => {
  const [nodess, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgess, setEdges, onEdgesChange] = useEdgesState(edges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((els) => addEdge(params, els)),
    [],
  );

  const handleDelete = (nodesToDelete: Node[]) => {
    console.log('handleDelete', nodesToDelete)
  }

  const handleInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  };


  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const droppedData = event.dataTransfer.getData("application/reactflow");
      if (droppedData === "") {
        return;
      }

      const droppedDataObject = JSON.parse(droppedData);
      const nodeType = Object.keys(droppedDataObject)[0];
      const nodeData = droppedDataObject[nodeType];

      // Handle drag offset
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      const dragStartOffsetData = event.dataTransfer.getData("DragStart.offset");
      if (dragStartOffsetData !== "") {
        const dragStartOffset = JSON.parse(dragStartOffsetData);
        dragOffsetX = dragStartOffset.offsetX ?? 0;
        dragOffsetY = dragStartOffset.offsetY ?? 0;
      }

      // Calculate position with offset
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - dragOffsetX,
        y: event.clientY - dragOffsetY,
      });

      // Create node with proper data structure based on type
      const newNode = {
        id: `${nodeType}-${Math.random() * 10000}`,
        type: nodeType,
        position,
        data: nodeType === 'task' ? {
          taskSpec: nodeData,
          label: nodeData.componentRef?.spec?.name || 'Task'
        } : {
          label: nodeData.name || `${nodeType} node`
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  return (
    <ReactFlowProvider>
        <ReactFlow
            snapGrid={[10, 10]}
            nodeTypes={nodeTypes}
            snapToGrid
            nodes={nodess}
            edges={edgess}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodesDelete={handleDelete}
            deleteKeyCode={"Delete"}
            fitView
            onInit={handleInit}
          >
            {children}
          </ReactFlow>
      </ReactFlowProvider>
  );
};

export default Flow;
