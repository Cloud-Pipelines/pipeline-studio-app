/**
 * @license
 * Copyright 2022 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2022 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { getMutableAppSettings } from "../appSettings";

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
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        {/* <DialogContentText>Application settings</DialogContentText> */}
        <TextField
          id="component_library_url"
          label="Component library URL"
          variant="outlined"
          margin="normal"
          fullWidth
          value={componentLibraryUrl}
          onChange={(e) => setComponentLibraryUrl(e.target.value)}
        />
        <TextField
          id="pipeline_library_url"
          label="Pipeline library URL"
          variant="outlined"
          margin="normal"
          fullWidth
          value={pipelineLibraryUrl}
          onChange={(e) => setPipelineLibraryUrl(e.target.value)}
        />
        <TextField
          id="default_pipeline_url"
          label="Default pipeline URL"
          variant="outlined"
          margin="normal"
          fullWidth
          value={defaultPipelineUrl}
          onChange={(e) => setDefaultPipelineUrl(e.target.value)}
        />
        <TextField
          id="component_search_feed_urls"
          label="Component search feed URLs"
          variant="outlined"
          margin="normal"
          fullWidth
          multiline
          value={componentFeedUrls.join("\n")}
          onChange={(e) => setComponentFeedUrls(e.target.value.split("\n"))}
        />
        <TextField
          id="component_search_locations_github"
          label="Component search locations - GitHub"
          variant="outlined"
          margin="normal"
          fullWidth
          multiline
          value={gitHubSearchLocations.join("\n")}
          onChange={(e) => setGitHubSearchLocations(e.target.value.split("\n"))}
        />
        <TextField
          id="google_cloud_client_id"
          label="Google Cloud OAuth client ID"
          variant="outlined"
          margin="normal"
          fullWidth
          value={googleCloudOAuthClientId}
          onChange={(e) => setGoogleCloudOAuthClientId(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
        <Button onClick={handleReset} color="secondary">
          Reset
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppSettingsDialog;
