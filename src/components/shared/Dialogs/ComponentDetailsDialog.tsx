import { Code, InfoIcon, ListFilter } from "lucide-react";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ComponentReference } from "@/utils/componentSpec";

import InfoIconButton from "../Buttons/InfoIconButton";
import { ComponentFavoriteToggle } from "../FavoriteComponentToggle";
import { TaskDetails, TaskImplementation, TaskIO } from "../TaskDetails";

interface ComponentDetailsProps {
  component: ComponentReference;
  displayName: string;
  trigger?: ReactNode;
  actions?: ReactNode[];
  onClose?: () => void;
  onDelete?: () => void;
}

const ComponentDetails = ({
  component,
  displayName,
  trigger,
  actions = [],
  onClose,
  onDelete,
}: ComponentDetailsProps) => {
  const { url, spec: componentSpec, digest: componentDigest } = component;

  const dialogTriggerButton = trigger || <InfoIconButton />;

  const onOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  return (
    <Dialog modal onOpenChange={onOpenChange}>
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
          <DialogTitle className="flex items-center gap-2 mr-5">
            <span>{displayName}</span>
            <ComponentFavoriteToggle component={component} />
          </DialogTitle>
        </DialogHeader>

        {!componentSpec && (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">
              Component specification not found.
            </span>
          </div>
        )}

        {componentSpec && (
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
                <TaskDetails
                  displayName={displayName}
                  componentSpec={componentSpec}
                  componentDigest={componentDigest}
                  url={url}
                  actions={actions}
                  onDelete={onDelete}
                />
              </TabsContent>

              <TabsContent value="io" className="h-full">
                <TaskIO componentSpec={componentSpec} />
              </TabsContent>

              <TabsContent value="implementation" className="h-full">
                <TaskImplementation
                  displayName={displayName}
                  componentSpec={componentSpec}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ComponentDetails;
