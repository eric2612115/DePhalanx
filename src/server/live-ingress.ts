import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import type { BrainAdapterIncomingPayload } from "../brain/brain-adapter.js";

export interface LiveIngressHandler {
  handleOpenClawPayload(payload: BrainAdapterIncomingPayload): Promise<{
    readonly ok: boolean;
    readonly deliveryMode: string;
    readonly text: string;
  }>;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function verifySignature(rawBody: string, actual: string | undefined, secret: string | undefined): boolean {
  if (!secret) {
    return true;
  }
  if (!actual) {
    return false;
  }
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

export function createLiveIngressServer(input: {
  readonly host: string;
  readonly port: number;
  readonly openClawWebhookSecret?: string;
  readonly handler: LiveIngressHandler;
}): Server {
  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/healthz") {
      writeJson(response, 200, { ok: true, service: "dephalanx-live-ingress" });
      return;
    }

    if (request.method !== "POST" || request.url !== "/openclaw/events") {
      writeJson(response, 404, { ok: false, code: "NOT_FOUND" });
      return;
    }

    try {
      const rawBody = await readBody(request);
      const providedSignature =
        (typeof request.headers["x-openclaw-signature"] === "string" && request.headers["x-openclaw-signature"]) ||
        undefined;
      if (!verifySignature(rawBody, providedSignature, input.openClawWebhookSecret)) {
        writeJson(response, 401, { ok: false, code: "INVALID_SIGNATURE" });
        return;
      }

      const payload = JSON.parse(rawBody) as BrainAdapterIncomingPayload;
      const result = await input.handler.handleOpenClawPayload(payload);
      writeJson(response, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeJson(response, 500, { ok: false, code: "LIVE_INGRESS_ERROR", message });
    }
  }).listen(input.port, input.host);
}
