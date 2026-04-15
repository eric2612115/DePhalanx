export interface OpportunityQuote {
  readonly protocol: string;
  readonly chain: string;
  readonly asset: string;
  readonly pairedAsset?: string;
  readonly maxApy: number;
  readonly riskRank: number;
}

export interface CapitalByChain {
  readonly base: number;
  readonly xlayer: number;
}
