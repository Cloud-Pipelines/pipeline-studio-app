/**
 * Membership of an entity in a before/after pair, shared by the editor's
 * component upgrade preview and the run comparison view.
 */
export type DiffStatus = "unchanged" | "lost" | "new" | "changed";
