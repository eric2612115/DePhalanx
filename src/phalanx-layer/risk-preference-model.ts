import type { MandateProfile } from "../mandate/types.js";

export interface RiskPreferenceModel {
  readonly protocolOrder: readonly string[];
  readonly approvalRequiredProtocols: ReadonlySet<string>;
}

export function buildRiskPreferenceModel(mandate: MandateProfile): RiskPreferenceModel {
  const protocolOrder = mandate.riskMode === "aggressive"
    ? ["morpho", "aave", "uniswap"]
    : ["aave", "morpho", "uniswap"];
  return {
    protocolOrder,
    approvalRequiredProtocols: new Set(
      Object.entries(mandate.approvalRequirements)
        .filter(([, required]) => required)
        .map(([protocol]) => protocol),
    ),
  };
}
