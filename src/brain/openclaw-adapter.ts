import type { BrainAdapter, BrainAdapterIncomingPayload } from "./brain-adapter.js";
import type { OperatorIntent } from "./intent-schema.js";

export class OpenClawAdapter implements BrainAdapter {
  async normalizeIncoming(payload: BrainAdapterIncomingPayload): Promise<OperatorIntent> {
    return {
      kind: "operator_message",
      operatorId: payload.user_id?.trim() || "unknown-operator",
      channel: payload.channel?.trim() || "unknown",
      message: payload.text?.trim() || "",
    };
  }
}
