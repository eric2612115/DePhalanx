import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizeOpportunitySet, queryOmRateOpportunities } from "../src/omrate/omrate-client.js";

describe("DePhalanx OmRate client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("normalizes live markets and pools into a single opportunity set", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              protocol: "aave_v3",
              chain_name: "Base",
              debt_token: { symbol: "USDC" },
              net_supply_apy: 0.08,
            },
            {
              protocol: "morpho",
              chain_name: "Base",
              debt_token: { symbol: "USDC" },
              net_supply_apy: 0.11,
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              protocol: "uniswap_v3",
              chain_name: "Base",
              token0: { symbol: "USDC" },
              token1: { symbol: "WETH" },
              apr_estimate: 0.13,
            },
          ],
        }),
      } as Response);

    const result = await queryOmRateOpportunities({
      mode: "x402_optional",
      baseUrl: "https://api.omrate.com",
    });

    expect(result.opportunities).toEqual([
      { protocol: "aave", chain: "base", asset: "USDC", maxApy: 0.08, riskRank: 1 },
      { protocol: "morpho", chain: "base", asset: "USDC", maxApy: 0.11, riskRank: 2 },
      { protocol: "uniswap", chain: "base", asset: "USDC", pairedAsset: "WETH", maxApy: 0.13, riskRank: 3 },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.omrate.com/markets?limit=200");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.omrate.com/pools?limit=200");
  });
});
