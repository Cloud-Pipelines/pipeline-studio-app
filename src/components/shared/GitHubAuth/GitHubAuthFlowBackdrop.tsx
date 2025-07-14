import { memo } from "react";
import { createPortal } from "react-dom";

interface GitHubAuthFlowBackdropProps {
  isOpen: boolean;
  onClose: () => void;
  onClick: () => void;
}

export const GitHubAuthFlowBackdrop = memo(function GitHubAuthFlowBackdrop({
  isOpen,
  onClose,
  onClick,
}: GitHubAuthFlowBackdropProps) {
  if (!isOpen) {
    return null;
  }

  const backdrop = (
    <div
      className="fixed inset-0 z-50 cursor-pointer"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.25)",
        pointerEvents: "auto",
      }}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm text-center">
          <h3 className="text-lg font-semibold mb-2">Oasis Run Pipeline</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            To run pipelines, please complete authentication in the popup window
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(backdrop, document.body);
});
