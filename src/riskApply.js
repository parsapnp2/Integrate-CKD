export function applyHazardRatio(risk, hr) {
  if (risk == null || hr == null || !Number.isFinite(risk) || !Number.isFinite(hr)) return null;
  const r = Math.min(1, Math.max(0, risk));
  return 1 - (1 - r) ** hr;
}

export function formatRiskPct(risk) {
  if (risk == null || !Number.isFinite(risk)) return "—";
  const pct = Math.max(0, risk * 100);
  if (pct < 0.1) return "<0.1";
  if (pct < 10) return pct.toFixed(1);
  return pct.toFixed(1);
}
