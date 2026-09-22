import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePatient, sequenceAction } from "../src/logic.js";
import { updateFormField } from "../src/formUnits.js";
import { kfreRisk, uacrToMgG } from "../src/kfre.js";

const complete = { k: "4.5", egfr: "45", uacr: "30", uacrUnit: "mgmmol", sbp: "120", hba1c: "7", t2d: true };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-11, `${a} != ${b}`);

test("sequence badges show actions and only offer titration after eligible starts and checks", () => {
  const action = (input, id) => sequenceAction(evaluatePatient({ ...complete, ...input }), id).label;
  assert.equal(action({}, "rasi"), "Start");
  assert.equal(action({ k: 5 }, "rasi"), "Blocked");
  assert.equal(action({ k: 5, onRasi: true }, "rasi"), "No titration");
  assert.equal(action({ k: 5.8, onRasi: true }, "rasi"), "Reduce dose");
  assert.equal(action({ k: 5.8, onFinerenone: true }, "nsmra"), "Pause");
  assert.equal(action({ dip: "dip40", onRasi: true }, "rasi"), "Stop / reduce dose");
  assert.equal(action({ onRasi: true }, "rasi"), "Done · started");
  const all = { onRasi: true, onSglt: true, onFinerenone: true, onGlp: true };
  for (const id of ["rasi", "nsmra", "glp1"]) assert.equal(action(all, id), "Titrate");
  assert.equal(action(all, "sglt2i"), "Done · started");
  assert.equal(action({ ...all, sbp: 85 }, "rasi"), "Physician discretion");
  assert.notEqual(action({ ...all, k: 5.8 }, "glp1"), "Titrate");
  assert.equal(action({ ...all, k: 6.5 }, "rasi"), "Urgent potassium review");
  assert.equal(action({ ...all, k: "" }, "rasi"), "Awaiting required information");
});

test("urgent potassium overrides every medication step, including incomplete labs and other stop rules", () => {
  for (const k of [6, 6.4, 6.49, 6.5, 7, 9]) {
    for (let mask = 0; mask < 16; mask++) {
      for (const labs of [{}, complete, { ...complete, sbp: 80, dip: "dip40" }]) {
        const input = { ...labs, k };
        ["onRasi", "onSglt", "onFinerenone", "onGlp"].forEach((key, i) => { input[key] = Boolean(mask & (1 << i)); });
        const result = evaluatePatient(input);
        assert.match(result.now.title, k >= 6.5 ? /Immediate hospital/ : /repeat within 24 hours/);
        assert.equal(result.now.dose, null);
        assert.equal(result.now.stepId, null);
        assert.ok(Object.values(result.statuses).every((status) => status.id === "urgent"));
        assert.doesNotMatch(JSON.stringify(result), /1 week|1 wk/);
      }
    }
  }
  assert.equal(evaluatePatient({ ...complete, k: 5.9 }).urgency, null);
});

test("missing or invalid required labs cannot produce ready/safe or medication initiation advice", () => {
  for (const key of ["k", "egfr", "uacr", "sbp", "hba1c"]) {
    for (const value of ["", " ", null, "invalid", -1, Infinity]) {
      for (const started of [false, true]) {
        const result = evaluatePatient({ ...complete, [key]: value, onRasi: started, onSglt: started, onFinerenone: started, onGlp: started });
        assert.equal(result.now.title, "Awaiting required information");
        assert.equal(result.now.dose, null);
        assert.ok(Object.values(result.statuses).every((status) => status.id === "awaiting"));
      }
    }
  }
  assert.equal(evaluatePatient({}).statuses.rasi.id, "awaiting");
  assert.equal(evaluatePatient(complete).now.title, "Start RASi at half dose");
  assert.equal(evaluatePatient({ ...complete, egfr: 121 }).now.stepId, null);
});

test("known stop instructions remain visible while other labs are missing", () => {
  const result = evaluatePatient({ k: 5.8, onRasi: true, onFinerenone: true });
  assert.equal(result.statuses.rasi.id, "reduce");
  assert.equal(result.statuses.nsmra.id, "pause");
  assert.equal(result.statuses.sglt2i.id, "awaiting");
});

test("low systolic blood pressure prompts physician discretion without becoming a hard stop", () => {
  const result = evaluatePatient({ ...complete, sbp: 85 });
  assert.equal(result.statuses.rasi.id, "discretion");
  assert.equal(result.now.title, "Start RASi at half dose");
  assert.ok(result.allDirectives.some((directive) => directive.id === "sbp" && directive.kind === "discretion"));
  const bpGuidance = result.allDirectives.find((directive) => directive.id === "sbp").text;
  assert.match(bpGuidance, /baseline blood pressure/i);
  assert.match(bpGuidance, /physician discretion/i);

  const withPotassiumStop = evaluatePatient({ ...complete, sbp: 85, k: 5 });
  assert.equal(withPotassiumStop.statuses.rasi.id, "blocked");
});

test("potassium instructions distinguish initiation from titration for each medication", () => {
  for (const onRasi of [false, true]) for (const onFinerenone of [false, true]) {
    const result = evaluatePatient({ ...complete, k: 5, onRasi, onFinerenone });
    for (const [id, running] of [["rasi", onRasi], ["nsmra", onFinerenone]]) {
      const expected = `K⁺ > 4.8 — no ${running ? "titration" : "initiation"}`;
      assert.equal(result.directives[id].find((d) => d.id === "k48").text, expected);
      assert.ok(result.allDirectives.some((d) => d.text === expected && d.agents.includes(id)));
      assert.equal(result.directives[id].some((d) => d.kind === "continue"), running);
    }
    if (onRasi !== onFinerenone) assert.equal(result.allDirectives.filter((d) => d.id === "k48").length, 2);
  }
  const off = evaluatePatient({ ...complete, k: 5.8 });
  assert.ok(off.allDirectives.every((d) => !["reduce", "pause", "continue"].includes(d.kind)));
  assert.doesNotMatch(off.kActions.join(" "), /reduce RASi|pause finerenone/i);
  const mixed = evaluatePatient({ ...complete, k: 5.8, onRasi: true });
  assert.match(mixed.kActions.join(" "), /reduce RASi/);
  assert.doesNotMatch(mixed.kActions.join(" "), /pause finerenone/i);
});

test("unit switching preserves UACR, kidney risk and treatment eligibility through round trips", () => {
  const risk = (form) => kfreRisk({ age: 60, male: 1, egfr: 45, uacrMgG: uacrToMgG(form.uacr, form.uacrUnit) });
  const converted = updateFormField(complete, "uacrUnit", "mgg");
  close(Number(converted.uacr), 265.2);
  close(risk(converted).year5, risk(complete).year5);
  assert.deepEqual(evaluatePatient(converted).statuses, evaluatePatient(complete).statuses);
  let form = complete;
  for (let i = 0; i < 100; i++) {
    form = updateFormField(updateFormField(form, "uacrUnit", "mgg"), "uacrUnit", "mgmmol");
  }
  close(Number(form.uacr), 30);
  assert.equal(complete.uacr, "30");
});

test("cholesterol switching converts total and HDL together, preserves blanks and accepts subsequent edits", () => {
  const form = { tc: "5", hdl: "1.2", cholUnit: "mmol" };
  const converted = updateFormField(form, "cholUnit", "mgdl");
  close(Number(converted.tc), 193.35);
  close(Number(converted.hdl), 46.404);
  const restored = updateFormField(converted, "cholUnit", "mmol");
  close(Number(restored.tc), 5);
  close(Number(restored.hdl), 1.2);
  assert.equal(updateFormField({ ...form, hdl: "" }, "cholUnit", "mgdl").hdl, "");
  assert.equal(updateFormField({ uacr: "", uacrUnit: "mgmmol" }, "uacrUnit", "mgg").uacr, "");
  const edited = updateFormField(converted, "tc", "200");
  close(Number(updateFormField(edited, "cholUnit", "mmol").tc), 200 / 38.67);
  assert.deepEqual(updateFormField(form, "cholUnit", "mmol"), form);
});
