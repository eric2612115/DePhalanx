import type { OperatorIntent } from "./intent-schema.js";

export interface BrainAdapterIncomingPayload {
  readonly chat_id?: string;
  readonly user_id?: string;
  readonly text?: string;
  readonly channel?: string;
}

export interface BrainAdapter {
  normalizeIncoming(payload: BrainAdapterIncomingPayload): Promise<OperatorIntent>;
}
