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
    actions: [
      {
        action: "executeRebalance",
        target: "pool",
        summary: "Execute Base lending allocation legs through the bounded rebalance contract.",
        payload: {
          reason: "dephalanx_live_p0",
          riskNotes: [`risk_mode:${input.mandate.riskMode}`],
          operations: legs
            .filter((leg) => leg.type === "deposit" && leg.chain === "base")
            .map((leg) => ({
              action: "deposit",
              payload: {
                chain: leg.chain,
                investmentId: `dephalanx-${leg.chain}-${leg.protocol}`,
                token: leg.asset,
                amount: leg.amount,
                platformId: leg.protocol === "aave" ? "aave-v3" : "morpho-vaults",
                _allocationSegment: leg.protocol,
              },
            })),
        },
      },
      ...legs
        .filter((leg) => leg.type === "approval_required")
        .map((leg) => ({
          action: "depositLpPosition",
          target: leg.protocol === "uniswap" ? "uniswap-v3" : leg.protocol,
          summary: "Attempt the approval-gated Uniswap LP leg through Phalanx-Skill.",
          payload: {
            protocol: "uniswap-v3",
            chain: leg.chain,
            investmentId: `dephalanx-${leg.chain}-${leg.protocol}-lp`,
            token: leg.asset,
            tokenSecondary: leg.pairedAsset ?? "WETH",
            amount: "2",
            amountSecondary: "0.003",
            poolAddress: "0x1111111111111111111111111111111111111111",
            positionType: "v3",
          },
        })),
      ...legs
        .filter((leg) => leg.type === "deposit" && leg.chain === "xlayer")
        .map((leg) => ({
          action: "deposit",
          target: "pool",
          summary: "Deposit the X Layer sidecar allocation through the bounded lending path.",
          payload: {
            chain: leg.chain,
            investmentId: `dephalanx-${leg.chain}-${leg.protocol}`,
            token: leg.asset,
            amount: leg.amount,
            platformId: "aave-v3",
          },
        })),
    ],
  };
}
