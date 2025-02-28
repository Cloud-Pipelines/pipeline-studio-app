/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useState } from "react";
import type { DownloadDataType } from "../cacheUtils";
import { downloadDataWithCache } from "../cacheUtils";
import type { ComponentReference } from "../componentSpec";
import {
  isComponentDbEmpty,
  refreshComponentDb,
  searchComponentsByName,
} from "../github";
import DraggableComponent from "./DraggableComponent";

interface ComponentSearchProps {
  componentFeedUrls?: string[];
  gitHubSearchLocations?: string[];
  downloadData: DownloadDataType;
}

const SearchPanel = ({
  componentFeedUrls,
  gitHubSearchLocations,
  downloadData = downloadDataWithCache,
}: ComponentSearchProps) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [firstTime, setFirstTime] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ComponentReference[]>([]);

  const onQueryChange = (e: any) => {
    setQuery(e.target.value);
  };

  async function fetchData(query: string) {
    // If the DB is populated, return results immediately, then refresh the DB and update the results.
    try {
      if (!(await isComponentDbEmpty())) {
        const componentRefs = await searchComponentsByName(query);
        setIsLoaded(true);
        setItems(componentRefs);
      } else {
        console.debug("Component DB is empty. Need to populate the DB first.");
      }
      await refreshComponentDb(
        {
          ComponentFeedUrls: componentFeedUrls,
          GitHubSearchLocations: gitHubSearchLocations,
        },
        downloadData,
      );
      setIsLoaded(true);
      const componentRefs = await searchComponentsByName(query);
      setItems(componentRefs);
    } catch (error: any) {
      setError(error.message);
    }
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query !== "") {
      setFirstTime(false);
      fetchData(query);
    }
    (window as any).gtag?.("event", "ComponentSearch_search", {});
  };

  let results = <span></span>;
  if (firstTime) {
    results = <div>Enter search query</div>;
  } else if (error !== undefined) {
    results = <div>Error: {error}</div>;
  } else if (!firstTime && !isLoaded) {
    results = <div>Searching...</div>;
  } else if (items !== undefined) {
    const componentElements = items.map((componentRef) => (
      <DraggableComponent
        key={componentRef.digest ?? componentRef.url}
        componentReference={componentRef}
      />
    ));
    results = <>{componentElements}</>;
  }
  return (
    <div className="nodeList">
      <form onSubmit={onSubmit}>
        <input type="search" placeholder="XGBoost" onChange={onQueryChange} />
        <input type="submit" />
      </form>
      <div>{results}</div>
    </div>
  );
};

export default SearchPanel;
