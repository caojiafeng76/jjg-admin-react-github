export const DAILY_STANDARD_CAPACITY_WORK_SECONDS = 11 * 3600

export function calculateDailyStandardCapacity(
  standardSeconds: number | null | undefined,
) {
  const normalizedStandardSeconds = Number(standardSeconds || 0)

  if (normalizedStandardSeconds <= 0) {
    return 0
  }

  return DAILY_STANDARD_CAPACITY_WORK_SECONDS / normalizedStandardSeconds
}