import { CloudUpload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { ComponentSpec } from "@/utils/componentSpec";

import GoogleCloudSubmitter from "./GoogleCloudSubmitter";

interface GoogleCloudSubmissionDialogProps {
  componentSpec?: ComponentSpec;
}

const GoogleCloudSubmissionDialog = ({
  componentSpec,
}: GoogleCloudSubmissionDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenuButton
          asChild
          tooltip="Submit to Google Cloud"
          forceTooltip
          tooltipPosition="right"
        >
          <Button className="w-full justify-start" variant="ghost">
            <CloudUpload className="w-4 h-4" />
            <span className="font-normal text-xs">Google Cloud</span>
          </Button>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Submit to Google Cloud</DialogTitle>
        <DialogDescription>
          Run pipeline using Google&#39;s VertexAI
        </DialogDescription>
        <GoogleCloudSubmitter componentSpec={componentSpec} />
      </DialogContent>
    </Dialog>
  );
};

export default GoogleCloudSubmissionDialog;
