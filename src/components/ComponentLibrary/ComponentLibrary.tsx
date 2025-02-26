import yaml from 'js-yaml';
import { useDnD } from '../../contex/DNDContext';
import { useQuery } from '@tanstack/react-query';

// Define types for our component library structure
type Component = {
  url: string;
};

type Folder = {
  name: string;
  components?: Component[];
  folders?: Folder[];
};

type ComponentLibraryData = {
  annotations: Record<string, unknown>;
  folders: Folder[];
};

const ComponentLibrary = () => {
  const [_, setType] = useDnD();
  const { data: libraryData, isLoading, error } = useQuery({
    queryKey: ['componentLibrary'],
    queryFn: async () => {
      const response = await fetch('/component_library.yaml');
      const yamlText = await response.text();
      return yaml.load(yamlText) as ComponentLibraryData;
    }
  });

  const renderComponent = (component: Component, index: number, folderName: string) => {
    const nodeType = `${folderName}-${index}`;

    const onDragStart = async (event: React.DragEvent) => {
      if (setType) {
        // Fetch the YAML content for this component
        const response = await fetch(component.url);
        const yamlText = await response.text();
        const componentSpec = yaml.load(yamlText);

        // Set the type with the full component specification
        setType({
          taskSpec: {
            componentRef: {
              url: component.url,
              spec: componentSpec
            }
          }
        });
      }
      event.dataTransfer.effectAllowed = 'move';
    };

    return (
      <div
        key={index}
        className="dndnode rounded-lg border-2 border-blue-400 bg-blue-50 p-3 cursor-move hover:shadow-md hover:bg-blue-100 transition-all mb-2"
        onDragStart={onDragStart}
        draggable
      >
        <div className="text-blue-700 font-medium">
          {component.url.split('/').slice(-2)[0]}
        </div>
        <div className="text-xs text-blue-500 mt-1">{folderName}</div>
      </div>
    );
  };

  const renderFolder = (folder: Folder, index: number) => (
    <div key={index} className="mb-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">{folder.name}</h2>
      <div className="space-y-2">
        {folder.components?.map((component, compIndex) =>
          renderComponent(component, compIndex, folder.name)
        )}
        {folder.folders?.map((subFolder, subIndex) => (
          <div key={subIndex} className="ml-4 mb-4">
            <h3 className="text-md font-medium text-gray-600 mb-2">{subFolder.name}</h3>
            {subFolder.components?.map((component, compIndex) =>
              renderComponent(component, compIndex, `${folder.name}/${subFolder.name}`)
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="p-4">Loading component library...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading component library</div>;
  }

  if (!libraryData) {
    return <div className="p-4">No data available</div>;
  }

  return (
    <div className="p-4 overflow-y-auto max-h-screen">
      {libraryData.folders.map((folder, index) => renderFolder(folder, index))}
    </div>
  );
};

export default ComponentLibrary;
