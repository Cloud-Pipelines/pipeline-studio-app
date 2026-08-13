import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { Box } from "@/components/ui/box";
import { BlockStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Text } from "@/components/ui/typography";

import { SessionFilterInput } from "./SessionFilterInput";
import { SessionSwitcherList } from "./SessionSwitcherList";
import { SessionSwitcherTrigger } from "./SessionSwitcherTrigger";
import { useSessionSwitcher } from "./useSessionSwitcher";

interface SessionDropDownSwitcherProps {
  currentSessionId: string;
  /** Content rendered inside the clickable trigger (e.g. the session heading). */
  trigger: ReactNode;
}

/**
 * Dropdown-style session switcher: clicking the trigger (or pressing
 * CMD/CTRL+SHIFT+S) opens a popover with an autofocusing quick-filter input and
 * the filtered list of other sessions.
 */
export function SessionDropDownSwitcher({
  currentSessionId,
  trigger,
}: SessionDropDownSwitcherProps) {
  const { sessions, onSelect } = useSessionSwitcher(currentSessionId);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // CMD/CTRL+SHIFT+S expands the switcher; the popover autofocuses the filter.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const isHotkey =
        (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s";
      if (!isHotkey) return;
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setSelectedIndex(0);
    if (!next) setFilter("");
  };

  const handleSelect = (id: string) => {
    setFilter("");
    setSelectedIndex(0);
    onSelect(id);
    setOpen(false);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setSelectedIndex(0);
  };

  const query = filter.trim().toLowerCase();
  const filtered = query
    ? (sessions ?? []).filter((session) =>
        session.name.toLowerCase().includes(query),
      )
    : (sessions ?? []);

  // Keep the highlighted row in range as the filtered list shrinks/grows.
  const activeIndex =
    filtered.length === 0 ? -1 : Math.min(selectedIndex, filtered.length - 1);
  const activeSession = activeIndex >= 0 ? filtered[activeIndex] : undefined;

  // Tab / Shift+Tab (and arrow keys) move the highlight; Enter navigates to it.
  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;

    const move = (delta: number) => {
      event.preventDefault();
      const next = (activeIndex + delta + filtered.length) % filtered.length;
      setSelectedIndex(next);
    };

    if (event.key === "ArrowDown") return move(1);
    if (event.key === "ArrowUp") return move(-1);
    if (event.key === "Tab") return move(event.shiftKey ? -1 : 1);
    if (event.key === "Enter" && activeSession) {
      event.preventDefault();
      handleSelect(activeSession.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <SessionSwitcherTrigger>{trigger}</SessionSwitcherTrigger>
      </PopoverTrigger>
      <PopoverContent
        className="overflow-hidden p-1"
        align="start"
        data-testid="session-dropdown-switcher"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <BlockStack gap="1">
          <SessionFilterInput
            ref={inputRef}
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Filter sessions..."
            aria-label="Filter sessions"
          />
          <Box maxBlockSize="md" overflow="scroll-y" inlineSize="full">
            {filtered.length > 0 ? (
              <SessionSwitcherList
                sessions={filtered}
                onSelect={handleSelect}
                selectedId={activeSession?.id}
              />
            ) : (
              <Box paddingBlock="sm" paddingInline="sm">
                <Text size="sm" tone="subdued">
                  No matches
                </Text>
              </Box>
            )}
          </Box>
        </BlockStack>
      </PopoverContent>
    </Popover>
  );
}
