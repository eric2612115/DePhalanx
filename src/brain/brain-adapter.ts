import type { OperatorIntent } from "./intent-schema.js";
import type { RawOmRateOpportunity } from "../omrate/omrate-client.js";

export interface BrainAdapterIncomingPayload {
  readonly event?: string;
  readonly timestamp?: string;
  readonly signature?: string;
  readonly data?: {
    readonly channel?: string;
    readonly user?: string;
    readonly userId?: string;
    readonly chatId?: string;
    readonly to?: string;
    readonly message?: string;
    readonly text?: string;
    readonly sessionId?: string;
    readonly opportunities?: readonly RawOmRateOpportunity[];
  };
  readonly chat_id?: string;
  readonly user_id?: string;
  readonly text?: string;
  readonly channel?: string;
}

export interface BrainAdapter {
  normalizeIncoming(payload: BrainAdapterIncomingPayload): Promise<OperatorIntent>;
}
