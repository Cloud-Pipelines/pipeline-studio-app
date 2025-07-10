import { useCallback } from "react";

import { Spinner } from "@/components/ui/spinner";

import TooltipButton from "../Buttons/TooltipButton";
import { GitHubAuthFlowBackdrop } from "./GitHubAuthFlowBackdrop";
import { useAwaitAuthorization } from "./useAwaitAuthorization";

export function GitHubAuthButton() {
  const {
    awaitAuthorization,
    isPopupOpen,
    closePopup,
    bringPopupToFront,
    isLoading,
    isAuthorized,
  } = useAwaitAuthorization();

  const signIn = useCallback(async () => {
    await awaitAuthorization();
  }, [awaitAuthorization]);

  if (isAuthorized) {
    return null;
  }

  return (
    <>
      <TooltipButton
        onClick={signIn}
        disabled={isLoading}
        className="flex items-center gap-2 w-full"
        tooltip="Sign in with GitHub to submit runs"
      >
        {isLoading ? (
          <>
            <Spinner />
            Authenticating...
          </>
        ) : (
          <>
            <img
              src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
              alt="GitHub"
              className="w-4 h-4"
            />
            Sign in with GitHub
          </>
        )}
      </TooltipButton>

      <GitHubAuthFlowBackdrop
        isOpen={isPopupOpen}
        onClose={closePopup}
        onClick={bringPopupToFront}
      />
    </>
  );
}
