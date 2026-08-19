import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
import { Text } from "@/components/ui/typography";
import type { AgentBundleMeta } from "@/shell/contracts";
import { agentBundleIconUrl } from "@/shell/features/agent-bundles/api/agentBundlesApi";
import { BundleIconImage } from "@/shell/routes/components/bundle-grid";

interface NewSessionButtonProps {
  bundles?: AgentBundleMeta[];
  /** Whether a session is currently being created. */
  creating: boolean;
  onStartDefaultBundle: () => void;
  onStartFromBundle: (bundleId: string, name: string) => void;
}

export function NewSessionButton({
  bundles,
  creating,
  onStartDefaultBundle,
  onStartFromBundle,
}: NewSessionButtonProps) {
  return (
    <ButtonGroup aria-label="New session">
      <Button
        variant="outline"
        onClick={onStartDefaultBundle}
        disabled={creating}
      >
        {creating ? "Creating..." : "New session"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            icon="ChevronDown"
            variant="outline"
            size="lg"
            aria-label="Choose a bundle"
            disabled={creating || !bundles?.length}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {bundles?.map((bundle) => (
            <DropdownMenuItem
              key={bundle.id}
              onSelect={() => onStartFromBundle(bundle.id, bundle.name)}
            >
              <InlineStack gap="2" blockAlign="center">
                {bundle.hasIcon ? (
                  <BundleIconImage
                    src={agentBundleIconUrl(bundle.id)}
                    alt=""
                    size="xs"
                  />
                ) : (
                  <Icon name="Package" size="sm" />
                )}
                <Text size="sm">{bundle.name}</Text>
              </InlineStack>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
