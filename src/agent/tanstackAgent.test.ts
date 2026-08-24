import { describe, expect, it } from "vitest";

import {
  BASE_INSTRUCTIONS,
  getResponsesModelOptions,
  omitProxyDefaultModel,
} from "./tanstackAgent";

describe("TanStack agent", () => {
  it("requires interactive entity links in change summaries", () => {
    expect(BASE_INSTRUCTIONS).toContain("[Entity Name](entity://$id)");
    expect(BASE_INSTRUCTIONS).toContain('"## Changes made"');
  });

  it("requests encrypted reasoning for stateless Responses continuations", () => {
    expect(getResponsesModelOptions("gpt-5").include).toEqual([
      "reasoning.encrypted_content",
    ]);
  });

  it("disables reasoning when the model supports it", () => {
    expect(getResponsesModelOptions("gpt-5.5").reasoning).toEqual({
      effort: "none",
    });
  });

  it("does not send unsupported reasoning options to older models", () => {
    expect(getResponsesModelOptions("gpt-5")).not.toHaveProperty("reasoning");
    expect(getResponsesModelOptions("gpt-4.1")).not.toHaveProperty("reasoning");
  });

  it("omits the adapter placeholder when a proxy selects the model", () => {
    const body = omitProxyDefaultModel(
      JSON.stringify({ model: "tangle-proxy-default", input: "Hello" }),
    );

    expect(JSON.parse(String(body))).toEqual({ input: "Hello" });
  });
});
