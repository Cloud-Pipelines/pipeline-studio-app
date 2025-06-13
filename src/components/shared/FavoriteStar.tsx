import { Star } from "lucide-react";
import type { MouseEvent } from "react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteStarProps {
  active?: boolean;
  onClick?: () => void;
}

export const FavoriteStar = ({ active, onClick }: FavoriteStarProps) => {
  const handleFavorite = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();

      if (onClick) {
        onClick();
      }
    },
    [onClick],
  );

  return (
    <Button
      onClick={handleFavorite}
      className={cn(
        "w-fit h-fit p-1 hover:text-yellow-500",
        active ? "text-yellow-500" : "text-gray-500/50",
      )}
      variant="ghost"
      size="icon"
    >
      <Star
        className="h-4 w-4"
        fill={active ? "oklch(79.5% 0.184 86.047)" : "none"}
      />
    </Button>
  );
};
