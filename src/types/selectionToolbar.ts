export interface SelectionToolbarProps extends Record<string, unknown> {
  hidden: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}
