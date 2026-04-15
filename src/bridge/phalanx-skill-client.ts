import type {
  ApprovalResumeInput,
  SkillActionBundle,
  SkillExecutionPendingApproval,
  SkillExecutionResult,
} from "../brain/intent-schema.js";

export interface PhalanxSkillClientDeps {
  readonly executeBundle: (bundle: SkillActionBundle) => Promise<SkillExecutionResult>;
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
}
