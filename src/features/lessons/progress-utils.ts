export function normalizeLessonPositionSeconds(
  positionSeconds: number,
  durationSeconds?: number | null
): number {
  if (typeof positionSeconds !== "number" || isNaN(positionSeconds) || !isFinite(positionSeconds) || positionSeconds < 0) {
    positionSeconds = 0;
  }
  let normalized = Math.floor(positionSeconds);
  
  if (typeof durationSeconds === "number" && isFinite(durationSeconds) && durationSeconds > 0) {
    const maxDuration = Math.floor(durationSeconds);
    if (normalized > maxDuration) {
      normalized = maxDuration;
    }
  }
  return normalized;
}

export function normalizeLessonProgressPercent(
  positionSeconds: number,
  durationSeconds: number | null,
  status: string
): number {
  if (status === "completed") {
    return 100;
  }
  if (!durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  const normalizedPos = normalizeLessonPositionSeconds(positionSeconds, durationSeconds);
  return Math.min(99.99, Math.max(0, (normalizedPos / durationSeconds) * 100));
}
