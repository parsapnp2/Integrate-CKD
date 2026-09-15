import test from "node:test";
import assert from "node:assert/strict";
import { preventRisk } from "../src/prevent.js";

// Worked example documented in PREVENT_equation_reference.html (preventr example).
const example = {
  age: 50, sex: "female", sbp: 160, tc: 200, hdl: 45, egfr: 90,
  bmi: 35, diabetes: true, smoking: false, bpmed: true, statin: false,
};

test("PREVENT total CVD reproduces the worked example at both horizons", () => {
  const result = preventRisk(example);
  assert.equal((result.cvd[10] * 100).toFixed(1), "14.7");
  assert.equal((result.cvd[30] * 100).toFixed(1), "53.0");
  for (const years of [10, 30]) {
    assert.ok(result.cvd[years] > result.ascvd[years]);
    assert.ok(result.cvd[years] > result.hf[years]);
    assert.notEqual(result.cvd[years], result.ascvd[years] + result.hf[years]);
  }
  assert.equal(result.cvdeath, undefined);
});

test("total CVD respects eligibility and missing required inputs", () => {
  assert.equal(preventRisk({ ...example, age: 29 }), null);
  assert.equal(preventRisk({ ...example, age: 80 }), null);
  assert.ok(preventRisk({ ...example, age: 59 }).cvd[30] > 0);
  const older = preventRisk({ ...example, age: 60 });
  assert.ok(older.cvd[10] > 0);
  assert.equal(older.cvd[30], null);
  for (const field of ["tc", "hdl"]) {
    const result = preventRisk({ ...example, [field]: "" });
    assert.equal(result.cvd[10], null);
    assert.equal(result.cvd[30], null);
  }
});
