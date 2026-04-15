import type { MandateProfile } from "../mandate/types.js";
import type { CapitalByChain, OpportunityQuote } from "../portfolio/portfolio-snapshot.js";
import type { RiskPreferenceModel } from "./risk-preference-model.js";

export interface AllocationLeg {
  readonly type: "deposit" | "approval_required";
  readonly protocol: string;
  readonly chain: string;
  readonly asset: string;
  readonly amount: string;
  readonly pairedAsset?: string;
}

export function buildAllocationPlan(input: {
  readonly mandate: MandateProfile;
  readonly filtered: readonly OpportunityQuote[];
  readonly capitalByChain: CapitalByChain;
  readonly riskModel: RiskPreferenceModel;
}): AllocationLeg[] {
  const baseCapital = input.capitalByChain.base;
  const xlayerCapital = input.capitalByChain.xlayer;
  const pick = (chain: string, protocol: string): OpportunityQuote | undefined =>
    input.filtered.find((opportunity) => opportunity.chain === chain && opportunity.protocol === protocol);

  const legs: AllocationLeg[] = [];

  const baseAave = pick("base", "aave");
  if (baseAave) {
    legs.push({ type: "deposit", protocol: "aave", chain: "base", asset: baseAave.asset, amount: String(baseCapital * 0.4) });
  }

  const baseMorpho = pick("base", "morpho");
  if (baseMorpho) {
    legs.push({ type: "deposit", protocol: "morpho", chain: "base", asset: baseMorpho.asset, amount: String(baseCapital * 0.4) });
  }

  const baseApproval = input.filtered.find(
    (opportunity) => opportunity.chain === "base" && input.riskModel.approvalRequiredProtocols.has(opportunity.protocol),
  );
  if (baseApproval) {
    legs.push({
      type: "approval_required",
      protocol: baseApproval.protocol,
      chain: baseApproval.chain,
      asset: baseApproval.asset,
      pairedAsset: baseApproval.pairedAsset,
      amount: String(baseCapital * 0.2),
    });
  }

  const xlayerAave = pick("xlayer", "aave");
  if (xlayerAave) {
    legs.push({ type: "deposit", protocol: "aave", chain: "xlayer", asset: xlayerAave.asset, amount: String(xlayerCapital) });
  }

  return legs;
}
