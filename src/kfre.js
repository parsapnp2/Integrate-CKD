import { parseNum } from "./logic.js";

/** JAMA 2016 4-variable KFRE (Tangri). uACR in mg/g. Matches kidneyfailurerisk.com. */
export const kfreS0 = {
  na: { 2: 0.975, 5: 0.924 },
  other: { 2: 0.9832, 5: 0.9365 },
};

export function uacrToMgG(value, unit) {
  const n = parseNum(value);
  if (n == null || n <= 0) return null;
  return unit === "mgmmol" ? n * 8.84 : n;
}

export function kfreLinearPredictor({ age, male, egfr, uacrMgG }) {
  return (
    -0.2201 * (age / 10 - 7.036) +
    0.2467 * (male - 0.5642) -
    0.5567 * (egfr / 5 - 7.222) +
    0.451 * (Math.log(uacrMgG) - 5.137)
  );
}

export function kfreRisk({ age, male, egfr, uacrMgG, northAmerica = true }) {
  if (age == null || male == null || egfr == null || uacrMgG == null || uacrMgG <= 0) {
    return null;
  }
  const x = kfreLinearPredictor({ age, male, egfr, uacrMgG });
  const s0 = northAmerica ? kfreS0.na : kfreS0.other;
  const expX = Math.exp(x);
  return {
    year2: 1 - s0[2] ** expX,
    year5: 1 - s0[5] ** expX,
  };
}
