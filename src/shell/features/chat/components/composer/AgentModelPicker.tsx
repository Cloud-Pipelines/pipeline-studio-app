import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  DEFAULT_THINKING_LEVEL,
  THINKING_LEVELS,
  type ThinkingLevel,
} from "@/shell/contracts";

/** The model/thinking selection this picker reads and writes. */
export interface AgentModelPickerValue {
  model?: string;
  thinkingDepth?: ThinkingLevel;
}

interface AgentModelPickerProps extends AgentModelPickerValue {
  /** Called with the single changed field (model or thinking depth). */
  onChange: (selection: AgentModelPickerValue) => void;
  /** Disables the trigger (e.g. while disconnected). */
  disabled?: boolean;
}

/** Resolves a model id to its display label, falling back to the raw id. */
function modelLabel(model: string): string {
  return AVAILABLE_MODELS.find((m) => m.id === model)?.label ?? model;
}

/** Title-cases a thinking level for display. */
function thinkingLabel(thinking: ThinkingLevel): string {
  return thinking.charAt(0).toUpperCase() + thinking.slice(1);
}

/** A single selectable row with a leading check/placeholder indicator. */
interface PickerRowProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function PickerRow({ label, selected, onSelect }: PickerRowProps) {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      <InlineStack gap="2" blockAlign="center">
        <Icon
          name={selected ? "Check" : "Minus"}
          size="xs"
          tone={selected ? "strong" : "subdued"}
        />
        <Text size="sm">{label}</Text>
      </InlineStack>
    </DropdownMenuItem>
  );
}

/**
 * Compact per-agent control to pick the model and thinking depth. Each lives in
 * its own dropdown so changing one keeps the other a single click away (the
 * menu closes on select). Changing either respawns the agent's process
 * server-side (handled by the caller), applying on subsequent runs.
 */
export function AgentModelPicker({
  model,
  thinkingDepth,
  onChange,
  disabled,
}: AgentModelPickerProps) {
  // Show the real effective value even when the agent has no explicit selection
  // (it runs the server default), so the trigger never reads a generic "Default".
  const effectiveModel = model ?? DEFAULT_MODEL_ID;
  const effectiveThinking = thinkingDepth ?? DEFAULT_THINKING_LEVEL;

  return (
    <InlineStack gap="1" blockAlign="center" wrap="nowrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="toolbar" size="xs" disabled={disabled}>
            <Icon name="Cpu" size="xs" tone="subdued" />
            <Text size="xs">{modelLabel(effectiveModel)}</Text>
            <Icon name="ChevronDown" size="xs" tone="subdued" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Box paddingInline="sm" paddingBlock="xs">
            <Text size="xs" tone="subdued" weight="medium">
              Model
            </Text>
          </Box>
          {AVAILABLE_MODELS.map((option) => (
            <PickerRow
              key={option.id}
              label={option.label}
              selected={option.id === effectiveModel}
              onSelect={() => onChange({ model: option.id })}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="toolbar" size="xs" disabled={disabled}>
            <Icon name="Brain" size="xs" tone="subdued" />
            <Text size="xs" tone="subdued">
              {thinkingLabel(effectiveThinking)}
            </Text>
            <Icon name="ChevronDown" size="xs" tone="subdued" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Box paddingInline="sm" paddingBlock="xs">
            <Text size="xs" tone="subdued" weight="medium">
              Thinking depth
            </Text>
          </Box>
          {THINKING_LEVELS.map((level) => (
            <PickerRow
              key={level}
              label={thinkingLabel(level)}
              selected={level === effectiveThinking}
              onSelect={() => onChange({ thinkingDepth: level })}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </InlineStack>
  );
}
