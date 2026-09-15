import { calculatorRange, rangeError, rangeText, CHOLESTEROL_FACTOR } from "./inputRanges.js";

/** Explain why this particular result is unavailable, without blocking other models. */
export function riskInputIssue(outcome, form, years = 10) {
  const kidney = outcome === "ckd";
  const score = outcome === "cvdeath";
  const model = kidney ? "KFRE" : score ? "SCORE + CKD Patch" : "PREVENT";
  if (!kidney && form.knownCvd) return `${model} is not available with known cardiovascular disease.`;
  const keys = kidney ? ["age", "egfr", "uacr"] : score ? ["age", "egfr", "sbp", "tc", "uacr"]
    : outcome === "hhf" ? ["age", "egfr", "sbp", "bmi"] : ["age", "egfr", "sbp", "tc", "hdl"];
  for (const key of keys) {
    const issue = rangeError(form[key], calculatorRange(key, form), true);
    if (issue) return issue;
  }
  if (!["male", "female"].includes(form.sex)) return "Select sex.";
  if (kidney) return Number(form.egfr) >= 60 ? "KFRE requires eGFR below 60 (CKD G3–G5). Other risk estimates may still be available." : null;
  const narrowRanges = score ? {
    age: { min: 40, max: 65 }, egfr: { min: 15, max: 120 }, sbp: { min: 90, max: 180 },
    // Match the existing SCORE input conversion exactly.
    tc: { min: 3.879 / (0.02586 * (form.cholUnit === "mgdl" ? 1 : CHOLESTEROL_FACTOR)), max: 7.241 / (0.02586 * (form.cholUnit === "mgdl" ? 1 : CHOLESTEROL_FACTOR)) },
    uacr: { min: 5 / (form.uacrUnit === "mgg" ? 1 : 8.84), max: 1500 / (form.uacrUnit === "mgg" ? 1 : 8.84) },
  } : {
    age: { min: 30, max: years === 30 ? 59 : 79 }, egfr: { min: 15, max: 140 },
  };
  for (const [key, limits] of Object.entries(narrowRanges)) {
    const rule = { ...calculatorRange(key, form), ...limits, minExclusive: false };
    if (rangeError(form[key], rule, true)) return `${model}${!score && years === 30 ? " 30-year" : ""} supports ${rule.label} ${rangeText(rule)} ${rule.unit}. Other estimates may still be available.`;
  }
  return null;
}
