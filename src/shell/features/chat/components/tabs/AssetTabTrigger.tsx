// local primitive — a closeable tab in the SessionChat tab strip. Composes the
// Tabs primitive's TabsTrigger with an overlaid close button; the raw <div>/
// <span>/<button> wrappers carry the scoped classNames needed to position the
// close affordance, which the Tangle primitives don't express.
import { Icon } from "@/components/ui/icon";
import { TabsTrigger } from "@/components/ui/tabs";
import type { AssetKind } from "@/shell/features/chat/model/assets";
import { ASSET_ICON } from "@/shell/features/chat/model/assets";

interface AssetTabTriggerProps {
  value: string;
  title: string;
  kind: AssetKind;
  onClose: () => void;
}

export function AssetTabTrigger({
  value,
  title,
  kind,
  onClose,
}: AssetTabTriggerProps) {
  return (
    <div className="relative inline-flex items-center">
      <TabsTrigger value={value} className="max-w-44 pr-7">
        <Icon name={ASSET_ICON[kind]} size="xs" tone="subdued" />
        <span className="min-w-0 truncate">{title}</span>
      </TabsTrigger>
      <button
        type="button"
        aria-label={`Close ${title}`}
        title={`Close ${title}`}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-1.5 inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Icon name="X" size="xs" />
      </button>
    </div>
  );
}
