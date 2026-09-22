import test from "node:test";
import assert from "node:assert/strict";
import { calculatorRange, interactiveRange, rangeError, rangeText } from "../src/inputRanges.js";
import { riskInputIssue } from "../src/riskInputIssue.js";
import { kfreRisk, uacrToMgG } from "../src/kfre.js";
import { preventRisk } from "../src/prevent.js";
import { scoreCkdRisk } from "../src/scoreCkd.js";
import { evaluatePatient } from "../src/logic.js";
import { updateFormField } from "../src/formUnits.js";

const form = { age: "60", sex: "male", egfr: "45", uacr: "10", uacrUnit: "mgmmol", sbp: "120", tc: "5.1", hdl: "1.2", cholUnit: "mmol", bmi: "25" };
const kidney = (f) => kfreRisk({ age: f.age, male: f.sex === "male" ? 1 : 0, egfr: f.egfr, uacrMgG: uacrToMgG(f.uacr, f.uacrUnit) });
const heart = (f) => preventRisk({ ...f, tc: Number(f.tc) * (f.cholUnit === "mmol" ? 38.67 : 1), hdl: Number(f.hdl) * (f.cholUnit === "mmol" ? 38.67 : 1) });
const input = { k: 4.5, egfr: 24, uacr: 10, sbp: 120, hba1c: 7, t2d: true, onRasi: true, onSglt: true };

test("entry ranges use the model union and the user's 18–100 age choice", () => {
  assert.equal(rangeText(calculatorRange("age")), "18–100");
  assert.equal(rangeError(18, calculatorRange("age")), null);
  assert.equal(rangeError(100, calculatorRange("age")), null);
  for (const n of [-10, 0, 17, 101, Infinity, "nonsense"]) {
    assert.ok(rangeError(n, calculatorRange("age")));
    assert.equal(kidney({ ...form, age: n }), null);
  }
  assert.ok(kidney({ ...form, age: 18 }));
  assert.ok(kidney({ ...form, age: 100 }));
  assert.equal(rangeError(140, calculatorRange("egfr")), null);
  assert.ok(rangeError(141, calculatorRange("egfr")));
  assert.equal(rangeError(200, calculatorRange("sbp")), null);
  assert.ok(rangeError(201, calculatorRange("sbp")));
});

test("broader valid entries keep eligible estimates while narrower models explain their limits", () => {
  const older = { ...form, age: 85 };
  assert.ok(kidney(older));
  assert.equal(heart(older), null);
  assert.match(riskInputIssue("hhf", older), /30–79/);
  const higherGfr = { ...form, egfr: 130 };
  assert.equal(kidney(higherGfr), null);
  assert.ok(heart(higherGfr).hf[10] > 0);
  assert.equal(riskInputIssue("hhf", higherGfr), null);
  assert.match(riskInputIssue("ckd", higherGfr), /below 60/);
  assert.match(riskInputIssue("cvdeath", higherGfr), /15–120/);
  assert.match(riskInputIssue("mace", form, 30), /30–59/);
  assert.equal(riskInputIssue("mace", form, 10), null);
  const highBmi = { ...form, bmi: 40 };
  assert.equal(heart(highBmi).hf[10], null);
  assert.ok(heart(highBmi).ascvd[10] > 0);
});

test("KFRE only produces estimates for valid adult G3–G5 inputs", () => {
  for (const egfr of [-1, 0, 60, 90, Infinity]) assert.equal(kidney({ ...form, egfr }), null);
  assert.ok(kidney({ ...form, egfr: 1 }));
  assert.ok(kidney({ ...form, egfr: 59.9 }));
  for (const uacr of [-1, 0, Infinity]) assert.equal(kidney({ ...form, uacr }), null);
  assert.equal(kfreRisk({ age: 60, male: 2, egfr: 45, uacrMgG: 100 }), null);
  // No arbitrary upper UACR cap from the narrower SCORE model.
  assert.equal(rangeError(10000, calculatorRange("uacr")), null);
  assert.ok(kidney({ ...form, uacr: 10000 }));
});

test("converted ranges and measurements agree, including all displayed endpoints", () => {
  for (const unit of ["mmol", "mgdl"]) {
    for (const key of ["tc", "hdl"]) {
      const rule = calculatorRange(key, { cholUnit: unit });
      const [low, high] = rangeText(rule).split("–").map(Number);
      assert.equal(rangeError(low, rule), null);
      assert.equal(rangeError(high, rule), null);
      assert.equal(rangeError(rule.min, rule), null);
      assert.equal(rangeError(rule.max, rule), null);
      assert.ok(rangeError(rule.min - 0.01, rule));
      assert.ok(rangeError(rule.max + 0.01, rule));
    }
  }
  const converted = updateFormField(updateFormField(form, "cholUnit", "mgdl"), "uacrUnit", "mgg");
  for (const outcome of ["ckd", "hhf", "mace", "cvdeath"]) {
    assert.equal(riskInputIssue(outcome, form), null);
    assert.equal(riskInputIssue(outcome, converted), null);
  }
  assert.equal(rangeText(calculatorRange("tc", converted)), "130–320");
  assert.equal(rangeError("", calculatorRange("age")), null);
  assert.ok(rangeError("", calculatorRange("age"), true));
  assert.equal(rangeError(0, interactiveRange("uacr")), null);
  assert.ok(rangeError(0, calculatorRange("uacr")));
});

test("SCORE limits are explained using the same conversions as the calculation", () => {
  for (const tc of [3.5, 5.1, 8]) {
    const f = { ...form, tc };
    const result = scoreCkdRisk({ ...f, tc: tc * 38.67 * 0.02586, uacrMgG: uacrToMgG(f.uacr, f.uacrUnit), calibration: "low" });
    assert.equal(riskInputIssue("cvdeath", f) === null, result !== null);
  }
});

test("not-indicated finerenone is skipped to eligible GLP-1 without changing medication history", () => {
  const result = evaluatePatient(input);
  assert.equal(result.now.stepId, "glp1");
  assert.equal(result.now.dose, "semaglutide 0.25 mg weekly");
  assert.equal(result.statuses.nsmra.id, "notIndicated");
  assert.equal(result.started.nsmra, false);
  assert.deepEqual(result.skipped, ["nsmra"]);
  assert.equal(result.now.skipReasons[0].label, "Finerenone not indicated");
});

test("skipping checks later treatments while urgent potassium and missing inputs take priority", () => {
  assert.equal(evaluatePatient({ ...input, hypoEpisodes: true }).now.title, "No medication available to start at this visit");
  assert.equal(evaluatePatient({ ...input, egfr: 45, k: 5 }).now.stepId, "glp1");
  assert.equal(evaluatePatient({ ...input, egfr: 45, dip: "dip40" }).now.stepId, "glp1");
  assert.equal(evaluatePatient({ ...input, onSglt: false, hba1c: 11 }).now.stepId, "glp1");
  assert.match(evaluatePatient({ ...input, k: 6.5 }).now.title, /Immediate hospital/);
  assert.equal(evaluatePatient({ ...input, hba1c: "" }).now.stepId, null);
});

test("lab-blocked RASi is skipped with a reason, without implying it was started", () => {
  for (const k of [5, 5.8]) {
    const result = evaluatePatient({ ...input, egfr: 45, onRasi: false, onSglt: false, k });
    assert.equal(result.now.title, "Skip RASi and start SGLT2i");
    assert.equal(result.now.stepId, "sglt2i");
    assert.equal(result.started.rasi, false);
    assert.doesNotMatch(result.now.detail, /continue RASi|reduce RASi/i);
    assert.equal(result.now.skipReasons[0].label, "RASi blocked");
    assert.match(result.now.skipReasons[0].reason, /K⁺ > 4.8/);
  }
});

test("all four unavailable classes produce reasons without initiation or titration advice", () => {
  const result = evaluatePatient({ ...input, egfr: 45, onRasi: false, onSglt: false, k: 5, hba1c: 11, hypoEpisodes: true });
  assert.equal(result.now.stepId, null);
  assert.equal(result.now.dose, null);
  assert.equal(result.now.skipReasons.length, 4);
  assert.ok(Object.values(result.started).every((started) => !started));
});

test("finishing the eligible sequence only titrates medicines actually started", () => {
  const result = evaluatePatient({ ...input, onGlp: true });
  assert.equal(result.now.stepId, "titrate");
  assert.match(result.now.dose, /semaglutide/);
  assert.doesNotMatch(result.now.dose, /finerenone/);
  const rasiOnly = evaluatePatient({ ...input, egfr: 60, uacr: 0, t2d: false, onSglt: false });
  assert.equal(rasiOnly.now.stepId, "titrate");
  assert.equal(rasiOnly.now.dose, "RASi ↑");
  assert.deepEqual(rasiOnly.skipped, ["sglt2i", "nsmra", "glp1"]);
  assert.equal(evaluatePatient({ ...input, onGlp: true, hypoEpisodes: true }).now.title, "Hold titration");
});
