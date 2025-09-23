import yaml from "js-yaml";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockStack } from "@/components/ui/layout";
import {
  generateDigest,
  hydrateComponentReference,
} from "@/services/componentService";
import type {
  ComponentSpec,
  HydratedComponentReference,
} from "@/utils/componentSpec";
import { deleteComponentFileFromList } from "@/utils/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";
import type { UserComponent } from "@/utils/localforage";

import { InfoBox } from "../InfoBox";

const ComponentDuplicateDialog = ({
  existingComponent,
  newComponent,
  newComponentDigest,
  setClose,
  handleImportComponent,
}: {
  existingComponent?: UserComponent;
  newComponent?: ComponentSpec;
  newComponentDigest?: string;
  setClose: () => void;
  handleImportComponent: (content: string) => Promise<void>;
}) => {
  const [newName, setNewName] = useState("");
  const [newDigest, setNewDigest] = useState("");

  const [existingUserComponent, setExistingUserComponent] =
    useState<HydratedComponentReference | null>(null);

  const open = !!existingUserComponent && !!newComponent && !!newName;
  const disableImportAsNew =
    !newName || newName.trim() === existingUserComponent?.name?.trim();

  const generateNewDigestOnBlur = useCallback(async () => {
    if (
      newComponent &&
      newComponentDigest &&
      newName.trim() === newComponent.name?.trim()
    ) {
      setNewDigest(newComponentDigest);
      return;
    }

    if (newComponent && newName) {
      const digest = await generateDigest(
        yaml.dump({
          ...newComponent,
          name: newName,
        }),
      );
      setNewDigest(digest);
    }
  }, [newComponent, newName]);

  const handleOnOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setClose();
      }
    },
    [setClose],
  );

  const handleRenameAndImport = useCallback(
    async (newName: string) => {
      const newComponentWithNewName = {
        ...newComponent,
        name: newName,
      };
      const yamlString = yaml.dump(newComponentWithNewName);
      handleImportComponent(yamlString);

      setClose();
    },
    [handleImportComponent, setClose],
  );

  const handleReplaceAndImport = useCallback(async () => {
    const yamlString = yaml.dump(newComponent);
    await deleteComponentFileFromList(
      USER_COMPONENTS_LIST_NAME,
      existingUserComponent?.name ?? "",
    );
    handleImportComponent(yamlString);

    setClose();
  }, [handleImportComponent, setClose]);

  const handleCancel = useCallback(() => {
    setClose();
  }, [setClose]);

  useEffect(() => {
    const generateNewDigest = async () => {
      if (newComponent) {
        const digest = await generateDigest(yaml.dump(newComponent));
        setNewDigest(digest);
      }
    };

    if (newComponent && newComponent?.name) {
      setNewName(newComponent?.name);
    }

    if (newComponentDigest) {
      setNewDigest(newComponentDigest);
      return;
    }

    generateNewDigest();
  }, [existingUserComponent, newComponent]);

  useEffect(() => {
    const hydrateExistingComponent = async () => {
      if (existingComponent && existingComponent.componentRef)
        setExistingUserComponent(
          await hydrateComponentReference(existingComponent.componentRef),
        );
    };

    hydrateExistingComponent();
  }, [existingComponent]);

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Component already exists</DialogTitle>
          <DialogDescription>
            The component you are trying to import already exists. Please enter
            a new name for the component or replace the existing component.
          </DialogDescription>
          <DialogDescription>
            Note: &quot;Replace existing&quot; will use the existing name.
          </DialogDescription>
        </DialogHeader>
        <InfoBox title="Existing Component" className="p-2">
          <BlockStack gap="2" className="w-full">
            <Label className="text-xs font-medium">Name</Label>
            <Input
              value={existingUserComponent?.name ?? ""}
              readOnly
              className="text-xs border-blue-200 bg-blue-100/50"
            />
            <Label className="text-xs font-medium">Digest</Label>
            <Input
              value={existingUserComponent?.digest ?? ""}
              readOnly
              className="text-xs border-blue-200 bg-blue-100/50"
            />
          </BlockStack>
        </InfoBox>
        <InfoBox title="New Component" variant="ghost" className="p-2">
          <BlockStack gap="2" className="w-full">
            <Label className="text-xs font-medium">Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus={true}
              onBlur={generateNewDigestOnBlur}
            />
            <Label className="text-xs font-medium">Digest</Label>
            <Input value={newDigest} readOnly className="text-xs" />
          </BlockStack>
        </InfoBox>

        <DialogFooter>
          <Button
            onClick={() => handleRenameAndImport(newName ?? "")}
            disabled={disableImportAsNew}
          >
            Import as new
          </Button>
          <Button onClick={handleReplaceAndImport}>Replace existing</Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComponentDuplicateDialog;
