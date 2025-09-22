import { icons, PackagePlus, X } from "lucide-react";
import { Upload } from "lucide-react";
import { type ChangeEvent, useCallback, useRef, useState } from "react";

import { ComponentEditorDialog } from "@/components/shared/ComponentEditor/ComponentEditorDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heading, Paragraph } from "@/components/ui/typography";
import useImportComponent from "@/hooks/useImportComponent";
import useToastNotification from "@/hooks/useToastNotification";
import { cn } from "@/lib/utils";
import { useComponentLibrary } from "@/providers/ComponentLibraryProvider/ComponentLibraryProvider";
import { hydrateComponentReference } from "@/services/componentService";
import { saveComponent } from "@/utils/localforage";

enum TabType {
  URL = "URL",
  File = "File",
  New = "New",
}

type Template = {
  name: string;
  icon?: keyof typeof icons;
  color?: string;
};

const SUPPORTED_TEMPLATES: Template[] = [
  { name: "Empty" },
  { name: "Ruby", icon: "Gem", color: "text-red-400" },
  { name: "Python", icon: "Worm", color: "text-green-400" },
  { name: "JavaScript", icon: "Hexagon", color: "text-yellow-400" },
  { name: "Bash", icon: "Terminal", color: "text-gray-400" },
];

const ImportComponent = ({
  triggerComponent,
}: {
  triggerComponent?: React.ReactNode;
}) => {
  const notify = useToastNotification();
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<TabType>(TabType.File);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | ArrayBuffer | null>(
    null,
  );
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addToComponentLibrary } = useComponentLibrary();
  const [isComponentEditorDialogOpen, setIsComponentEditorDialogOpen] =
    useState(false);
  const handleComponentEditorDialogClose = useCallback(
    async (componentText: string) => {
      setIsComponentEditorDialogOpen(false);
      // saveNewComponentToFile
      const hydratedComponent = await hydrateComponentReference({
        text: componentText,
      });

      if (hydratedComponent) {
        await saveComponent({
          id: `component-${hydratedComponent.digest}`,
          url: "",
          data: componentText,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        await addToComponentLibrary(hydratedComponent);

        setIsOpen(false);

        notify(
          `Component ${hydratedComponent.name} imported successfully`,
          "success",
        );
      }
    },
    [],
  );

  const { onImportFromUrl, onImportFromFile, isLoading } = useImportComponent({
    successCallback: () => {
      setIsOpen(false);
      setUrl("");
      setSelectedFile(null);
      setSelectedFileName("");
      setIsSubmitting(false);
      notify("Component imported successfully", "success");
    },
    errorCallback: (error: Error) => {
      notify(error.message, "error");
      setIsSubmitting(false);
    },
  });

  const handleTabChange = (value: TabType) => {
    setTab(value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    // Don't clear the file if the user cancels the dialog
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (content) {
        setSelectedFile(content);
      }
    };

    reader.readAsText(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = () => {
    setIsSubmitting(true);
    if (tab === TabType.URL) {
      onImportFromUrl(url);
    } else if (tab === TabType.File && selectedFile) {
      onImportFromFile(selectedFile as string);
    }
  };

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && (isLoading || isSubmitting)) return;

    if (!open) {
      setUrl("");
      setSelectedFile(null);
      setSelectedFileName("");
      setIsSubmitting(false);
    }
    setIsOpen(open);
  };

  const isButtonDisabled =
    isLoading ||
    isSubmitting ||
    (tab === TabType.URL && !url) ||
    (tab === TabType.File && !selectedFile);

  const ButtonComponent = triggerComponent ? (
    triggerComponent
  ) : (
    <Button className="w-fit" variant="ghost">
      <PackagePlus className="w-4 h-4" />
    </Button>
  );
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{ButtonComponent}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Component</DialogTitle>
          <DialogDescription>
            Create a new component, or import from a file or a URL.
          </DialogDescription>
          <Tabs
            value={tab}
            className="w-full"
            onValueChange={(value) => handleTabChange(value as TabType)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value={TabType.File}>File</TabsTrigger>
              <TabsTrigger value={TabType.URL}>URL</TabsTrigger>
              <TabsTrigger value={TabType.New}>New</TabsTrigger>
            </TabsList>
            <TabsContent value={TabType.File}>
              <div className="grid w-full items-center gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="file">Component YAML File</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="file"
                        type="file"
                        accept=".yaml"
                        onChange={handleFileChange}
                        disabled={isLoading || isSubmitting}
                        ref={fileInputRef}
                        className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${selectedFileName ? "hidden" : ""}`}
                      />
                      {!selectedFileName && (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Drop your YAML file here or click to browse
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Supports .yaml files
                          </p>
                        </div>
                      )}
                      {selectedFileName && (
                        <div className="flex flex-1 items-center border rounded-md px-3 py-2 text-sm">
                          <span className="flex-1 truncate max-w-[325px]">
                            {selectedFileName}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearSelectedFile}
                            className="h-6 w-6 p-0 ml-1 rounded-full"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span className="sr-only">Clear file</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    {selectedFileName && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Select a YAML file containing a pipeline component
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value={TabType.URL}>
              <div className="grid w-full items-center gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="url">Component URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://raw.githubusercontent.com/.../component.yaml"
                    value={url}
                    onChange={handleUrlChange}
                    disabled={isLoading || isSubmitting}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the URL of a component YAML file
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value={TabType.New}>
              <BlockStack gap="2" className="py-4">
                <Heading level={2}>New Component</Heading>
                <Paragraph tone="subdued">
                  Create a new component using the in-app editor
                </Paragraph>
                <Heading level={3}>Select a Template</Heading>
                <div className="grid grid-cols-3 border-1 rounded-md p-2 w-full">
                  {SUPPORTED_TEMPLATES.map((template) => (
                    <BlockStack
                      key={template.name}
                      gap="1"
                      align="center"
                      inlineAlign="space-between"
                      className="cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors"
                    >
                      <InlineStack
                        align="center"
                        blockAlign="center"
                        className="bg-gray-200 rounded-md p-4 mb-2 w-full h-24"
                        onClick={() => setIsComponentEditorDialogOpen(true)}
                      >
                        {!!template.icon && (
                          <Icon
                            name={template.icon}
                            size="fill"
                            className={cn("text-foreground", template.color)}
                          />
                        )}
                      </InlineStack>
                      <Paragraph>{template.name}</Paragraph>
                    </BlockStack>
                  ))}
                </div>
              </BlockStack>
              <ComponentEditorDialog
                visible={isComponentEditorDialogOpen}
                onClose={handleComponentEditorDialogClose}
              />
            </TabsContent>
          </Tabs>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          {tab !== TabType.New && (
            <Button
              type="submit"
              onClick={handleImport}
              disabled={isButtonDisabled}
            >
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportComponent;
