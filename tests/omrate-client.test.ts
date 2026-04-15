import { describe, expect, it } from "vitest";

import { normalizeOpportunitySet, queryOmRateOpportunities } from "../src/omrate/omrate-client.js";

describe("DePhalanx OmRate client", () => {
  it("represents plain, x402_optional, and x402_required opportunity states", async () => {
    await expect(queryOmRateOpportunities({ mode: "plain", raw: [] })).resolves.toMatchObject({ mode: "plain", opportunities: [] });
    await expect(queryOmRateOpportunities({ mode: "x402_optional", raw: [] })).resolves.toMatchObject({ mode: "x402_optional" });
    await expect(queryOmRateOpportunities({ mode: "x402_required", raw: [] })).resolves.toMatchObject({ mode: "x402_required" });
  });

  it("normalizes raw opportunities before PhalanxLayer consumes them", () => {
    const result = normalizeOpportunitySet([
      { protocol_name: "Aave", chain_name: "Base", asset_symbol: "USDC", apy: "0.08", risk_rank: 1 },
      { protocol_name: "Morpho", chain_name: "Base", asset_symbol: "USDC", apy: "0.11", risk_rank: 2 },
    ]);

    expect(result).toEqual([
      { protocol: "aave", chain: "base", asset: "USDC", maxApy: 0.08, riskRank: 1 },
      { protocol: "morpho", chain: "base", asset: "USDC", maxApy: 0.11, riskRank: 2 },
    ]);
  });
});
