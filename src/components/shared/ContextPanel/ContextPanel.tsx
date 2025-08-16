import { useContextPanelContent } from "@/providers/ContextPanelProvider";
import { BOTTOM_FOOTER_HEIGHT, TOP_NAV_HEIGHT } from "@/utils/constants";

export const ContextPanel = () => {
  const { content } = useContextPanelContent();
  return (
    <div
      data-testid="context-panel-container"
      className="h-full p-2 bg-sidebar text-sidebar-foreground overflow-y-auto"
      style={{
        maxHeight: `calc(100vh - ${TOP_NAV_HEIGHT}px - ${BOTTOM_FOOTER_HEIGHT}px)`,
      }}
    >
      {content}
    </div>
  );
};
