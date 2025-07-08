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
import { generateDigest } from "@/services/componentService";
import type { ComponentSpec } from "@/utils/componentSpec";
import { deleteComponentFileFromList } from "@/utils/componentStore";
import { USER_COMPONENTS_LIST_NAME } from "@/utils/constants";
import type { UserComponent } from "@/utils/localforage";

const ComponentDuplicateDialog = ({
  existingComponent,
  newComponent,
  setClose,
  handleImportComponent,
}: {
  existingComponent?: UserComponent;
  newComponent?: ComponentSpec;
  setClose: () => void;
  handleImportComponent: (content: string) => Promise<void>;
}) => {
  const [newName, setNewName] = useState("");
  const [newDigest, setNewDigest] = useState("");
  const open = !!existingComponent && !!newComponent && !!newName;

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
    generateNewDigest();
  }, [existingComponent, newComponent]);

  const generateNewDigestOnBlur = useCallback(async () => {
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
      existingComponent?.name ?? "",
    );
    handleImportComponent(yamlString);

    setClose();
  }, [handleImportComponent, setClose]);

  const handleCancel = useCallback(() => {
    setClose();
  }, [setClose]);

  const disableImportAsNew =
    !newName || newName.trim() === existingComponent?.name?.trim();

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
        <div className="flex flex-col gap-4 rounded-md border border-gray-200 p-4 bg-gray-100">
          <div className="text-sm font-medium">Existing Component</div>
          <Label className="text-xs font-medium">Name</Label>
          <Input
            value={existingComponent?.name}
            readOnly
            className="text-xs text-gray-500 bg-gray-100 cursor-not-allowed"
          />
          <Label className="text-xs font-medium">Digest</Label>
          <Input
            value={existingComponent?.componentRef.digest}
            readOnly
            className="text-xs text-gray-500 bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-4">
          <div className="text-sm font-medium">New Component</div>
          <Label className="text-xs font-medium">Name</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus={true}
            onBlur={generateNewDigestOnBlur}
          />
          <Label className="text-xs font-medium">Digest</Label>
          <Input
            value={newDigest}
            readOnly
            className="text-xs text-gray-500 bg-gray-100 cursor-not-allowed"
          />
        </div>

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
