import { Code, InfoIcon, ListFilter } from "lucide-react";
import type { ReactNode } from "react";

import { useFullscreen } from "@/components/shared/CodeViewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ComponentSpec } from "@/utils/componentSpec";
import { downloadYamlFromComponentText } from "@/utils/URL";

import InfoIconButton from "../../Buttons/InfoIconButton";
import { DetailsTab, ImplementationTab, IOTab } from "./tabs";

interface ComponentDetailsProps {
  url: string;
  displayName: string;
  componentSpec: ComponentSpec;
  componentDigest: string;
  componentText: string;
  trigger?: ReactNode;
  actions?: ReactNode[];
  onClose?: () => void;
}

const ComponentDetails = ({
  url,
  displayName,
  componentSpec,
  componentDigest,
  componentText,
  trigger,
  actions = [],
  onClose,
}: ComponentDetailsProps) => {
  // Get global fullscreen state
  const { isAnyFullscreen } = useFullscreen();

  const handleDownloadYaml = () => {
    downloadYamlFromComponentText(componentText, componentSpec, displayName);
  };
  const dialogTriggerButton = trigger || <InfoIconButton />;

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog modal={!isAnyFullscreen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{dialogTriggerButton}</DialogTrigger>

      <DialogDescription
        className="hidden"
        aria-label={`${displayName} component details`}
      >
        {`${displayName} component details`}
      </DialogDescription>
      <DialogContent
        className="max-w-2xl min-w-2xl overflow-hidden"
        aria-label={`${displayName} component details`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between mr-5">
            <span>{displayName}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4 flex flex-col">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="details" className="flex-1">
              <InfoIcon className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="io" className="flex-1">
              <ListFilter className="h-4 w-4" />
              Inputs/Outputs
            </TabsTrigger>
            <TabsTrigger value="implementation" className="flex-1">
              <Code className="h-4 w-4" />
              Implementation
            </TabsTrigger>
          </TabsList>

          <div className="overflow-hidden h-[40vh]">
            <TabsContent value="details" className="h-full">
              <DetailsTab
                displayName={displayName}
                componentSpec={componentSpec}
                componentDigest={componentDigest}
                url={url}
                actions={actions}
                handleDownloadYaml={handleDownloadYaml}
              />
            </TabsContent>

            <TabsContent value="io" className="h-full">
              <IOTab componentSpec={componentSpec} />
            </TabsContent>

            <TabsContent value="implementation" className="h-full">
              <ImplementationTab
                displayName={displayName}
                componentSpec={componentSpec}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ComponentDetails;
