import { OpenClawAdapter } from "./brain/openclaw-adapter.js";
import { PhalanxSkillClient } from "./bridge/phalanx-skill-client.js";
import { loadDePhalanxConfig, type DePhalanxConfig } from "./config/load-config.js";
import { runP0AllocationMainline } from "./flows/p0-allocation-mainline.js";

export interface DePhalanxApp {
  readonly config: DePhalanxConfig;
  readonly brainAdapter: OpenClawAdapter;
  readonly phalanxSkillClient: PhalanxSkillClient;
}

export async function createDePhalanxApp(config: DePhalanxConfig): Promise<DePhalanxApp> {
  return {
    config,
    brainAdapter: new OpenClawAdapter(),
    phalanxSkillClient: new PhalanxSkillClient({
      executeBundle: async () => ({
        status: "completed",
        executionId: `bridge:${config.phalanxSkillBaseUrl}`,
      }),
    }),
  };
}

export async function main(): Promise<void> {
  const app = await createDePhalanxApp(loadDePhalanxConfig(process.env));

  if (process.argv.includes("--demo-p0")) {
    const demo = await runP0AllocationMainline({
      message: "funds are ready",
      mandate: {
        userId: "demo-operator",
        riskMode: "balanced",
        protocolPreferences: { aave: "prefer", morpho: "allow", uniswap: "approval_required" },
        chainPreferences: { base: "prefer", xlayer: "allow" },
        allocationCaps: { aave: 0.5, morpho: 0.4, uniswap: 0.2 },
        approvalRequirements: { uniswap: true },
        automationLevel: "supervised",
        lastUpdatedSource: "operator_message",
      },
      opportunities: [
        { protocol_name: "Aave", chain_name: "Base", asset_symbol: "USDC", apy: "0.08", risk_rank: 1 },
        { protocol_name: "Morpho", chain_name: "Base", asset_symbol: "USDC", apy: "0.11", risk_rank: 2 },
        { protocol_name: "Uniswap", chain_name: "Base", asset_symbol: "USDC", apy: "0.13", risk_rank: 3 },
        { protocol_name: "Aave", chain_name: "XLayer", asset_symbol: "USDT", apy: "0.07", risk_rank: 1 },
      ],
    });
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "demo_p0",
          brainHost: app.config.brainHost,
          phalanxSkillBaseUrl: app.config.phalanxSkillBaseUrl,
          timeline: demo.timeline,
          approvalPrompt: demo.approvalPrompt,
          finalSummary: demo.finalSummary,
          proof: demo.proof,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "bootstrap",
        brainHost: app.config.brainHost,
        phalanxSkillBaseUrl: app.config.phalanxSkillBaseUrl,
        mandateStorePath: app.config.mandateStorePath,
      },
      null,
      2,
    )}\n`,
  );
}

const isDirectExecution = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectExecution) {
  void main();
}
