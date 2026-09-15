// Shared entry limits. Each risk model still enforces its own narrower eligibility.
// KFRE: kidneyfailurerisk.com (adult CKD G3–G5; no published UACR upper limit).
// PREVENT: AHA input ranges; SCORE: the implemented CKD-PC reference limits.
export const AGE_ENTRY_MAX = 100; // Practical entry guardrail, not a KFRE validation boundary.
export const CHOLESTEROL_FACTOR = 38.67;

export function calculatorRange(key, form = {}) {
  const cholFactor = form.cholUnit === "mgdl" ? 1 : CHOLESTEROL_FACTOR;
  const cholUnit = form.cholUnit === "mgdl" ? "mg/dL" : "mmol/L";
  return {
    age: { label: "Age", min: 18, max: AGE_ENTRY_MAX, unit: "years" },
    egfr: { label: "eGFR", min: 0, minExclusive: true, max: 140, unit: "mL/min/1.73 m²" },
    uacr: { label: "UACR", min: 0, minExclusive: true, unit: form.uacrUnit === "mgg" ? "mg/g" : "mg/mmol" },
    sbp: { label: "SBP", min: 90, max: 200, unit: "mmHg" },
    tc: { label: "Total cholesterol", min: 130 / cholFactor, max: 320 / cholFactor, unit: cholUnit },
    hdl: { label: "HDL", min: 20 / cholFactor, max: 100 / cholFactor, unit: cholUnit },
    bmi: { label: "BMI", min: 18.5, max: 39.9, unit: "kg/m²" },
  }[key];
}

export function interactiveRange(key, form = {}) {
  return {
    k: { label: "K⁺", min: 2, max: 8, unit: "mmol/L" },
    egfr: { label: "eGFR", min: 0, max: 120, unit: "mL/min/1.73 m²" },
    uacr: { label: "UACR", min: 0, unit: form.uacrUnit === "mgg" ? "mg/g" : "mg/mmol" },
    sbp: { label: "SBP", min: 50, max: 250, unit: "mmHg" },
    hba1c: { label: "HbA1c", min: 4, max: 16, unit: "%" },
  }[key];
}

export function rangeText(rule) {
  // Round converted display endpoints inward so the displayed numbers are usable.
  const lower = Number((Math.ceil(rule.min * 10000) / 10000).toFixed(4));
  const upper = rule.max == null ? null : Number((Math.floor(rule.max * 10000) / 10000).toFixed(4));
  if (upper == null) return `${rule.minExclusive ? ">" : "≥"} ${lower}`;
  return `${rule.minExclusive ? ">" : ""}${lower}–${upper}`;
}

export function rangeError(value, rule, required = false) {
  if (value == null || String(value).trim() === "") return required ? `Enter ${rule.label}.` : null;
  const n = Number(value);
  const tolerance = 1e-12 * Math.max(1, Math.abs(n));
  const tooLow = rule.minExclusive ? n <= rule.min : n < rule.min - tolerance;
  const tooHigh = rule.max != null && n > rule.max + tolerance;
  if (!Number.isFinite(n) || tooLow || tooHigh) return `Enter ${rule.label} ${rangeText(rule)} ${rule.unit}.`;
  return null;
}
