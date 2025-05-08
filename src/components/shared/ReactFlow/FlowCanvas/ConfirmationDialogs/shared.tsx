import type { ArgumentType } from "@/utils/componentSpec";

export const thisCannotBeUndone = (
  <p className="text-muted-foreground">This cannot be undone.</p>
);

export function getArgumentDetails(
  taskArguments: { [k: string]: ArgumentType } | undefined,
  inputName: string,
) {
  const notSet = "No value";

  if (!taskArguments) {
    return { value: notSet, isBrokenConnection: false };
  }

  const argument = taskArguments[inputName];

  if (!argument) {
    return { value: notSet, isBrokenConnection: false };
  }

  if (typeof argument === "object" && argument !== null) {
    if ("taskOutput" in argument && argument.taskOutput) {
      return {
        value: `from "${argument.taskOutput.taskId}"`,
        isBrokenConnection: true,
      };
    }
    if ("graphInput" in argument && argument.graphInput) {
      return {
        value: `"${argument.graphInput.inputName}"`,
        isBrokenConnection: true,
      };
    }
  }

  if (typeof argument === "string") {
    if (argument === "") {
      return { value: notSet, isBrokenConnection: false };
    }
    return { value: `"${argument}"`, isBrokenConnection: false };
  }

  return { value: notSet, isBrokenConnection: false };
}
