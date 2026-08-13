import { AssetList } from "../sidebar/assets/AssetList";
import { useSessionChatWindowsContext } from "./SessionChatWindowsContext";

export function AssetsWindow() {
  const { sessionId, assets, activeTab, onOpenAsset, onUnpinArtifact } =
    useSessionChatWindowsContext();

  return (
    <AssetList
      sessionId={sessionId}
      assets={assets}
      selectedId={activeTab}
      onOpen={onOpenAsset}
      onUnpin={onUnpinArtifact}
    />
  );
}
