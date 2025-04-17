import { Component, X } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useImportComponent from "@/hooks/useImportComponent";
import useToastNotification from "@/hooks/useToastNotification";

enum TabType {
  URL = "URL",
  File = "File",
}

const ImportComponent = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <SidebarMenuItem>
        <DialogTrigger asChild>
          <div className="w-full">
            <SidebarMenuButton className="cursor-pointer w-full">
              <Component />
              <span className="font-normal">Import Component</span>
            </SidebarMenuButton>
          </div>
        </DialogTrigger>
      </SidebarMenuItem>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Component</DialogTitle>
          <DialogDescription>
            Import a component from a file or a URL.
          </DialogDescription>
          <Tabs
            value={tab}
            className="w-full"
            onValueChange={(value) => handleTabChange(value as TabType)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value={TabType.File}>File</TabsTrigger>
              <TabsTrigger value={TabType.URL}>URL</TabsTrigger>
            </TabsList>
            <TabsContent value={TabType.File}>
              <div className="grid w-full items-center gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="file">Component YAML File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".yaml"
                      onChange={handleFileChange}
                      disabled={isLoading || isSubmitting}
                      ref={fileInputRef}
                      className={selectedFileName ? "hidden" : ""}
                    />
                    {selectedFileName && (
                      <div className="flex flex-1 items-center border rounded-md px-3 py-2 text-sm">
                        <span className="flex-1 truncate">
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
          </Tabs>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleImport}
            disabled={isButtonDisabled}
            className="cursor-pointer"
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportComponent;
