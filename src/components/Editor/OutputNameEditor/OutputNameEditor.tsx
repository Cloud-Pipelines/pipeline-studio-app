import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";
import { type OutputSpec, renameOutput } from "@/utils/componentSpec";

import { NameField, TypeField } from "../InputValueEditor/FormFields";

interface OutputNameEditorProps {
  output: OutputSpec;
  onNameChange?: (oldName: string, newName: string) => void;
  onTypeChange?: (name: string, newType: string) => void;
  onSave?: () => void;
}

export const OutputNameEditor = ({ output, onSave }: OutputNameEditorProps) => {
  const { setComponentSpec, componentSpec } = useComponentSpec();
  const [outputType, setOutputType] = useState(output.type);
  const [outputName, setOutputName] = useState(output.name);

  const handleOutputNameChange = useCallback(
    (oldName: string, newName: string, newType: string) => {
      if (!componentSpec.outputs) return null;

      const updatedComponentSpec = renameOutput(
        componentSpec,
        oldName,
        newName,
        newType,
      );

      return updatedComponentSpec;
    },
    [componentSpec, setComponentSpec],
  );

  const handleNameChange = (value: string) => {
    setOutputName(value);
  };

  const handleTypeChange = (value: string) => {
    setOutputType(value);
  };

  const handleSave = () => {
    const updatedComponentSpecWithValues = handleOutputNameChange(
      output.name,
      outputName,
      outputType as string,
    );

    if (updatedComponentSpecWithValues) {
      setComponentSpec(updatedComponentSpecWithValues);
    }
    onSave?.();
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold">{output.name}</h3>
        {output.description && (
          <p className="text-sm text-gray-500">{output.description}</p>
        )}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <NameField inputName={outputName} onNameChange={handleNameChange} />
        </div>
        <div className="w-36">
          <TypeField
            inputValue={outputType?.toString() || "Any"}
            onInputChange={handleTypeChange}
            placeholder="Type: Any"
            disabled={false}
            inputName={output.name}
          />
        </div>
      </div>
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
