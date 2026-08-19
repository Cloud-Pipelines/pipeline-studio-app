import { useNavigate } from "@tanstack/react-router";

import { FloatingSelectionBar } from "@/components/shared/FloatingSelectionBar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { APP_ROUTES } from "@/routes/appRoutes";
import { tracking } from "@/utils/tracking";

interface RunBulkActionsBarProps {
  selectedRuns: string[];
  onClearSelection: () => void;
}

const RunBulkActionsBar = ({
  selectedRuns,
  onClearSelection,
}: RunBulkActionsBarProps) => {
  const navigate = useNavigate();

  const canCompare = selectedRuns.length === 2;

  const handleCompare = () => {
    if (!canCompare) return;
    const [a, b] = selectedRuns;
    navigate({ to: APP_ROUTES.COMPARE, search: { a, b } });
  };

  return (
    <FloatingSelectionBar
      count={selectedRuns.length}
      itemNoun="run"
      onClear={onClearSelection}
    >
      <Button
        variant="default"
        size="sm"
        onClick={handleCompare}
        disabled={!canCompare}
        title={canCompare ? undefined : "Select exactly 2 runs to compare"}
        {...tracking("compare_runs.dashboard.compare_selected")}
      >
        <Icon name="GitCompare" />
        Compare
      </Button>
    </FloatingSelectionBar>
  );
};

export default RunBulkActionsBar;
