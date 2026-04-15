import "dotenv/config";

import { createHmac } from "node:crypto";

const host = process.env.DEPHALANX_BIND_HOST?.trim() || "127.0.0.1";
const port = Number(process.env.DEPHALANX_PORT?.trim() || "4319");
const secret = process.env.DEPHALANX_OPENCLAW_WEBHOOK_SECRET?.trim() || "";
const baseUrl = `http://${host}:${port}`;

function buildSignature(body: string): string | undefined {
  if (!secret) {
    return undefined;
  }
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

async function postOpenClawEvent(message: string): Promise<{ ok: boolean; deliveryMode: string; text: string }> {
  const body = JSON.stringify({
    event: "message.received",
    timestamp: new Date().toISOString(),
    data: {
      channel: "telegram",
      user: "smoke-operator",
      chatId: "smoke-chat",
      sessionId: "smoke-session",
      message,
    },
  });
  const response = await fetch(`${baseUrl}/openclaw/events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(buildSignature(body) ? { "x-openclaw-signature": buildSignature(body)! } : {}),
    },
    body,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Smoke request failed: ${response.status} ${errorBody}`);
  }
  return (await response.json()) as { ok: boolean; deliveryMode: string; text: string };
}

async function main(): Promise<void> {
  const health = await fetch(`${baseUrl}/healthz`);
  if (!health.ok) {
    throw new Error(`Ingress health check failed: ${health.status}`);
  }

  const first = await postOpenClawEvent("funds are ready");
  process.stdout.write(`FIRST_RESPONSE\n${first.text}\n\n`);

  const approvalMatch = /Approval ID: ([^\n]+)/.exec(first.text);
  if (!approvalMatch) {
    throw new Error("Smoke flow did not return an approval ID.");
  }

  const second = await postOpenClawEvent(`approve ${approvalMatch[1]}`);
  process.stdout.write(`SECOND_RESPONSE\n${second.text}\n`);
}

void main();
