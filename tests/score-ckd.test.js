import test from "node:test";
import assert from "node:assert/strict";
import { scoreCkdRisk } from "../src/scoreCkd.js";
import { applyHazardRatio } from "../src/riskApply.js";

const example = { age: 60, sex: "male", sbp: 120, tc: 5.1, egfr: 45, uacrMgG: 30, smoking: false, calibration: "low" };
const close = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("published CKD Patch equations reproduce independent numerical calculations", () => {
  const cases = [
    [example, 0.04529408106457667, 0.08279067103342291],
    [{ ...example, sex: "female", sbp: 140, tc: 5.2, smoking: true, egfr: 90, uacrMgG: 8 }, 0.024615730663938877, 0.03697984495690431],
    [{ ...example, age: 50, sex: "female", sbp: 160, tc: 5.172, egfr: 30, uacrMgG: 300 }, 0.02260167128013143, 0.03510718009232376],
  ];
  for (const [input, low, high] of cases) {
    close(scoreCkdRisk({ ...input, calibration: "low" }).patched, low);
    close(scoreCkdRisk({ ...input, calibration: "high" }).patched, high);
  }
});

test("unpatched SCORE matches reference calculator controls", () => {
  // Reference calculator JSON, synthetic male example, percentages rounded to 5 decimals.
  close(scoreCkdRisk(example).original * 100, 1.99987, 0.000005);
  close(scoreCkdRisk({ ...example, calibration: "high" }).original * 100, 3.67333, 0.000005);
});

test("invalid, incomplete and ineligible inputs do not generate a baseline", () => {
  for (const key of ["age", "sbp", "tc", "egfr", "uacrMgG"]) {
    for (const value of ["", null, undefined, NaN, Infinity]) assert.equal(scoreCkdRisk({ ...example, [key]: value }), null);
  }
  for (const overrides of [{ age: 39 }, { age: 66 }, { egfr: 14 }, { egfr: 121 }, { uacrMgG: 0 }, { uacrMgG: 1501 }, { sbp: 181 }, { tc: 8 }, { sex: "" }, { calibration: "canada" }, { knownCvd: true }]) {
    assert.equal(scoreCkdRisk({ ...example, ...overrides }), null);
  }
});

test("CV death stays at ten years, uses its own calibration and medication effects", () => {
  const baseline = scoreCkdRisk(example);
  assert.equal(baseline.years, 10);
  assert.deepEqual(scoreCkdRisk({ ...example, heartYears: 30, northAmerica: false }), baseline);
  assert.ok(scoreCkdRisk({ ...example, calibration: "high" }).patched > baseline.patched);
  const treated = applyHazardRatio(baseline.patched, 0.85);
  assert.ok(treated > 0 && treated < baseline.patched);
  assert.ok(applyHazardRatio(baseline.patched, 0.77) < treated);
  assert.ok(applyHazardRatio(baseline.patched, 0.95) > treated);
});

test("extreme valid inputs respect the published probability cap", () => {
  for (const calibration of ["low", "high"]) {
    const risk = scoreCkdRisk({ ...example, age: 65, sbp: 180, tc: 7.241, smoking: true, egfr: 15, uacrMgG: 1500, calibration });
    assert.equal(risk.patched, 1);
  }
});
