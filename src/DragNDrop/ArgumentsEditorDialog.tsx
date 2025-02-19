/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useState } from "react";
import type { ArgumentType, TaskSpec } from "../componentSpec";
import ArgumentsEditor from "./ArgumentsEditor";

interface ArgumentsEditorDialogProps {
  taskSpec: TaskSpec;
  closeEditor?: () => void;
  setArguments?: (args: Record<string, ArgumentType>) => void;
}

const ArgumentsEditorDialog = ({
  taskSpec,
  closeEditor,
  setArguments,
}: ArgumentsEditorDialogProps) => {
  const [currentArguments, setCurrentArguments] = useState<
    Record<string, ArgumentType>
  >({ ...taskSpec.arguments });

  const componentSpec = taskSpec.componentRef.spec;
  if (componentSpec === undefined) {
    console.error(
      "ArgumentsEditor called with missing taskSpec.componentRef.spec",
      taskSpec
    );
    return <></>;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
      }}
      // Does not work
      // draggable={false}
      style={{
        position: "fixed",
        background: "white",
        border: "1px solid black",
        borderRadius: "4px",
        padding: "15px",
        // Does not work
        // zIndex: 11,
      }}
    >
      <legend>Input arguments for {componentSpec.name}</legend>
      <ArgumentsEditor
        componentSpec={componentSpec}
        componentArguments={currentArguments}
        setComponentArguments={setCurrentArguments}
      />
      <button type="button" onClick={closeEditor}>
        Close
      </button>
      <button
        type="button"
        onClick={(e) => {
          setArguments?.(currentArguments);
          closeEditor?.();
        }}
      >
        Apply
      </button>
    </form>
  );
};

export default ArgumentsEditorDialog;
