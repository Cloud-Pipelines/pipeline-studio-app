import { useContextPanel } from "@/providers/ContextPanelProvider";

export const ContextPanel = () => {
  const { content } = useContextPanel();
  return <div className="h-full p-2">{content}</div>;
};
