export function renderTelegramResult(input: { executionId: string; actionCount: number }): string {
  return `Execution completed: ${input.executionId} (${input.actionCount} actions).`;
}
