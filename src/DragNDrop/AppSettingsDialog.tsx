/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getMutableAppSettings } from "../appSettings";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AppSettingsDialogProps = {
  isOpen: boolean;
  handleClose: () => void;
};

const AppSettingsDialog = ({ isOpen, handleClose }: AppSettingsDialogProps) => {
  const appSettings = getMutableAppSettings();

  const [componentLibraryUrl, setComponentLibraryUrl] = useState(
    appSettings.componentLibraryUrl.value,
  );
  const [pipelineLibraryUrl, setPipelineLibraryUrl] = useState(
    appSettings.pipelineLibraryUrl.value,
  );
  const [defaultPipelineUrl, setDefaultPipelineUrl] = useState(
    appSettings.defaultPipelineUrl.value,
  );
  const [componentFeedUrls, setComponentFeedUrls] = useState(
    appSettings.componentFeedUrls.value,
  );
  const [gitHubSearchLocations, setGitHubSearchLocations] = useState(
    appSettings.gitHubSearchLocations.value,
  );
  const [googleCloudOAuthClientId, setGoogleCloudOAuthClientId] = useState(
    appSettings.googleCloudOAuthClientId.value,
  );

  const handleSave = () => {
    appSettings.componentLibraryUrl.value = componentLibraryUrl;
    appSettings.pipelineLibraryUrl.value = pipelineLibraryUrl;
    appSettings.defaultPipelineUrl.value = defaultPipelineUrl;
    appSettings.componentFeedUrls.value = componentFeedUrls;
    appSettings.gitHubSearchLocations.value = gitHubSearchLocations;
    appSettings.googleCloudOAuthClientId.value = googleCloudOAuthClientId;
    handleClose();
  };

  const handleReset = () => {
    setComponentLibraryUrl(appSettings.componentLibraryUrl.resetToDefault());
    setPipelineLibraryUrl(appSettings.pipelineLibraryUrl.resetToDefault());
    setDefaultPipelineUrl(appSettings.defaultPipelineUrl.resetToDefault());
    setComponentFeedUrls(appSettings.componentFeedUrls.resetToDefault());
    setGitHubSearchLocations(
      appSettings.gitHubSearchLocations.resetToDefault(),
    );
    setGoogleCloudOAuthClientId(
      appSettings.googleCloudOAuthClientId.resetToDefault(),
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <DialogDescription className="hidden">
          Application settings.
        </DialogDescription>

        <Label htmlFor="component_library_url">Component library URL</Label>
        <Input
          id="component_library_url"
          value={componentLibraryUrl}
          onChange={(e) => setComponentLibraryUrl(e.target.value)}
          className="w-full"
        />

        <Label htmlFor="pipeline_library_url">Pipeline library URL</Label>
        <Input
          id="pipeline_library_url"
          value={pipelineLibraryUrl}
          onChange={(e) => setPipelineLibraryUrl(e.target.value)}
          className="w-full"
        />

        <Label htmlFor="default_pipeline_url">Default pipeline URL</Label>
        <Input
          id="default_pipeline_url"
          value={defaultPipelineUrl}
          onChange={(e) => setDefaultPipelineUrl(e.target.value)}
          className="w-full"
        />

        <Label htmlFor="component_search_feed_urls">
          Component search feed URLs
        </Label>

        <Textarea
          id="component_search_feed_urls"
          value={componentFeedUrls.join("\n")}
          onChange={(e) => setComponentFeedUrls(e.target.value.split("\n"))}
          className="w-full resize-none h-24"
        />

        <Label htmlFor="component_search_locations_github">
          Component search locations - GitHub
        </Label>

        <Textarea
          id="component_search_locations_github"
          value={gitHubSearchLocations.join("\n")}
          onChange={(e) => setGitHubSearchLocations(e.target.value.split("\n"))}
          className="w-full resize-none h-24"
        />

        <Label htmlFor="google_cloud_client_id">
          Google Cloud OAuth client ID
        </Label>
        <Input
          id="google_cloud_client_id"
          value={googleCloudOAuthClientId}
          onChange={(e) => setGoogleCloudOAuthClientId(e.target.value)}
          className="w-full"
        />

        <DialogFooter>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
          <Button onClick={handleReset} variant="outline" color="error">
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppSettingsDialog;
