import yaml from 'js-yaml';
import { useReactFlow } from '@xyflow/react';
import { convertFlowToPipeline } from '../utils/pipelineExporter';

export const ExportButton = () => {
  const { getNodes, getEdges } = useReactFlow();

  const handleExport = () => {
    const nodes = getNodes();
    const edges = getEdges();
    const pipeline = convertFlowToPipeline(nodes, edges);
    const yamlStr = yaml.dump(pipeline);

    // Create and trigger download
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pipeline.yaml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleExport}>
      Export Pipeline
    </button>
  );
};
