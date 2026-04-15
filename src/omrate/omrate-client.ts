import type { OpportunityQuote } from "../portfolio/portfolio-snapshot.js";

export type OmRateQueryMode = "plain" | "x402_optional" | "x402_required";

export interface RawOmRateOpportunity {
  readonly protocol_name: string;
  readonly chain_name: string;
  readonly asset_symbol: string;
  readonly apy: string | number;
  readonly risk_rank: number;
}

export interface OmRateOpportunityResult {
  readonly mode: OmRateQueryMode;
  readonly opportunities: OpportunityQuote[];
}

export function normalizeOpportunitySet(raw: readonly RawOmRateOpportunity[]): OpportunityQuote[] {
  return raw.map((item) => ({
    protocol: item.protocol_name.trim().toLowerCase(),
    chain: item.chain_name.trim().toLowerCase(),
    asset: item.asset_symbol.trim().toUpperCase(),
    maxApy: typeof item.apy === "number" ? item.apy : Number(item.apy),
    riskRank: item.risk_rank,
  }));
}

export async function queryOmRateOpportunities(input: {
  readonly mode: OmRateQueryMode;
  readonly raw: readonly RawOmRateOpportunity[];
}): Promise<OmRateOpportunityResult> {
  return {
    mode: input.mode,
    opportunities: normalizeOpportunitySet(input.raw),
  };
}
