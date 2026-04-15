import type { BoundedSkillAction } from "../brain/intent-schema.js";
import type { MandateProfile } from "../mandate/types.js";
import type { CapitalByChain, OpportunityQuote } from "../portfolio/portfolio-snapshot.js";
import { buildAllocationPlan } from "./allocation-engine.js";
import { buildRiskPreferenceModel } from "./risk-preference-model.js";

export interface CompiledActionBundle {
  readonly actions: readonly BoundedSkillAction[];
}

export function compileAllocationPlan(input: {
  readonly mandate: MandateProfile;
  readonly filtered: readonly OpportunityQuote[];
  readonly capitalByChain: CapitalByChain;
}): CompiledActionBundle {
  const riskModel = buildRiskPreferenceModel(input.mandate);
  const legs = buildAllocationPlan({ ...input, riskModel });
  return {
    actions: legs.map((leg) =>
      leg.type === "deposit"
        ? {
            type: leg.protocol === "aave" ? "deposit_aave" : "deposit_morpho",
            chain: leg.chain,
            asset: leg.asset,
            amount: leg.amount,
          }
        : {
            type: "request_uniswap_allocation_approval",
            chain: leg.chain,
            asset: leg.asset,
            amount: leg.amount,
          },
    ),
  };
}
