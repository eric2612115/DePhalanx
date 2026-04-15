import { resolve } from "node:path";

export interface DePhalanxConfig {
  readonly brainHost: string;
  readonly openClawBaseUrl: string;
  readonly openClawHookToken?: string;
  readonly openClawWebhookSecret?: string;
  readonly listenHost: string;
  readonly port: number;
  readonly phalanxSkillCommand: string;
  readonly phalanxSkillArgs: readonly string[];
  readonly phalanxSkillCwd: string;
  readonly phalanxSkillConfigPath?: string;
  readonly mandateStorePath: string;
  readonly omRateBaseUrl: string;
  readonly omRatePath: string;
  readonly omRateMode: "plain" | "x402_optional" | "x402_required";
}

export function loadDePhalanxConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): DePhalanxConfig {
  const skillArgsRaw = env.DEPHALANX_PHALANX_SKILL_ARGS?.trim() || "tsx src/app/skill-runtime-bootstrap.ts";
  return {
    brainHost: env.DEPHALANX_BRAIN_HOST?.trim() || "openclaw",
    openClawBaseUrl: env.DEPHALANX_OPENCLAW_BASE_URL?.trim() || "http://127.0.0.1:18789",
    openClawHookToken: env.DEPHALANX_OPENCLAW_HOOK_TOKEN?.trim() || undefined,
    openClawWebhookSecret: env.DEPHALANX_OPENCLAW_WEBHOOK_SECRET?.trim() || undefined,
    listenHost: env.DEPHALANX_BIND_HOST?.trim() || "127.0.0.1",
    port: Number(env.DEPHALANX_PORT?.trim() || "4319"),
    phalanxSkillCommand: env.DEPHALANX_PHALANX_SKILL_COMMAND?.trim() || "npx",
    phalanxSkillArgs: skillArgsRaw.split(/\s+/).filter(Boolean),
    phalanxSkillCwd: env.DEPHALANX_PHALANX_SKILL_CWD?.trim() || resolve(process.cwd(), "../Phalanx-Skill"),
    phalanxSkillConfigPath: env.DEPHALANX_PHALANX_SKILL_CONFIG_PATH?.trim() || undefined,
    mandateStorePath: env.DEPHALANX_MANDATE_STORE_PATH?.trim() || "./mandates",
    omRateBaseUrl: env.DEPHALANX_OMRATE_BASE_URL?.trim() || "https://api.omrate.com",
    omRatePath: env.DEPHALANX_OMRATE_PATH?.trim() || "/markets?limit=200",
    omRateMode: (env.DEPHALANX_OMRATE_MODE?.trim() as DePhalanxConfig["omRateMode"]) || "x402_optional",
  };
}
