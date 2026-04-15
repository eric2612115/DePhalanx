export function renderTelegramResult(input: {
  executionId: string;
  status?: "completed" | "failed";
  message?: string;
}): string {
  if (input.status === "failed") {
    return `Execution stopped: ${input.message ?? "unknown failure"}.`;
  }
  return `Execution completed: ${input.executionId}.`;
}
