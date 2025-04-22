import { ComponentItemFromUrl, ComponentMarkup } from "./ComponentItem";
import UserComponentItem from "./UserComponentItem";

interface SearchResultsProps {
  folders: any[];
  searchTerm: string;
}

interface MatchedComponent {
  name: string;
  url?: string;
  spec?: any;
  digest?: string;
  text?: string;
  isUserComponent: boolean;
  folderPath?: string; // Track folder path for display context
}

const SearchResults = ({ folders, searchTerm }: SearchResultsProps) => {
  if (!searchTerm) return null;

  const findMatchingComponents = (
    folderList: any[],
    isUserFolder = false,
    parentPath = ""
  ): MatchedComponent[] => {
    let results: MatchedComponent[] = [];

    for (const folder of folderList) {
      const currentPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name;

      // Check components in this folder
      if (folder.components && folder.components.length > 0) {
        for (const component of folder.components) {
          let componentName = "";
          let fullUrl = "";

          // For user components with spec
          if (component.spec && component.spec.name) {
            componentName = component.spec.name;
          }
          // For components with URLs, extract just the component name
          else if (component.url) {
            fullUrl = component.url;
            componentName = component.url.split("/").pop()?.replace(".yaml", "") || "";
          }

          // Check if the component name or URL contains the search term
          if ((componentName && componentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (fullUrl && fullUrl.toLowerCase().includes(searchTerm.toLowerCase()))) {
            results.push({
              name: componentName,
              url: component.url,
              spec: component.spec,
              digest: component.digest,
              text: component.text,
              isUserComponent: isUserFolder,
              folderPath: currentPath
            });
          }
        }
      }

      // Check subfolders recursively
      if (folder.folders && folder.folders.length > 0) {
        const subResults = findMatchingComponents(
          folder.folders,
          isUserFolder || !!folder.isUserFolder,
          currentPath
        );
        results = [...results, ...subResults];
      }
    }

    return results;
  };

  const matchingComponents = findMatchingComponents(folders);

  if (matchingComponents.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        No components matching &ldquo;{searchTerm}&rdquo;
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-4 pb-2 text-sm font-medium text-gray-600 border-b">
        Search Results ({matchingComponents.length})
      </div>
      <div className="mt-1">
        {matchingComponents.map((component, index) => {
          const key = `search-result-${index}`;

          // Create a component with additional folder path info
          const componentWithPath = (
            <div>
              {component.spec ? (
                component.isUserComponent ? (
                  <UserComponentItem
                    key={key}
                    url={component.url || ""}
                    fileName={component.name}
                    componentSpec={component.spec}
                    componentDigest={component.digest || ""}
                    componentText={component.text || ""}
                    displayName={component.name}
                    searchTerm={searchTerm}
                  />
                ) : (
                  <ComponentMarkup
                    key={key}
                    url={component.url || ""}
                    componentSpec={component.spec}
                    componentDigest={component.digest || ""}
                    componentText={component.text || ""}
                    displayName={component.name}
                  />
                )
              ) : (
                <ComponentItemFromUrl
                  key={key}
                  url={component.url || ""}
                  searchTerm={searchTerm}
                />
              )}
              {component.folderPath && (
                <div className="text-xs text-gray-500 pl-10 -mt-1 mb-1">
                  {component.folderPath}
                </div>
              )}
            </div>
          );

          return componentWithPath;
        })}
      </div>
    </div>
  );
};

export default SearchResults;
