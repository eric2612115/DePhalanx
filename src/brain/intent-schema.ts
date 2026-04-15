export interface OperatorMessageIntent {
  readonly kind: "operator_message";
  readonly operatorId: string;
  readonly channel: string;
  readonly replyTarget: string;
  readonly sessionId?: string;
  readonly message: string;
}

export interface ApprovalResponseIntent {
  readonly kind: "approval_response";
  readonly operatorId: string;
  readonly channel: string;
  readonly replyTarget: string;
  readonly sessionId?: string;
  readonly approvalId: string;
  readonly resumeToken: string;
  readonly approved: boolean;
  readonly message: string;
}

export type OperatorIntent = OperatorMessageIntent | ApprovalResponseIntent;

export interface BoundedSkillAction {
  readonly action: string;
  readonly target?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly summary: string;
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
  readonly results: readonly unknown[];
}

export interface SkillExecutionPendingApproval {
  readonly status: "pending_approval";
  readonly approvalId: string;
  readonly resumeToken: string;
  readonly message: string;
}

export interface SkillExecutionFailed {
  readonly status: "failed";
  readonly code: string;
  readonly message: string;
}

export type SkillExecutionResult = SkillExecutionCompleted | SkillExecutionPendingApproval | SkillExecutionFailed;
