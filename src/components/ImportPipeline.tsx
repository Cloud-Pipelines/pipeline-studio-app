import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import {
  importPipelineFromFile,
  importPipelineFromYaml,
} from "@/utils/importPipeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { EDITOR_PATH } from "@/utils/constants";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function ImportPipeline() {
  const [isOpen, setIsOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await importPipelineFromFile(files[0]);

      if (result.successful) {
        if (
          result.errorMessage &&
          result.errorMessage.includes("was renamed")
        ) {
          setSuccess(result.errorMessage);
          setTimeout(() => {
            setIsOpen(false);
            navigate({
              to: `${EDITOR_PATH}/${encodeURIComponent(result.name)}`,
            });
          }, 2000);
        } else {
          setIsOpen(false);
          navigate({
            to: `${EDITOR_PATH}/${encodeURIComponent(result.name)}`,
          });
        }
      } else {
        setError(
          result.errorMessage ||
            "Failed to import pipeline. Please check that the file is a valid pipeline YAML.",
        );
      }
    } catch (err) {
      setError(
        (err as Error).message ||
          "An error occurred while importing the pipeline.",
      );
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePasteImport = async () => {
    if (!yamlContent.trim()) {
      setError("Please enter YAML content to import.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await importPipelineFromYaml(yamlContent);

      if (result.successful) {
        if (
          result.errorMessage &&
          result.errorMessage.includes("was renamed")
        ) {
          setSuccess(result.errorMessage);
          setTimeout(() => {
            setIsOpen(false);
            navigate({
              to: `${EDITOR_PATH}/${encodeURIComponent(result.name)}`,
            });
          }, 2000);
        } else {
          setIsOpen(false);
          navigate({
            to: `${EDITOR_PATH}/${encodeURIComponent(result.name)}`,
          });
        }
      } else {
        setError(
          result.errorMessage ||
            "Failed to import pipeline. Please check that the YAML is valid.",
        );
      }
    } catch (err) {
      setError(
        (err as Error).message ||
          "An error occurred while importing the pipeline.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = () => {
    setIsOpen(true);
    setError(null);
    setSuccess(null);
    setYamlContent("");
  };

  const closeDialog = () => {
    setIsOpen(false);
    setError(null);
    setSuccess(null);
    setYamlContent("");
  };

  return (
    <>
      <Button
        onClick={openDialog}
        variant="secondary"
        className="cursor-pointer"
      >
        Import Pipeline
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Pipeline</DialogTitle>
            <DialogDescription>
              Import a pipeline from a YAML file or by pasting YAML content. If
              a pipeline with the same name already exists, a unique name will
              be automatically generated.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="file" className="w-full gap-4">
            <TabsList>
              <TabsTrigger value="file">Import from File</TabsTrigger>
              <TabsTrigger value="paste">Paste YAML</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="pipeline-file"
                  className="text-sm cursor-pointer"
                >
                  Pipeline YAML File. Drag and drop a file here or click to
                  upload.
                </Label>
                <Input
                  ref={fileInputRef}
                  id="pipeline-file"
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
              </div>
            </TabsContent>
            <TabsContent value="paste">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="yaml-content">Pipeline YAML Content</Label>
                <Textarea
                  id="yaml-content"
                  placeholder="Paste your YAML content here..."
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                  rows={25}
                  disabled={isLoading}
                  className="font-mono text-sm resize-none max-h-[300px]"
                />
                <Button
                  onClick={handlePasteImport}
                  disabled={isLoading || !yamlContent.trim()}
                >
                  {isLoading ? "Importing..." : "Import"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {success && (
            <div className="border border-green-200 bg-green-50 p-3 rounded-md mt-4">
              <h4 className="text-green-600 font-medium mb-1">
                Import Successful
              </h4>
              <p className="text-green-500 text-sm">{success}</p>
              <p className="text-green-600 text-sm mt-1">
                You&apos;ll be redirected to the editor in a moment...
              </p>
            </div>
          )}

          {error && (
            <div className="border border-red-200 bg-red-50 p-3 rounded-md mt-4">
              <h4 className="text-red-600 font-medium mb-1">Import Failed</h4>
              <p className="text-red-500 text-sm whitespace-pre-wrap">
                {error}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
