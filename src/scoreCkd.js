import { parseNum } from "./logic.js";

// SCORE (Conroy 2003, Appendix A) + CKD-PC (Matsushita 2020, Web Table 13).
// Independent transcription of the published equations, not an API call.
// See Documentations/SCORE_CKD_implementation.md for source discrepancies.
const scoreParameters = {
  low: { male: [[-22.1, 4.71], [-26.7, 5.64]], female: [[-29.8, 6.36], [-31, 6.62]] },
  high: { male: [[-21, 4.62], [-25.7, 5.47]], female: [[-28.7, 6.23], [-30, 6.42]] },
};

export function scoreCkdRisk(input) {
  const age = parseNum(input.age);
  const sbp = parseNum(input.sbp);
  const tc = parseNum(input.tc); // mmol/L
  const egfr = parseNum(input.egfr);
  const uacrMgG = parseNum(input.uacrMgG);
  const parameters = scoreParameters[input.calibration]?.[input.sex];
  if (!parameters || input.knownCvd || [age, sbp, tc, egfr, uacrMgG].some((n) => n == null || !Number.isFinite(n))) return null;
  // Conservative implementation limits: the reference calculator's selectable
  // range, with continuous values allowed within that range. No extrapolation.
  if (age < 40 || age > 65 || sbp < 90 || sbp > 180 || tc < 3.879 || tc > 7.241 || egfr < 15 || egfr > 120 || uacrMgG < 5 || uacrMgG > 1500) return null;
  const female = input.sex === "female" ? 1 : 0;
  const smoke = input.smoking ? 1 : 0;
  const ageC = (age - 60) / 10;
  const bpC = (sbp - 120) / 20;
  const expectedGfr = 86.70235 - 8.478145 * ageC - 0.0838445 * female - 0.6072828 * (tc - 5.2) + 0.0465225 * bpC + 1.521456 * smoke;
  const below60 = (Math.min(expectedGfr, 60) - Math.min(egfr, 60)) / 15;
  const middle = (value) => Math.min(Math.max(value - 60, 0), 30);
  const from60to90 = (middle(expectedGfr) - middle(egfr)) / 15;
  const above90 = (Math.max(expectedGfr - 90, 0) - Math.max(egfr - 90, 0)) / 15;
  const expectedLogAcr = -0.1739204 + 0.0244572 + 0.0685152 * ageC + 0.1063954 * female + 0.0043388 * (tc - 5.2) + 0.1321774 * bpC + 0.0525024 * smoke + 0.415766 * below60 + 0.0182608 * from60to90 - 0.0658044 * above90;
  // ACR is log base 8, centered at 8 mg/g (Web Tables 6 and 13).
  const acrResidual = Math.log(uacrMgG) / Math.log(8) - 1 - expectedLogAcr;
  const patches = [
    0.5439903 * below60 + 0.0750245 * from60to90 - 0.2906766 * above90 + 0.4697088 * acrResidual,
    0.4765619 * below60 + 0.0849492 * from60to90 - 0.2287639 * above90 + 0.5152345 * acrResidual,
  ];
  const traditional = [
    0.24 * (tc - 6) + 0.018 * (sbp - 120) + 0.71 * smoke,
    0.02 * (tc - 6) + 0.022 * (sbp - 120) + 0.63 * smoke,
  ];
  const risk = (usePatch) => Math.min(1, parameters.reduce((sum, [alpha, power], i) => {
    const hazard = Math.exp(alpha + traditional[i] + (usePatch ? patches[i] : 0)) * ((age - 10) ** power - (age - 20) ** power);
    return sum - Math.expm1(-hazard);
  }, 0));
  return { years: 10, original: risk(false), patched: risk(true), calibration: input.calibration };
}
