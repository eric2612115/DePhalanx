export function renderApprovalNarrative(input: { protocol: string; chain: string; amount: string; asset: string }): string {
  return `Approval required for ${input.protocol} on ${input.chain}: allocate ${input.amount} ${input.asset}.`;
}
