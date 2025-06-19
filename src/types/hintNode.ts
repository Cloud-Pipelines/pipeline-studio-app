export interface HintNodeData extends Record<string, unknown> {
  key: string;
  hint: string;
  side: "left" | "right";
}
