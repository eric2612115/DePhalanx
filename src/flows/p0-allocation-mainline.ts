import type { MandateProfile } from "../mandate/types.js";
import { OpenClawAdapter } from "../brain/openclaw-adapter.js";
import { PhalanxSkillClient } from "../bridge/phalanx-skill-client.js";
import { filterOpportunities } from "../phalanx-layer/opportunity-filter.js";
import { buildRiskPreferenceModel } from "../phalanx-layer/risk-preference-model.js";
import { compileAllocationPlan } from "../phalanx-layer/action-compiler.js";
import { queryOmRateOpportunities, type RawOmRateOpportunity } from "../omrate/omrate-client.js";
import { renderTelegramApproval } from "../channels/telegram/approval-renderer.js";
import { renderTelegramResult } from "../channels/telegram/result-renderer.js";
import { buildP0ProofArtifact } from "../replay/p0-proof.js";

export interface P0MainlineInput {
  readonly message: string;
  readonly mandate: MandateProfile;
  readonly opportunities: readonly RawOmRateOpportunity[];
}

export interface P0MainlineResult {
  readonly timeline: readonly string[];
  readonly approvalPrompt: string;
  readonly finalSummary: string;
  readonly proof: ReturnType<typeof buildP0ProofArtifact>;
}

export async function runP0AllocationMainline(input: P0MainlineInput): Promise<P0MainlineResult> {
  const timeline: string[] = [];
  const adapter = new OpenClawAdapter();
  const client = new PhalanxSkillClient({
    executeBundle: async (bundle) => {
      if (bundle.resume?.approved) {
        return { status: "completed", executionId: "exec-approved" } as const;
      }
      return {
        status: "pending_approval",
        approvalId: "approval-uniswap",
        resumeToken: "resume-uniswap",
        message: "Uniswap allocation requires approval",
      } as const;
    },
  });

  await adapter.normalizeIncoming({ user_id: input.mandate.userId, text: input.message, channel: "telegram" });
  timeline.push("intent_received");

  const omrate = await queryOmRateOpportunities({ mode: "x402_optional", raw: input.opportunities });
  timeline.push("omrate_requested");

  const riskModel = buildRiskPreferenceModel(input.mandate);
  const filtered = filterOpportunities(omrate.opportunities, input.mandate, riskModel);
  const bundle = compileAllocationPlan({
    mandate: input.mandate,
    filtered,
    capitalByChain: { base: 20, xlayer: 2 },
  });
  timeline.push("allocation_compiled");

  const first = await client.execute({ actions: bundle.actions });
  if (first.status !== "pending_approval") {
    throw new Error("expected_pending_approval");
  }

  const approvalPrompt = renderTelegramApproval({
    protocol: "Uniswap",
    chain: "base",
    amount: "4",
    asset: "USDC",
  });
  timeline.push("pending_approval_rendered");

  const resumed = await client.resumePendingApproval({
    approvalId: first.approvalId,
    resumeToken: first.resumeToken,
    approved: true,
  });
  if (resumed.status !== "completed") {
    throw new Error("expected_completed_resume");
  }
  timeline.push("approval_resumed");

  const finalSummary = renderTelegramResult({
    executionId: resumed.executionId,
    actionCount: bundle.actions.length,
  });
  timeline.push("result_report_rendered");

  return {
    timeline,
    approvalPrompt,
    finalSummary,
    proof: buildP0ProofArtifact({
      timeline,
      approvalPrompt,
      finalSummary,
    }),
  };
}
