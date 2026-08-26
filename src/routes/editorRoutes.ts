import { APP_ROUTES } from "./appRoutes";

export function getDefaultEditorPath(pipelineName: string): string {
  return `${APP_ROUTES.EDITOR}/${encodeURIComponent(pipelineName)}`;
}
