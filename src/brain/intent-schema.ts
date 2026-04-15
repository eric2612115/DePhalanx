export interface OperatorIntent {
  readonly kind: "operator_message";
  readonly operatorId: string;
  readonly channel: string;
  readonly message: string;
}

export interface BoundedSkillAction {
  readonly type: string;
  readonly chain?: string;
  readonly asset?: string;
  readonly amount?: string;
}

export interface ApprovalResumeInput {
  readonly approvalId: string;
  readonly resumeToken: string;
  readonly approved: boolean;
}

export interface SkillActionBundle {
  readonly actions: readonly BoundedSkillAction[];
  readonly resume?: ApprovalResumeInput;
}

export interface SkillExecutionCompleted {
  readonly status: "completed";
  readonly executionId: string;
}

export interface SkillExecutionPendingApproval {
  readonly status: "pending_approval";
  readonly approvalId: string;
  readonly resumeToken: string;
  readonly message: string;
}

export type SkillExecutionResult = SkillExecutionCompleted | SkillExecutionPendingApproval;
