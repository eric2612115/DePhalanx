import "dotenv/config";
import { OpenClawAdapter } from "./brain/openclaw-adapter.js";
import { PhalanxSkillClient, createPhalanxSkillMcpClient } from "./bridge/phalanx-skill-client.js";
import { sendOpenClawHookMessage } from "./channels/openclaw/hook-delivery.js";
import { loadDePhalanxConfig, type DePhalanxConfig } from "./config/load-config.js";
import { FileMandateStore } from "./mandate/store.js";
import { runApprovalLiveP0Turn, runInitialLiveP0Turn } from "./flows/p0-allocation-mainline.js";
import { createLiveIngressServer } from "./server/live-ingress.js";
import type { BrainAdapterIncomingPayload } from "./brain/brain-adapter.js";
import type { MandateProfile } from "./mandate/types.js";

export interface DePhalanxApp {
  readonly config: DePhalanxConfig;
  readonly brainAdapter: OpenClawAdapter;
  readonly phalanxSkillClient: PhalanxSkillClient;
  handleOpenClawPayload(payload: BrainAdapterIncomingPayload): Promise<{
    readonly ok: boolean;
    readonly deliveryMode: string;
    readonly text: string;
  }>;
  close(): Promise<void>;
}

export interface CreateDePhalanxAppDeps {
  readonly phalanxSkillClient?: PhalanxSkillClient;
}

function buildDefaultMandate(userId: string): MandateProfile {
  return {
    userId,
    riskMode: "balanced",
    protocolPreferences: { aave: "prefer", morpho: "allow", uniswap: "approval_required" },
    chainPreferences: { base: "prefer", xlayer: "allow" },
    allocationCaps: { aave: 0.5, morpho: 0.4, uniswap: 0.2 },
    approvalRequirements: { uniswap: true },
    automationLevel: "supervised",
    lastUpdatedSource: "system_default",
  };
}

export async function createDePhalanxApp(
  config: DePhalanxConfig,
  deps: CreateDePhalanxAppDeps = {},
): Promise<DePhalanxApp> {
  const mandateStore = new FileMandateStore(config.mandateStorePath);
  const phalanxSkillClient =
    deps.phalanxSkillClient ??
    (await createPhalanxSkillMcpClient({
      command: config.phalanxSkillCommand,
      args: config.phalanxSkillArgs,
      cwd: config.phalanxSkillCwd,
      env: {
        PHALANX_ENABLE_MCP_STDIO: "1",
        ...(config.phalanxSkillConfigPath ? { PHALANX_CONFIG_PATH: config.phalanxSkillConfigPath } : {}),
      },
    }));
  const brainAdapter = new OpenClawAdapter();

  return {
    config,
    brainAdapter,
    phalanxSkillClient,
    async handleOpenClawPayload(payload) {
      const intent = await brainAdapter.normalizeIncoming(payload);
      const mandate = (await mandateStore.load(intent.operatorId)) ?? buildDefaultMandate(intent.operatorId);
      await mandateStore.save(intent.operatorId, mandate);

      const turn =
        intent.kind === "approval_response"
          ? await runApprovalLiveP0Turn({
              intent,
              client: phalanxSkillClient,
            })
          : await runInitialLiveP0Turn({
              intent,
              mandate,
              client: phalanxSkillClient,
              opportunities: payload.data?.opportunities,
              omRateBaseUrl: config.omRateBaseUrl,
              omRatePath: config.omRatePath,
              omRateMode: config.omRateMode,
            });

      const delivery = await sendOpenClawHookMessage({
        baseUrl: config.openClawBaseUrl,
        hookToken: config.openClawHookToken,
        channel: intent.channel,
        replyTarget: intent.replyTarget,
        sessionId: intent.sessionId,
        text: turn.outboundMessage,
      });

      return {
        ok: true,
        deliveryMode: delivery.mode,
        text: delivery.text,
      };
    },
    async close() {
      if (!deps.phalanxSkillClient) {
        await phalanxSkillClient.close();
      }
    },
  };
}

export async function main(): Promise<void> {
  const config = loadDePhalanxConfig(process.env);

  const app = await createDePhalanxApp(config);
  createLiveIngressServer({
    host: config.listenHost,
    port: config.port,
    openClawWebhookSecret: config.openClawWebhookSecret,
    handler: app,
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "live_ingress",
        brainHost: app.config.brainHost,
        openClawBaseUrl: app.config.openClawBaseUrl,
        ingressUrl: `http://${app.config.listenHost}:${app.config.port}/openclaw/events`,
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
