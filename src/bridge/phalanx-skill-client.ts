import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  ApprovalResumeInput,
  SkillActionBundle,
  SkillExecutionPendingApproval,
  SkillExecutionResult,
} from "../brain/intent-schema.js";

export interface PhalanxSkillClientDeps {
  readonly executeBundle: (bundle: SkillActionBundle) => Promise<SkillExecutionResult>;
  readonly close?: () => Promise<void>;
}

export interface PhalanxSkillMcpConfig {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env?: Readonly<Record<string, string>>;
}

type ToolFailure = {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
};

type ActionExecuted = {
  readonly kind: "executed";
  readonly adapterResult: unknown;
};

type PendingApproval = {
  readonly kind: "pending_approval";
  readonly approvalId: string;
  readonly resumeToken: string;
  readonly message: string;
};

type ApprovalResolution = {
  readonly kind: "approval_resolution";
  readonly approvalId: string;
  readonly resumeToken: string;
  readonly status: "executed" | "blocked" | "rejected";
  readonly message: string;
  readonly adapterResult?: unknown;
  readonly code?: string;
};

function asToolFailure(value: unknown): ToolFailure | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<ToolFailure>;
  if (candidate.ok === false && typeof candidate.code === "string" && typeof candidate.message === "string") {
    return candidate as ToolFailure;
  }
  return null;
}

function asActionExecuted(value: unknown): ActionExecuted | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<ActionExecuted>;
  if (candidate.kind === "executed") {
    return candidate as ActionExecuted;
  }
  return null;
}

function asPendingApproval(value: unknown): PendingApproval | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<PendingApproval>;
  if (
    candidate.kind === "pending_approval" &&
    typeof candidate.approvalId === "string" &&
    typeof candidate.resumeToken === "string" &&
    typeof candidate.message === "string"
  ) {
    return candidate as PendingApproval;
  }
  return null;
}

function asApprovalResolution(value: unknown): ApprovalResolution | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<ApprovalResolution>;
  if (
    candidate.kind === "approval_resolution" &&
    typeof candidate.approvalId === "string" &&
    typeof candidate.resumeToken === "string" &&
    (candidate.status === "executed" || candidate.status === "blocked" || candidate.status === "rejected") &&
    typeof candidate.message === "string"
  ) {
    return candidate as ApprovalResolution;
  }
  return null;
}

export class PhalanxSkillClient {
  constructor(private readonly deps: PhalanxSkillClientDeps) {}

  async execute(bundle: SkillActionBundle): Promise<SkillExecutionResult> {
    return this.deps.executeBundle(bundle);
  }

  canAutoResume(result: SkillExecutionResult): boolean {
    return result.status !== "pending_approval";
  }

  async resumePendingApproval(input: ApprovalResumeInput): Promise<SkillExecutionResult> {
    return this.deps.executeBundle({
      actions: [],
      resume: input,
    });
  }

  isPendingApproval(result: SkillExecutionResult): result is SkillExecutionPendingApproval {
    return result.status === "pending_approval";
  }

  async close(): Promise<void> {
    await this.deps.close?.();
  }
}

export async function createPhalanxSkillMcpClient(config: PhalanxSkillMcpConfig): Promise<PhalanxSkillClient> {
  const transport = new StdioClientTransport({
    command: config.command,
    args: [...config.args],
    cwd: config.cwd,
    env: config.env ? { ...config.env } : undefined,
    stderr: "pipe",
  });
  const client = new Client({
    name: "dephalanx-live-bridge",
    version: "0.1.0",
  });
  await client.connect(transport);

  return new PhalanxSkillClient({
    executeBundle: async (bundle) => {
      if (bundle.resume) {
        const result = await client.callTool({
          name: "phalanx_approval_decision",
          arguments: {
            approvalId: bundle.resume.approvalId,
            resumeToken: bundle.resume.resumeToken,
            approved: bundle.resume.approved,
          },
        });
        const failure = asToolFailure(result.structuredContent);
        if (failure) {
          return { status: "failed", code: failure.code, message: failure.message };
        }
        const resolution = asApprovalResolution(result.structuredContent);
        if (!resolution) {
          return { status: "failed", code: "INVALID_APPROVAL_RESOLUTION", message: "Skill returned an unknown approval resolution payload." };
        }
        if (resolution.status !== "executed") {
          return {
            status: "failed",
            code: resolution.code ?? `APPROVAL_${resolution.status.toUpperCase()}`,
            message: resolution.message,
          };
        }
        return {
          status: "completed",
          executionId: `resume:${resolution.approvalId}`,
          results: resolution.adapterResult === undefined ? [] : [resolution.adapterResult],
        };
      }

      const results: unknown[] = [];
      for (const action of bundle.actions) {
        const toolResult = await client.callTool({
          name: "phalanx_action",
          arguments: {
            action: action.action,
            target: action.target,
            payload: action.payload,
          },
        });
        const failure = asToolFailure(toolResult.structuredContent);
        if (failure) {
          return { status: "failed", code: failure.code, message: failure.message };
        }
        const pending = asPendingApproval(toolResult.structuredContent);
        if (pending) {
          return {
            status: "pending_approval",
            approvalId: pending.approvalId,
            resumeToken: pending.resumeToken,
            message: pending.message,
          };
        }
        const executed = asActionExecuted(toolResult.structuredContent);
        if (!executed) {
          return { status: "failed", code: "INVALID_ACTION_RESULT", message: "Skill returned an unknown action execution payload." };
        }
        results.push(executed.adapterResult);
      }

      return {
        status: "completed",
        executionId: `exec:${randomUUID()}`,
        results,
      };
    },
    close: async () => {
      await transport.close();
    },
  });
}
