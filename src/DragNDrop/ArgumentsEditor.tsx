/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import type {
  ArgumentType,
  ComponentSpec,
  TypeSpecType,
} from "../componentSpec";

interface ArgumentsEditorProps {
  componentSpec: ComponentSpec;
  componentArguments: Record<string, ArgumentType>;
  setComponentArguments: (args: Record<string, ArgumentType>) => void;
  shrinkToWidth?: boolean;
}

const getPatternForTypeSpec = (_typeSpec?: TypeSpecType) => {
  // TODO: Implement
  return undefined;
};

const typeSpecToString = (typeSpec?: TypeSpecType): string => {
  if (typeSpec === undefined) {
    return "Any";
  }
  if (typeof typeSpec === "string") {
    return typeSpec;
  }
  return JSON.stringify(typeSpec);
};

const ArgumentsEditor = ({
  componentSpec,
  componentArguments,
  setComponentArguments,
  shrinkToWidth = false,
}: ArgumentsEditorProps) => {
  return (
    <div
      className="highlight-invalid-inputs"
      style={{
        display: "table",
        borderSpacing: "5px",
        // Enables shrinking the table. But also makes all columns same width regardless of the content
        tableLayout: shrinkToWidth ? "fixed" : "auto",
        // Width is needed for table-layout: "fixed" to work
        width: "100%",
      }}
    >
      {(componentSpec.inputs ?? []).map((inputSpec) => {
        const inputName = inputSpec.name;
        let value: string | undefined = undefined;
        let placeholder: string | undefined = undefined;
        const argument = componentArguments[inputName];
        if (argument === undefined) {
          value = inputSpec.default;
        } else {
          if (typeof argument === "string") {
            value = argument;
          } else if ("taskOutput" in argument) {
            placeholder = `<from task ${argument.taskOutput.taskId} / ${argument.taskOutput.outputName}>`;
          } else if ("graphInput" in argument) {
            placeholder = `<from graph input ${argument.graphInput.inputName}>`;
          } else {
            placeholder = "<reference>";
          }
        }

        const argumentIsRequiredButMissing =
          !(inputName in componentArguments) &&
          inputSpec.optional !== true &&
          inputSpec.default === undefined;

        const typeSpecString =
          typeSpecToString(inputSpec.type) +
          (inputSpec.optional === true ? "?" : "");

        const inputTitle = `${inputName} (${typeSpecString})\n${
          inputSpec.description || ""
        }`;

        return (
          <div
            key={inputName}
            style={{
              display: "table-row",
            }}
          >
            <label
              title={inputTitle}
              style={{
                textAlign: "right",
                display: "table-cell",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span>
                {inputName} (
                <span
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    maxWidth: "90px",
                    display: "inline-block",
                    verticalAlign: "bottom",
                  }}
                  title={typeSpecString}
                >
                  {typeSpecString}
                </span>
                )
              </span>
            </label>
            <input
              style={{
                display: "table-cell",
                // Prevents border flickering and disappearing on movement
                borderWidth: "1px",
                // Overriding both min-width and max-width to enable the input element shrinking
                minWidth: "50px",
                maxWidth: "100%",
              }}
              placeholder={placeholder}
              required={argumentIsRequiredButMissing}
              value={value ?? ""}
              pattern={getPatternForTypeSpec(inputSpec.type)}
              onChange={(e) => {
                componentArguments[inputName] = e.target.value;
                setComponentArguments({ ...componentArguments });
              }}
            />
            <div
              style={{
                display: "table-cell",
                // Setting explicit width to make the button column smaller. Otherwise it takes 1/3 of the total width when the table-layout is set to fixed.
                // The width should have been set to "min-content", but that does not work for some reason
                width: "30px",
              }}
            >
              <button
                type="button"
                title="Reset to default"
                onClick={() => {
                  delete componentArguments[inputName];
                  setComponentArguments({ ...componentArguments });
                }}
                disabled={!(inputName in componentArguments)}
              >
                ⌧
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ArgumentsEditor;
