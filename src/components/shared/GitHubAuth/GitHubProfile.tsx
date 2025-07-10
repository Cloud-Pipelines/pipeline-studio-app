import { useQuery } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import TooltipButton from "../Buttons/TooltipButton";
import type { GithubAuthUserData } from "./types";
import { useAuthLocalStorage } from "./useAuthLocalStorage";

async function fetchGitHubProfile(token: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub profile");
  }

  return (await response.json()) as GithubAuthUserData;
}

export function GitHubProfile() {
  const localTokenStorage = useAuthLocalStorage();

  /**
   * This is a workaround to avoid the useSyncExternalStore from updating infinitely.
   *
   * `getToken` is used to trigger the useSyncExternalStore to update the profile.
   * Profile is parsed from the JSON in the local storage, resulting in a new object every time,
   *   which triggers the useSyncExternalStore to update infinitely.
   */
  const token = useSyncExternalStore(
    localTokenStorage.subscribe,
    localTokenStorage.getToken,
  );
  const storedProfile = localTokenStorage.getProfile();

  const handleLogout = useCallback(() => {
    localTokenStorage.clear();
  }, [localTokenStorage]);

  const { data: profileData } = useQuery({
    queryKey: ["github-profile", token],
    queryFn: () => fetchGitHubProfile(token!),
    enabled: !!token && !storedProfile,
  });

  if (!token) {
    return null;
  }

  const profile = storedProfile || profileData;

  if (!profile) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        <img
          src={profile.avatar_url}
          alt={`${profile.login} avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a default avatar if image fails to load
            e.currentTarget.src = `https://github.com/identicons/${profile.login}.png`;
          }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 truncate">
        {profile.login}
      </span>

      <div className="ml-auto">
        <TooltipButton
          variant="outline"
          className="size-2"
          size="icon"
          onClick={handleLogout}
          tooltip="Logout"
        >
          <LogOutIcon className="w-2 h-2" />
        </TooltipButton>
      </div>
    </div>
  );
}
