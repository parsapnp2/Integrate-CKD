import test from "node:test";
import assert from "node:assert/strict";
import { riskOutcomes } from "../src/data.js";
import { combinedCi, combinedHazardRatio } from "../src/logic.js";
import { applyHazardRatio } from "../src/riskApply.js";

const selected = (mask) => ({ sglt2i: Boolean(mask & 1), nsmra: Boolean(mask & 2), glp1: Boolean(mask & 4) });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("combination CI uses log-HR uncertainty, rather than multiplying CI endpoints", () => {
  // Two independent estimates HR=0.5 with log-SE=0.1: log-SE of product=sqrt(0.02).
  const synthetic = {
    combinationMethod: "multiplicative",
    hrs: { sglt2i: 0.5, nsmra: 0.5 },
    ci: { sglt2i: [0.5 * Math.exp(-0.196), 0.5 * Math.exp(0.196)], nsmra: [0.5 * Math.exp(-0.196), 0.5 * Math.exp(0.196)] },
  };
  const [lower, upper] = combinedCi(synthetic, selected(3));
  close(lower, 0.25 * Math.exp(-1.96 * Math.sqrt(0.02)));
  close(upper, 0.25 * Math.exp(1.96 * Math.sqrt(0.02)));
});

test("a hazard ratio is applied on the survival scale, not multiplied by absolute risk", () => {
  close(applyHazardRatio(0.57, 0.88), 0.5241695386638563);
  assert.notEqual(applyHazardRatio(0.57, 0.88), 0.57 * 0.88);
});

test("all outcomes use updated ratios for every medicine combination", () => {
  const expected = {
    hhf: [1, 0.7, 0.78, 0.546, 0.86, 0.602, 0.6708, 0.46956],
    ckd: [1, 0.67, 0.77, 0.5159, 0.83, 0.5561, 0.6391, 0.428197],
    mace: [1, 0.89, 0.90, 0.801, 0.86, 0.7654, 0.774, 0.68886],
    cvdeath: [1, 0.86, 0.82, 0.7052, 0.85, 0.731, 0.697, 0.59942],
  };
  for (const row of riskOutcomes) {
    expected[row.id].forEach((hr, mask) => {
      close(combinedHazardRatio(row, selected(mask)), hr);
      const ci = combinedCi(row, selected(mask));
      if (mask === 0) assert.equal(ci, null);
      else assert.ok(ci[0] > 0 && ci[0] <= hr && ci[1] >= hr);
    });
  }
});

test("GLP-1 confidence intervals match the updated endpoint-specific evidence", () => {
  const expected = { hhf: [0.79, 0.93], ckd: [0.69, 1], mace: [0.81, 0.90], cvdeath: [0.77, 0.95] };
  for (const row of riskOutcomes) assert.deepEqual(combinedCi(row, selected(4)), expected[row.id]);
});

// Endpoint regression: mortality ratios must not be reused for cardiovascular death.
test("cardiovascular death uses matched endpoints and preserves INFINITY CI precision", () => {
  assert.equal(riskOutcomes.some((row) => row.id === "mortality"), false);
  const outcome = riskOutcomes.find((row) => row.id === "cvdeath");
  assert.equal(outcome.label, "Cardiovascular death");
  assert.deepEqual(outcome.hrs, { sglt2i: 0.86, nsmra: 0.82, glp1: 0.85 });
  assert.deepEqual(combinedCi(outcome, selected(1)), [0.80, 0.92]);
  assert.deepEqual(combinedCi(outcome, selected(2)), [0.67, 0.999]);
});
