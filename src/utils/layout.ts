import { TOP_NAV_HEIGHT } from "@/utils/constants";

export function contentHeight(subtractPx = 0): string {
  return `calc(100vh - ${TOP_NAV_HEIGHT}px - ${subtractPx}px)`;
}
