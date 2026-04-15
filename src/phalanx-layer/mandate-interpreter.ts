import type { MandateProfile } from "../mandate/types.js";

export function applyRiskModeOverride(mandate: MandateProfile, riskMode: MandateProfile["riskMode"]): MandateProfile {
  return {
    ...mandate,
    riskMode,
    lastUpdatedSource: "operator_message",
  };
}
