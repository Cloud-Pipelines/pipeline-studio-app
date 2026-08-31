import { observer } from "mobx-react-lite";

import { type IconName } from "@/components/ui/icon";
import type { ComponentSpec } from "@/models/componentSpec";
import type { LocatedEntityKind } from "@/models/componentSpec/queries/locateEntity";
import { locateEntity } from "@/models/componentSpec/queries/locateEntity";
import { useSharedStores } from "@/routes/v2/shared/store/SharedStoreContext";
import { useFocusActions } from "@/routes/v2/shared/store/useFocusActions";

import { ChatEntityChip } from "./ChatEntityChip";

type ChipEntityKind = Exclude<LocatedEntityKind, "binding">;

const ENTITY_ICON: Record<ChipEntityKind, IconName> = {
  task: "SquareFunction",
  input: "ArrowRightToLine",
  output: "ArrowLeftFromLine",
};

const UNKNOWN_ICON: IconName = "CircleQuestionMark";

interface EntityChipProps {
  entityId: string;
  label: string;
}

interface NavigableEntity {
  type: ChipEntityKind;
  navigationPath: string[];
}

export const EntityChip = observer(function EntityChip({
  entityId,
  label,
}: EntityChipProps) {
  const { navigation } = useSharedStores();
  const { navigateToEntity } = useFocusActions();

  const target = resolveNavigableEntity(navigation.rootSpec, entityId);

  function handleClick() {
    if (!target) return;
    navigateToEntity(target.navigationPath, entityId, target.type);
  }

  return (
    <ChatEntityChip
      icon={target ? ENTITY_ICON[target.type] : UNKNOWN_ICON}
      label={label}
      onClick={handleClick}
    />
  );
});

/**
 * Entities inside a subgraph need the navigation path to their owning spec, not
 * just their `$id` — `navigateToPath` expects the root pipeline name followed by
 * the chain of subgraph task names. Bindings have no node to focus, so they are
 * not navigable.
 */
function resolveNavigableEntity(
  rootSpec: ComponentSpec | null,
  entityId: string,
): NavigableEntity | undefined {
  if (!rootSpec) return undefined;

  const location = locateEntity(rootSpec, entityId);
  if (!location || location.kind === "binding") return undefined;

  return {
    type: location.kind,
    navigationPath: [rootSpec.name, ...location.subgraphPath],
  };
}
