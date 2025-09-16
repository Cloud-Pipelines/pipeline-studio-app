import { BrowserPersistedLibrary } from "@/providers/ComponentLibraryProvider/libraries/browserPersistedLibrary";
import { registerLibraryFactory } from "@/providers/ComponentLibraryProvider/libraries/factory";

import { getGitHubLibraryId } from "./utils/libraryId";

class GitHubLibraryNotFoundError extends Error {
  name = "GitHubLibraryNotFoundError";
  constructor(message: string) {
    super(message);
  }
}

export class GitHubFlatComponentLibrary extends BrowserPersistedLibrary {
  constructor(readonly repoName: string) {
    super(getGitHubLibraryId(repoName), () => {
      throw new GitHubLibraryNotFoundError(
        `GitHub library ${this.repoName} not found`,
      );
    });
  }
}
