import {
  getApiComponentsDigestGet,
  listApiPublishedComponentsGet,
  publishApiPublishedComponentsPost,
} from "@/api/sdk.gen";
import type {
  ComponentReferenceInput,
  HttpValidationError,
} from "@/api/types.gen";
// import { hydrateComponentReference } from "@/services/componentService";
import type { ComponentFolder } from "@/types/componentLibrary";
import { type ComponentReference, hasValidDigest } from "@/utils/componentSpec";
import type { ComponentReferenceWithSpec } from "@/utils/componentStore";

import { isValidFilterRequest, type LibraryFilterRequest } from "../types";
import {
  DuplicateComponentError,
  InvalidComponentReferenceError,
  type Library,
} from "./types";

function getComponentReferenceInput(component: ComponentReferenceWithSpec) {
  return {
    name: component.name,
    digest: component.digest,
    url: component.url,
    spec: component.spec,
    text: component.text,
  } as ComponentReferenceInput;
}

class BackendValidationError extends Error {
  name = "BackendValidationError";

  constructor(
    message: string,
    readonly validationError: HttpValidationError | undefined,
  ) {
    super(message);
  }
}

class BackendLibraryError extends Error {
  name = "BackendLibraryError";

  constructor(message: string) {
    super(message);
  }
}

export class PublishedComponentsLibrary implements Library {
  #knownDigests: Set<string> = new Set();

  constructor() {
    // load known digests from storage
    // todo: prefetch components?
  }

  async hasComponent(component: ComponentReference): Promise<boolean> {
    if (!hasValidDigest(component)) {
      throw new InvalidComponentReferenceError(component);
    }

    if (this.#knownDigests.has(component.digest)) {
      return true;
    }

    const getComponentResult = await getApiComponentsDigestGet({
      path: {
        digest: component.digest,
      },
    });

    if (getComponentResult.response.status !== 200) {
      switch (getComponentResult.response.status) {
        case 404:
          return false;
        default:
          console.error(getComponentResult.error);
          throw new BackendLibraryError(
            `Unexpected status code: ${getComponentResult.response.status}`,
          );
      }
    }

    if (!getComponentResult.data) {
      throw new BackendLibraryError("No data returned from server");
    }

    const hydratedComponent = await hydrateComponentReference({
      digest: component.digest,
      text: getComponentResult.data.text,
      url: component.url,
    });

    if (!hydratedComponent) {
      throw new BackendLibraryError(
        `Failed to hydrate component: ${component.digest}`,
      );
    }

    this.#knownDigests.add(hydratedComponent.digest);

    return true;
  }

  /**
   * Add a component to the library.
   *
   * @param component - The component to add.
   * @throws {InvalidComponentReferenceError} If the component is invalid.
   * @throws {DuplicateComponentError} If the component already exists.
   */
  async addComponent(component: ComponentReference): Promise<void> {
    if (hasValidDigest(component) && this.#knownDigests.has(component.digest)) {
      throw new DuplicateComponentError(component);
    }

    const hydratedComponent = await hydrateComponentReference(component);

    if (!hydratedComponent) {
      throw new InvalidComponentReferenceError(component);
    }

    const publishComponentResult = await publishApiPublishedComponentsPost({
      body: getComponentReferenceInput(hydratedComponent),
    }).catch((error) => {
      console.error(error);
      throw error;
    });

    if (publishComponentResult.response.status !== 200) {
      switch (publishComponentResult.response.status) {
        case 422:
          // todo handle returned errors properly
          console.error(publishComponentResult.error);
          throw new BackendValidationError(
            `Invalid component`,
            publishComponentResult.error,
          );
        default:
          // todo handle errors properly
          console.error(publishComponentResult.error);
          throw new BackendLibraryError(
            `Unexpected status code: ${publishComponentResult.response.status}`,
          );
      }
    }

    this.#knownDigests.add(hydratedComponent.digest);
  }

  async removeComponent(): Promise<void> {
    /**
     * Deprecating process
     */
    throw new Error("Method not implemented.");
  }

  async getComponents(filter: LibraryFilterRequest): Promise<ComponentFolder> {
    const listComponentsResult = isValidFilterRequest(filter)
      ? await listApiPublishedComponentsGet({
          query: {
            name_substring: filter.filters?.includes("name")
              ? filter.searchTerm
              : undefined,
            // todo: update this to use the author filter
            // published_by_substring: filter.filters.includes("author")
            //   ? filter.searchTerm
            //   : undefined,
            include_deprecated: false,
          },
        })
      : await listApiPublishedComponentsGet({});

    if (listComponentsResult.response.status !== 200) {
      throw new BackendLibraryError(
        `Unexpected status code: ${listComponentsResult.response.status}`,
      );
    }

    if (!listComponentsResult.data) {
      throw new BackendLibraryError("No data returned from server");
    }

    const components = (
      listComponentsResult.data.published_components ?? []
    ).map(
      (component) =>
        ({
          digest: component.digest,
          name: component.name,
          url: component.url,
          // todo: handle this?
          allow_implicit_import: true,
          published_by: component.published_by,
        }) as ComponentReference,
    );

    return {
      name: "Published Components",
      components,
      folders: [],
    };
  }
}
