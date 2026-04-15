export type RiskMode = "conservative" | "balanced" | "aggressive";
export type PreferenceLevel = "avoid" | "allow" | "prefer" | "approval_required";
export type AutomationLevel = "manual" | "supervised" | "autonomous";
export type MandateUpdateSource = "operator_message" | "system_default" | "migration";

export interface MandateProfile {
  readonly userId: string;
  readonly riskMode: RiskMode;
  readonly protocolPreferences: Readonly<Record<string, PreferenceLevel>>;
  readonly chainPreferences: Readonly<Record<string, PreferenceLevel>>;
  readonly allocationCaps: Readonly<Record<string, number>>;
  readonly approvalRequirements: Readonly<Record<string, boolean>>;
  readonly automationLevel: AutomationLevel;
  readonly lastUpdatedSource: MandateUpdateSource;
}
