export function renderTelegramApproval(input: {
  message: string;
  approvalId: string;
}): string {
  return [
    input.message,
    "",
    `Approval ID: ${input.approvalId}`,
    `Reply \`approve ${input.approvalId}\` to continue, or \`reject ${input.approvalId}\` to cancel.`,
  ].join("\n");
}
