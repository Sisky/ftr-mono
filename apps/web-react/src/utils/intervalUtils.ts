export type IntervalUpdate = {
  intervalStr: string;
  intervalMs: number;
} | null;

export function getIntervalBlurUpdate(raw: string): IntervalUpdate {
  const sanitized = raw.replace(/\s+/g, '');
  const current = Number(sanitized);

  if (!Number.isFinite(current) || current < 1) {
    return { intervalStr: '1', intervalMs: 1000 };
  }

  if (!Number.isInteger(current)) {
    const floored = Math.floor(current);
    return { intervalStr: String(floored), intervalMs: floored * 1000 };
  }

  if (sanitized !== raw) {
    return { intervalStr: sanitized, intervalMs: current * 1000 };
  }

  return null;
}
