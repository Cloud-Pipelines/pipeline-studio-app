import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:8000/openapi.json",
  output: "src/api",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      bundle: false,
    },
    "@hey-api/typescript",
    "@hey-api/sdk",
  ],
});
