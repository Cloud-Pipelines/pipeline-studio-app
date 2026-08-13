import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * A run of 2+ consecutive collapsed messages, shown as a single "<n> messages
 * hidden" affordance that expands the entire run on click.
 */
interface CollapsedMessageGroupProps {
  count: number;
  onExpandAll: () => void;
}

export function CollapsedMessageGroup({
  count,
  onExpandAll,
}: CollapsedMessageGroupProps) {
  // Raw <div> for the `select-none` escape hatch, exempt from
  // tangle-ui/no-classname-on-primitives.
  return (
    <div className="flex justify-center select-none">
      <Button variant="ghost" size="xs" tone="default" onClick={onExpandAll}>
        <Icon name="ChevronDown" size="xs" />
        {count} messages hidden
      </Button>
    </div>
  );
}
