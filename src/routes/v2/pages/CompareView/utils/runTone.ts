/**
 * "Run A is blue, run B is emerald" — the single place that decides it. Every
 * surface that carries a run's identity (tags, switcher chips, the graph
 * spotlight panel) reads from here, so the two runs cannot drift apart a shade
 * at a time as more surfaces are added.
 */
export const RUN_TONE: Record<"a" | "b", string> = {
  a: "border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  b: "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

/**
 * @public consumed by the run switcher, which lands later in this stack.
 *
 * The unfilled counterpart of {@link RUN_TONE}, for controls that only take on
 * their run's colour on hover.
 */
export const RUN_OUTLINE_TONE: Record<"a" | "b", string> = {
  a: "border-blue-400 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950",
  b: "border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950",
};
