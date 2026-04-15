export interface DePhalanxConfig {
  readonly brainHost: string;
  readonly openClawBaseUrl: string;
  readonly phalanxSkillBaseUrl: string;
  readonly mandateStorePath: string;
  readonly telegramBotToken?: string;
}

export function loadDePhalanxConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): DePhalanxConfig {
  return {
    brainHost: env.DEPHALANX_BRAIN_HOST?.trim() || "openclaw",
    openClawBaseUrl: env.DEPHALANX_OPENCLAW_BASE_URL?.trim() || "http://127.0.0.1:3001",
    phalanxSkillBaseUrl: env.DEPHALANX_PHALANX_SKILL_BASE_URL?.trim() || "http://127.0.0.1:8787",
    mandateStorePath: env.DEPHALANX_MANDATE_STORE_PATH?.trim() || "./mandates",
    telegramBotToken: env.DEPHALANX_TELEGRAM_BOT_TOKEN?.trim() || undefined,
  };
}
