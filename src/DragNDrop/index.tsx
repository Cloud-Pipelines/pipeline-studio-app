import { type DragEvent as ReactDragEvent } from 'react';
import {
  Controls,
  Background,
  useReactFlow,
  useEdgesState,
  useNodesState,
  addEdge,
  ReactFlow,
  type Connection,
} from '@xyflow/react';

import './dnd.css';

import SideBar from '../components/SideBar/SideBar';
import { useCallback, useRef, useEffect } from 'react';
import { useDnD } from '../contex/DNDContext';
import '@xyflow/react/dist/style.css';

import { useLoadPipeline } from '../hooks/useLoadPipeline';
import TaskNode from '../components/TaskNode/TaskNode';
import TaskEdge from '../components/TaskEdge/TaskEdge';
import { PipelineAutoSaver, savePipelineSpecToSessionStorage } from './PipelineAutoSaver';

const nodeTypes = {
  task: TaskNode,
};
const edgeTypes = {
  "task-edge": TaskEdge,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const DnDFlow = () => {
  const pipeline = useLoadPipeline();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(pipeline?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(pipeline?.edges || []);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

  useEffect(() => {
    savePipelineSpecToSessionStorage(pipeline, nodes);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = { ...connection, type: 'task-edge' };
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const onDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!event.dataTransfer) return;

      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type],
  );

  return (
    <div className="flex h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
      >
        <Controls />
        <Background />
      </ReactFlow>
      <SideBar />
    </div>
  );
};

export default DnDFlow;
