import type { MandateProfile } from "../mandate/types.js";
import type { ApprovalResponseIntent, OperatorIntent } from "../brain/intent-schema.js";
import { PhalanxSkillClient } from "../bridge/phalanx-skill-client.js";
import { filterOpportunities } from "../phalanx-layer/opportunity-filter.js";
import { buildRiskPreferenceModel } from "../phalanx-layer/risk-preference-model.js";
import { compileAllocationPlan } from "../phalanx-layer/action-compiler.js";
import { queryOmRateOpportunities, type OmRateQueryMode, type RawOmRateOpportunity } from "../omrate/omrate-client.js";
import { renderTelegramApproval } from "../channels/telegram/approval-renderer.js";
import { renderTelegramResult } from "../channels/telegram/result-renderer.js";

export interface LiveP0TurnResult {
  readonly timeline: readonly string[];
  readonly outboundMessage: string;
  readonly status: "pending_approval" | "completed" | "failed";
}

function renderFinalSummary(
  result: Extract<Awaited<ReturnType<PhalanxSkillClient["execute"]>>, { status: "completed" | "failed" }>,
): string {
  if (result.status === "failed") {
    return renderTelegramResult({
      executionId: "exec-failed",
      status: "failed",
      message: result.message,
    });
  }
  return renderTelegramResult({
    executionId: result.executionId,
    status: "completed",
  });
}

export async function runInitialLiveP0Turn(input: {
  readonly intent: OperatorIntent;
  readonly mandate: MandateProfile;
  readonly client: PhalanxSkillClient;
  readonly opportunities?: readonly RawOmRateOpportunity[];
  readonly omRateBaseUrl?: string;
  readonly omRatePath?: string;
  readonly omRateMode?: OmRateQueryMode;
}): Promise<LiveP0TurnResult> {
  const timeline: string[] = ["intent_received"];
  const omrate = await queryOmRateOpportunities({
    mode: input.omRateMode ?? "x402_optional",
    raw: input.opportunities,
    baseUrl: input.omRateBaseUrl,
    path: input.omRatePath,
  });
  timeline.push("omrate_requested");

  const riskModel = buildRiskPreferenceModel(input.mandate);
  const filtered = filterOpportunities(omrate.opportunities, input.mandate, riskModel);
  const bundle = compileAllocationPlan({
    mandate: input.mandate,
    filtered,
    capitalByChain: { base: 20, xlayer: 2 },
  });
  timeline.push("allocation_compiled");

  const first = await input.client.execute({ actions: bundle.actions });
  if (first.status === "pending_approval") {
    timeline.push("pending_approval_rendered");
    return {
      timeline,
      status: "pending_approval",
      outboundMessage: renderTelegramApproval({
        message: first.message,
        approvalId: first.approvalId,
      }),
    };
  }

  timeline.push("result_report_rendered");
  return {
    timeline,
    status: first.status === "completed" ? "completed" : "failed",
    outboundMessage: renderFinalSummary(first),
  };
}

export async function runApprovalLiveP0Turn(input: {
  readonly intent: ApprovalResponseIntent;
  readonly client: PhalanxSkillClient;
}): Promise<LiveP0TurnResult> {
  const timeline = ["intent_received"];
  const resumed = await input.client.resumePendingApproval({
    approvalId: input.intent.approvalId,
    resumeToken: input.intent.resumeToken,
    approved: input.intent.approved,
  });
  if (resumed.status === "pending_approval") {
    throw new Error("unexpected_pending_approval_on_resume");
  }
  timeline.push("approval_resumed", "result_report_rendered");
  return {
    timeline,
    status: resumed.status === "completed" ? "completed" : "failed",
    outboundMessage: renderFinalSummary(resumed),
  };
}
