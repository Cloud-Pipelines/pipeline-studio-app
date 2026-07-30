import { InfoBox } from "@/components/shared/InfoBox";
import { InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";
import type { ComponentSpec } from "@/utils/componentSpec";
import { componentSpecToText } from "@/utils/yaml";

import { CodeViewer, DiffCodeViewer } from "./DiffCodeViewer";

interface YamlDiffViewProps {
  specA?: ComponentSpec;
  specB?: ComponentSpec;
}

export function YamlDiffView({ specA, specB }: YamlDiffViewProps) {
  const yamlA = specA && componentSpecToText(specA);
  const yamlB = specB && componentSpecToText(specB);

  if (!yamlA && !yamlB) {
    return (
      <InfoBox title="Nothing to compare" variant="info" width="full">
        Select two runs to compare their YAML specifications.
      </InfoBox>
    );
  }

  if (!yamlA || !yamlB) {
    return (
      <InlineStack
        gap="0"
        blockAlign="stretch"
        wrap="nowrap"
        className="h-full w-full"
      >
        <div className="min-w-0 flex-1">
          <CodeViewer value={yamlA ?? yamlB ?? ""} language="yaml" />
        </div>
        <InlineStack
          align="center"
          blockAlign="center"
          className="min-w-0 flex-1 border-l p-6"
        >
          <Text tone="subdued" className="text-center">
            Select a second run to compare YAML side by side.
          </Text>
        </InlineStack>
      </InlineStack>
    );
  }

  return <DiffCodeViewer original={yamlA} modified={yamlB} language="yaml" />;
}
