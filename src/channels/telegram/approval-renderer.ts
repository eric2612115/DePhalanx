import { renderApprovalNarrative } from "../../phalanx-layer/approval-narrative.js";

export function renderTelegramApproval(input: { protocol: string; chain: string; amount: string; asset: string }): string {
  return renderApprovalNarrative(input);
}
