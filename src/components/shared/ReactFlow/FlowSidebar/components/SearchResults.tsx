import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  generateDigest,
  parseComponentData,
} from "@/services/componentService";
import type { ComponentSpec } from "@/utils/componentSpec";
import { getAllComponents, getAllUserComponents } from "@/utils/localforge";
import { containsSearchTerm } from "@/utils/searchUtils";

import { ComponentMarkup } from "./ComponentItem";

interface SearchResultsProps {
  searchTerm: string;
}

interface ComponentData {
  digest: string;
  url: string;
  data: ComponentSpec;
}

const SearchResults = ({ searchTerm }: SearchResultsProps) => {
  const [matchedComponents, setMatchedComponents] = useState<ComponentData[]>(
    [],
  );
  const [matchedUserComponents, setMatchedUserComponents] = useState<
    ComponentData[]
  >([]);

  const { data: components, isLoading } = useQuery({
    queryKey: ["get-all-components"],
    queryFn: getAllComponents,
  });

  const { data: userComponents, isLoading: isLoadingUserComponents } = useQuery(
    {
      queryKey: ["get-all-user-components"],
      queryFn: getAllUserComponents,
    },
  );

  useEffect(() => {
    if (!components) return;

    const fetchMatchedComponents = async () => {
      const results: ComponentData[] = [];

      for (const component of components) {
        const parsedSpec = parseComponentData(component.data);
        if (parsedSpec && containsSearchTerm(parsedSpec.name, searchTerm)) {
          const digest = await generateDigest(component.data);
          results.push({
            digest,
            url: component.url,
            data: {
              ...parsedSpec,
              name: parsedSpec.name || "Unnamed Component",
            },
          });
        }
      }

      setMatchedComponents(results);
    };

    fetchMatchedComponents();
  }, [components, searchTerm]);

  useEffect(() => {
    if (!userComponents) return;

    const fetchMatchedUserComponents = async () => {
      const results: ComponentData[] = [];

      for (const userComponent of userComponents) {
        if (containsSearchTerm(userComponent.name, searchTerm)) {
          results.push({
            digest: userComponent.componentRef.digest || "",
            url: userComponent.componentRef.url || "",
            data: userComponent.componentRef.spec || {
              name: userComponent.name,
              implementation: {
                graph: {
                  tasks: {},
                },
              },
            },
          });
        }
      }

      setMatchedUserComponents(results);
    };

    fetchMatchedUserComponents();
  }, [userComponents, searchTerm]);

  if (isLoading || isLoadingUserComponents) return <div>Loading...</div>;

  const hasResults =
    matchedComponents.length > 0 || matchedUserComponents.length > 0;
  if (!hasResults) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        No components matching &ldquo;{searchTerm}&rdquo;
      </div>
    );
  }

  const totalResults = matchedComponents.length + matchedUserComponents.length;

  return (
    <div className="py-2">
      <div className="px-4 pb-2 text-sm font-medium text-gray-600 border-b">
        Search Results ({totalResults})
      </div>
      <div className="mt-1">
        {matchedUserComponents.length > 0 && (
          <>
            {/* User component section header if both types exist */}
            {matchedComponents.length > 0 && (
              <div className="px-4 py-1 text-xs font-medium text-gray-500">
                User Components
              </div>
            )}
            {/* User component results */}
            {matchedUserComponents.map((component, index) => (
              <ComponentMarkup
                key={`user-${index}`}
                url={component.url}
                componentSpec={component.data}
                componentDigest={component.digest}
                componentText={JSON.stringify(component.data)}
                displayName={component.data.name!}
              />
            ))}
          </>
        )}

        {matchedComponents.length > 0 && (
          <>
            {/* Library component section header if both types exist */}
            {matchedUserComponents.length > 0 && (
              <div className="px-4 py-1 mt-2 text-xs font-medium text-gray-500">
                Library Components
              </div>
            )}
            {/* Library component results */}
            {matchedComponents.map((component, index) => (
              <ComponentMarkup
                key={`lib-${index}`}
                url={component.url}
                componentSpec={component.data}
                componentDigest={component.digest}
                componentText={JSON.stringify(component.data)}
                displayName={component.data.name!}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
