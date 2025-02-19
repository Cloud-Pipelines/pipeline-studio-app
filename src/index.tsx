/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
//import { migrateUserData } from "./userDataMigration"

// Migration is now disabled.
// After 2 months of auto-migration, the redirect from cloud-pipelines.github.io
// to cloud-pipelines.net was changed to hard redirect.
// Accessing the data stored for cloud-pipelines.github.io is now impossible.
// try {
//   migrateUserData();
// } catch (err) {
//   console.error(err);
// }

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Example query hook
export function useImages(url: string) {
  return useQuery({
    queryKey: ['images', url],
    queryFn: async () => {
      const response = await fetch(url)
      return response.blob()
    }
  })
}
