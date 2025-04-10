import { Component } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
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

const ImportComponent = () => {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("URL");
  const [isOpen, setIsOpen] = useState(false);
  const { onImportFromUrl, isLoading, errorMessage, successMessage } =
    useImportComponent();

  // Close dialog after successful import with a small delay to show success message
  useEffect(() => {
    if (successMessage && !isLoading) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setUrl("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, isLoading]);

  const handleTabChange = (value: string) => {
    setTab(value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {

    // File import to be implemented
  };

  const handleImportFromUrl = () => {
    if (!url) return;
    onImportFromUrl(url);
    // Don't close dialog - let success/error state show
  };

  const handleImportFromFile = () => {

    // File import to be implemented
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const importHandler =
    tab === "URL" ? handleImportFromUrl : handleImportFromFile;

  const handleOpenChange = (open: boolean) => {
    // Only allow closing the dialog if not in loading state
    if (!open && isLoading) return;

    if (!open) {
      // Reset state when dialog closes
      setUrl("");
    }
    setIsOpen(open);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start px-2!"
              >
                <Component className="mr-2 h-4 w-4" />
                <span className="font-normal">Import Component</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Component</DialogTitle>
            <DialogDescription>
              Import a component from a file or a URL.
            </DialogDescription>
            <Tabs
              defaultValue="URL"
              value={tab}
              className="w-full"
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="File">File</TabsTrigger>
                <TabsTrigger value="URL">URL</TabsTrigger>
              </TabsList>
              <TabsContent value="File">
                <div className="grid w-full items-center gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="file">Component YAML File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".yaml"
                      onChange={handleFileChange}
                    />
                    <p className="text-sm text-gray-500">
                      Select a YAML file containing a pipeline component
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="URL">
                <div className="grid w-full items-center gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="url">Component URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://raw.githubusercontent.com/.../component.yaml"
                      value={url}
                      onChange={handleUrlChange}
                    />
                    <p className="text-sm text-gray-500">
                      Enter the URL of a component YAML file
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogHeader>

          {/* Show error message if any */}
          {errorMessage && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          {/* Show success message if any */}
          {successMessage && (
            <div
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              onClick={importHandler}
              disabled={isLoading || (tab === "URL" && !url)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportComponent;
