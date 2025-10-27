import { Share2 } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import useToastNotification from "@/hooks/useToastNotification";
import { useComponentSpec } from "@/providers/ComponentSpecProvider";

export const ShareSubgraphButton = () => {
    const { currentSubgraphPath } = useComponentSpec();
    const notify = useToastNotification();

    const handleShare = useCallback(() => {
        try {
            const url = new URL(window.location.href);

            if (currentSubgraphPath.length > 1) {
                const pathString = currentSubgraphPath.join(",");
                url.searchParams.set("subgraphPath", pathString);
            } else {
                url.searchParams.delete("subgraphPath");
            }

            navigator.clipboard.writeText(url.toString());
            notify("Link copied to clipboard", "success");
        } catch (error) {
            console.error("Failed to copy link:", error);
            notify("Failed to copy link", "error");
        }
    }, [currentSubgraphPath, notify]);

    if (currentSubgraphPath.length <= 1) {
        return null;
    }

    return (
        <Button
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="gap-2"
        >
            <Share2 className="w-4 h-4" />
            Share
        </Button>
    );
};
