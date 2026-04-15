import type { BrainAdapter, BrainAdapterIncomingPayload } from "./brain-adapter.js";
import type { OperatorIntent } from "./intent-schema.js";

function firstString(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function parseApprovalMessage(message: string): { approved: boolean; approvalId: string } | null {
  const match = /^(approve|reject)\s+([a-zA-Z0-9-:_]+)$/i.exec(message.trim());
  if (!match) {
    return null;
  }
  return {
    approved: match[1].toLowerCase() === "approve",
    approvalId: match[2],
  };
}

export class OpenClawAdapter implements BrainAdapter {
  async normalizeIncoming(payload: BrainAdapterIncomingPayload): Promise<OperatorIntent> {
    const message = firstString(payload.data?.message, payload.data?.text, payload.text);
    const operatorId = firstString(payload.data?.userId, payload.data?.user, payload.user_id, payload.chat_id) || "unknown-operator";
    const channel = firstString(payload.data?.channel, payload.channel) || "unknown";
    const replyTarget = firstString(payload.data?.chatId, payload.data?.to, payload.chat_id, payload.data?.user, payload.user_id);
    const sessionId = firstString(payload.data?.sessionId);
    const approval = parseApprovalMessage(message);

    if (approval) {
      return {
        kind: "approval_response",
        operatorId,
        channel,
        replyTarget: replyTarget || operatorId,
        sessionId: sessionId || undefined,
        approvalId: approval.approvalId,
        resumeToken: approval.approvalId,
        approved: approval.approved,
        message,
      };
    }

    return {
      kind: "operator_message",
      operatorId,
      channel,
      replyTarget: replyTarget || operatorId,
      sessionId: sessionId || undefined,
      message,
    };
  }
}
