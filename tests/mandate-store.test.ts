import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FileMandateStore } from "../src/mandate/store.js";

describe("mandate store", () => {
  it("persists and reloads a structured mandate profile", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dephalanx-mandates-"));
    const store = new FileMandateStore(dir);

    await store.save("user-1", {
      userId: "user-1",
      riskMode: "balanced",
      protocolPreferences: { aave: "prefer", morpho: "allow", uniswap: "approval_required" },
      chainPreferences: { base: "prefer", xlayer: "allow" },
      allocationCaps: { aave: 0.5, morpho: 0.4, uniswap: 0.2 },
      approvalRequirements: { uniswap: true },
      automationLevel: "supervised",
      lastUpdatedSource: "operator_message",
    });

    await expect(store.load("user-1")).resolves.toEqual(
      expect.objectContaining({
        riskMode: "balanced",
        protocolPreferences: expect.objectContaining({ aave: "prefer" }),
        chainPreferences: expect.objectContaining({ xlayer: "allow" }),
        approvalRequirements: expect.objectContaining({ uniswap: true }),
      }),
    );
  });
});
