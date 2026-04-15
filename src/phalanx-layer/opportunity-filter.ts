import type { MandateProfile } from "../mandate/types.js";
import type { OpportunityQuote } from "../portfolio/portfolio-snapshot.js";
import type { RiskPreferenceModel } from "./risk-preference-model.js";

export function filterOpportunities(
  opportunities: readonly OpportunityQuote[],
  mandate: MandateProfile,
  riskModel: RiskPreferenceModel,
): OpportunityQuote[] {
  const allowedProtocols = new Set(
    Object.entries(mandate.protocolPreferences)
      .filter(([, preference]) => preference !== "avoid")
      .map(([protocol]) => protocol),
  );
  const allowedChains = new Set(
    Object.entries(mandate.chainPreferences)
      .filter(([, preference]) => preference !== "avoid")
      .map(([chain]) => chain),
  );

  return opportunities
    .filter((opportunity) => allowedProtocols.has(opportunity.protocol) && allowedChains.has(opportunity.chain))
    .sort((left, right) => {
      const leftPriority = riskModel.protocolOrder.indexOf(left.protocol);
      const rightPriority = riskModel.protocolOrder.indexOf(right.protocol);
      return leftPriority - rightPriority || left.riskRank - right.riskRank;
    });
}
