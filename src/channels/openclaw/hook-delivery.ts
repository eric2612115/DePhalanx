export interface OpenClawDeliveryInput {
  readonly baseUrl: string;
  readonly hookToken?: string;
  readonly channel: string;
  readonly replyTarget: string;
  readonly sessionId?: string;
  readonly text: string;
}

export interface OpenClawDeliveryResult {
  readonly delivered: boolean;
  readonly mode: "openclaw_hook";
  readonly text: string;
}

export async function sendOpenClawHookMessage(input: OpenClawDeliveryInput): Promise<OpenClawDeliveryResult> {
  if (!input.hookToken) {
    throw new Error("OpenClaw hook token is required for live outbound delivery.");
  }

  const response = await fetch(`${input.baseUrl.replace(/\/$/, "")}/hooks/agent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-openclaw-token": input.hookToken,
    },
    body: JSON.stringify({
      message: `Send the following message to the operator exactly as written:\n\n${input.text}`,
      name: "DePhalanx delivery",
      agentId: "dephalanx-live-demo",
      sessionKey: input.sessionId ? `dephalanx:${input.sessionId}` : undefined,
      wakeMode: "now",
      deliver: true,
      channel: input.channel,
      to: input.replyTarget,
      timeoutSeconds: 120,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenClaw hook delivery failed: ${response.status}`);
  }

  return {
    delivered: true,
    mode: "openclaw_hook",
    text: input.text,
  };
}
