import type { ArgumentInput } from "@/types/arguments";
import type { TaskSpec } from "@/utils/componentSpec";

export const getArgumentInputs = (taskSpec: TaskSpec) => {
  const componentSpec = taskSpec.componentRef.spec;

  const argumentInputs =
    componentSpec?.inputs?.map((input) => {
      const existingArgument = taskSpec.arguments?.[input.name];
      const initialValue = existingArgument ?? input.default;

      /*
        * Some notes on the logic of the ArgumentInput:
        * [key] - This is used internally by React to keep track of the Input Component. Must be unique.
        * [value] - This is the value of the argument. It cannot be undefined due to React's rules around controlled components.
        * [initialValue] - This is the initial value of the argument when the Editor is opened. Immutable. It is used to determine if the argument has been changed during the current editing session.
        * [inputSpec] - These are some general constants for the argument. Immutable. It is used to display the argument name and type in the UI.
        * [isRemoved] - This is used to remove unwanted arguments from the Task Spec, as specified by the user. This is essentially used in place of an "undefined" input, since React requires an empty string for controlled components.

        * Note that "undefined" and "empty string" are treated differently in the task spec, but we can only use "empty string" in the UI due to React's rules around controlled components.
        * The difference is best seen in a required argument with a linked node:
        *   - The connection will disappear and the connection point turn red when the node is removed, since it is required. This is what the "Remove" button is for.
        *   - An empty string is a valid input and will result in the connection being severed, but the connection point will not turn red. This is what the "Reset to Default" button is for.
        *   - A severed connection cannot be reconnected in the argument editor once applied and must be redrawn on the graph.
      */

      return {
        key: input.name,
        value: initialValue ?? "",
        initialValue: initialValue ?? "",
        inputSpec: input,
        isRemoved: !existingArgument,
      } as ArgumentInput;
    }) ?? [];

  return argumentInputs;
};
