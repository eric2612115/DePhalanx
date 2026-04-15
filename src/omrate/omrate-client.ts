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

interface MarketsListResponse {
  readonly data: ReadonlyArray<{
    readonly protocol: string;
    readonly chain_name: string;
    readonly debt_token: { readonly symbol: string };
    readonly supply_apy?: number | null;
    readonly net_supply_apy?: number | null;
  }>;
}

interface PoolsListResponse {
  readonly data: ReadonlyArray<{
    readonly protocol: string;
    readonly chain_name: string;
    readonly token0: { readonly symbol: string };
    readonly token1: { readonly symbol: string };
    readonly apr_estimate?: number | null;
  }>;
}

function normalizeProtocol(protocol: string): string {
  const value = protocol.trim().toLowerCase();
  if (value.startsWith("aave")) {
    return "aave";
  }
  if (value.startsWith("uniswap")) {
    return "uniswap";
  }
  return value;
}

export function normalizeOpportunitySet(raw: readonly RawOmRateOpportunity[]): OpportunityQuote[] {
  return raw.map((item) => ({
    protocol: normalizeProtocol(item.protocol_name),
    chain: item.chain_name.trim().toLowerCase(),
    asset: item.asset_symbol.trim().toUpperCase(),
    maxApy: typeof item.apy === "number" ? item.apy : Number(item.apy),
    riskRank: item.risk_rank,
  }));
}

function normalizeMarketsPayload(payload: MarketsListResponse): OpportunityQuote[] {
  return payload.data
    .filter((market) => market.debt_token?.symbol)
    .map((market) => ({
      protocol: normalizeProtocol(market.protocol),
      chain: market.chain_name.trim().toLowerCase(),
      asset: market.debt_token.symbol.trim().toUpperCase(),
      maxApy: market.net_supply_apy ?? market.supply_apy ?? 0,
      riskRank: normalizeProtocol(market.protocol) === "aave" ? 1 : 2,
    }));
}

function normalizePoolsPayload(payload: PoolsListResponse): OpportunityQuote[] {
  return payload.data.map((pool) => ({
    protocol: normalizeProtocol(pool.protocol),
    chain: pool.chain_name.trim().toLowerCase(),
    asset: pool.token0.symbol.trim().toUpperCase(),
    pairedAsset: pool.token1.symbol.trim().toUpperCase(),
    maxApy: pool.apr_estimate ?? 0,
    riskRank: 3,
  }));
}

export async function queryOmRateOpportunities(input: {
  readonly mode: OmRateQueryMode;
  readonly raw?: readonly RawOmRateOpportunity[];
  readonly baseUrl?: string;
  readonly path?: string;
}): Promise<OmRateOpportunityResult> {
  if (input.raw) {
    return {
      mode: input.mode,
      opportunities: normalizeOpportunitySet(input.raw),
    };
  }

  const baseUrl = input.baseUrl?.replace(/\/$/, "") || "https://api.omrate.com";
  const path = input.path?.trim() || "/markets?limit=200";
  const poolsPath = "/pools?limit=200";
  const [marketsResponse, poolsResponse] = await Promise.all([
    fetch(`${baseUrl}${path}`),
    fetch(`${baseUrl}${poolsPath}`),
  ]);
  if (!marketsResponse.ok) {
    throw new Error(`OmRate request failed: ${marketsResponse.status}`);
  }
  if (!poolsResponse.ok) {
    throw new Error(`OmRate pools request failed: ${poolsResponse.status}`);
  }
  const markets = (await marketsResponse.json()) as MarketsListResponse;
  const pools = (await poolsResponse.json()) as PoolsListResponse;
  return {
    mode: input.mode,
    opportunities: [...normalizeMarketsPayload(markets), ...normalizePoolsPayload(pools)],
  };
}
