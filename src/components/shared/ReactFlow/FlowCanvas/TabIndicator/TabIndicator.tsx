import { useConnection } from "@xyflow/react";

import { useComponentLibrary } from "@/providers/ComponentLibraryProvider";

import KeyboardKey from "./KeyboardKey";

const TabIndicator = () => {
  const connection = useConnection();
  const { searchResult } = useComponentLibrary();

  const hasResults =
    searchResult &&
    (searchResult.components.standard.length > 0 ||
      searchResult.components.user.length > 0 ||
      searchResult.components.used.length > 0);

  const isOverValidTarget =
    connection.inProgress && connection.toHandle !== null;

  // Only show when actively connecting, has search results, and NOT over a valid target
  if (!connection.inProgress || !hasResults || isOverValidTarget) {
    return null;
  }

  const { to } = connection;
  if (!to) return null;

  const implemented = false;

  if (!implemented) {
    return null; // Placeholder for future implementation
  }

  return (
    <div
      style={{
        position: "absolute",
        left: to.x + 15,
        top: to.y - 12,
        zIndex: 1000,
        pointerEvents: "none",
      }}
      className="relative flex items-center gap-2 opacity-90"
    >
      <KeyboardKey>TAB</KeyboardKey>

      <div
        className="
        text-gray-600/60
        text-xs
        font-normal
        select-none
        opacity-70
      "
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        cycle valid components
      </div>
    </div>
  );
};

export default TabIndicator;
