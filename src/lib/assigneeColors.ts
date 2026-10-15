/** Small accent dots only — badges stay neutral */
export const ASSIGNEE_COLORS = [
  '#525252',
  '#0369a1',
  '#0f766e',
  '#7c3aed',
  '#b45309',
  '#15803d',
  '#be185d',
  '#4338ca',
] as const

export function assigneeColor(index: number): string {
  const n = ASSIGNEE_COLORS.length
  return ASSIGNEE_COLORS[((index % n) + n) % n]
}
