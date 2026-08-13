import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface JumpToBottomButtonProps {
  unreadCount: number;
  onClick: () => void;
}

export function JumpToBottomButton({
  unreadCount,
  onClick,
}: JumpToBottomButtonProps) {
  const label =
    unreadCount > 0
      ? `${unreadCount} new ${unreadCount === 1 ? "message" : "messages"}`
      : "Scroll to bottom";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center drop-shadow-md [&>*]:pointer-events-auto">
      <Button variant="secondary" size="sm" onClick={onClick}>
        {label}
        <Icon name="ChevronDown" size="xs" />
      </Button>
    </div>
  );
}
