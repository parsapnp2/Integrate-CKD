import { useMemo, useState } from "react";
import { riskOutcomes } from "./data.js";
import { kfreRisk, uacrToMgG } from "./kfre.js";
import { combinedCi, combinedHazardRatio, parseNum } from "./logic.js";
import { preventRisk } from "./prevent.js";
import { scoreCkdRisk } from "./scoreCkd.js";
import { applyHazardRatio, formatRiskPct } from "./riskApply.js";
import RiskReductionSection from "./RiskReductionSection.jsx";
import CalculatorReferences from "./CalculatorReferences.jsx";
import { tone } from "./theme.js";
import { updateFormField } from "./formUnits.js";
import RangeInput from "./RangeInput.jsx";
import { calculatorRange } from "./inputRanges.js";
import { riskInputIssue } from "./riskInputIssue.js";

/** PREVENT takes cholesterol in mg/dL; Canadian labs report mmol/L. 1 mmol/L = 38.67 mg/dL. */
const MMOL_TO_MGDL = 38.67;
/**
 * SCORE + CKD Patch is fixed to the low-risk European calibration, the closest
 * published calibration to Canadian CVD mortality. See Sources and evidence.
 */
const SCORE_CALIBRATION = "low";

const cholToMgDl = (value, unit) => {
  const n = parseNum(value);
  if (n == null) return null;
  return unit === "mmol" ? n * MMOL_TO_MGDL : n;
};

const emptyForm = {
  age: "",
  sex: "",
  egfr: "",
  uacr: "",
  uacrUnit: "mgmmol",
  northAmerica: true,
  sbp: "",
  tc: "",
  hdl: "",
  cholUnit: "mmol",
  bmi: "",
  diabetes: true,
  smoking: false,
  bpmed: false,
  statin: false,
  onSglt: false,
  onFinerenone: false,
  onGlp: false,
  knownCvd: false,
};

const startedMeds = [
  { key: "onSglt", label: "SGLT2i", tone: "sglt" },
  { key: "onFinerenone", label: "Finerenone", tone: "mra" },
  { key: "onGlp", label: "GLP-1 RA", tone: "glp" },
];

/** Which baseline model consumes each field. Shown as a tag so no field looks model-owned. */
const MODEL_LABELS = {
  K: "KFRE · kidney failure",
  P: "PREVENT · heart failure and ASCVD",
  S: "SCORE + CKD Patch · cardiovascular death",
};

const outcomeById = Object.fromEntries(riskOutcomes.map((row) => [row.id, row]));
const FALLBACK_OUTCOME = { hrs: {}, ci: {}, combinationMethod: "multiplicative" };
const outcomeFor = (id) => outcomeById[id] ?? FALLBACK_OUTCOME;

/** Gridlines drawn across each bar well, as a percentage of the full 0-100 scale. */
const BAR_GRIDLINES = [25, 50, 75];

function PillCheck({ checked, onChange, label, toneKey, className = "" }) {
  const t = tone[toneKey] ?? tone.ink;
  return (
    <label
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-[12px] font-semibold transition ${
        checked ? `${t.bg} ${t.border} ${t.text}` : "border-slate-200 bg-white text-ink hover:border-slate-300"
      } ${className}`}
    >
      <input type="checkbox" className="accent-current" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function Choice({ options, value, onChange }) {
  return (
    <div className="mt-1 flex rounded-lg bg-slate-100 p-0.5">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
              active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact segmented control for unit and calibration switches that sit in a section header. */
function MiniChoice({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <div className="flex rounded-md bg-slate-100 p-0.5">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModelTags({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <span className="flex shrink-0 gap-0.5">
      {tags.map((tag) => (
        <span
          key={tag}
          title={MODEL_LABELS[tag] ?? tag}
          className="rounded bg-slate-100 px-1 text-[8px] font-bold leading-[1.5] text-muted"
        >
          {tag}
        </span>
      ))}
    </span>
  );
}

function Field({ label, tags, children }) {
  return (
    <label className="block rounded-xl border border-slate-200 bg-white px-2.5 py-1">
      <span className="flex items-center justify-between gap-1">
        <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <ModelTags tags={tags} />
      </span>
      {children}
    </label>
  );
}

function ChoiceField({ label, tags, options, value, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2 py-1">
      <span className="flex items-center justify-between gap-1">
        <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <ModelTags tags={tags} />
      </span>
      <Choice options={options} value={value} onChange={onChange} />
    </div>
  );
}

function Section({ title, aside, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white/70 px-2 py-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{title}</p>
        {aside}
      </div>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function inputClass() {
  return "mt-0.5 w-full bg-transparent text-sm text-ink outline-none";
}

function BarWell({ risk, color, faint }) {
  // Fixed 0-100 scale: a full well is a 100% risk. Gridlines keep low bars readable.
  const n = Number(risk);
  const height = risk == null || !Number.isFinite(n) ? "0%" : `${Math.min(100, Math.max(0, n * 100))}%`;
  return (
    <div className="relative h-[4.75rem] w-11 overflow-hidden rounded-t-lg bg-slate-100">
      <div
        className={`absolute inset-x-0 bottom-0 transition-all duration-700 ${faint ? "opacity-45" : ""}`}
        style={{ height, background: color }}
      />
      {BAR_GRIDLINES.map((line) => (
        <span
          key={line}
          className="pointer-events-none absolute inset-x-0 h-px bg-ink/15"
          style={{ bottom: `${line}%` }}
        />
      ))}
    </div>
  );
}

function VerticalPair({ baseline, treated, color }) {
  // Laid out as three grid rows (wells, labels, values) rather than two stacked
  // columns, so a label that needs more room can never shift its own bar.
  return (
    <div className="mx-auto grid w-fit grid-cols-2 justify-items-center gap-x-3">
      <BarWell risk={baseline} color={color} faint />
      <BarWell risk={treated ?? baseline} color={color} />

      <p className="mt-0.5 whitespace-nowrap text-[8px] font-bold uppercase tracking-wide text-muted">Baseline</p>
      <p className="mt-0.5 whitespace-nowrap text-[8px] font-bold uppercase tracking-wide text-muted">With meds</p>

      <p className="text-[13px] font-bold tabular-nums text-ink">{baseline == null ? "—" : `${formatRiskPct(baseline)}%`}</p>
      <p className="text-[13px] font-bold tabular-nums text-proceed">
        {treated == null && baseline == null ? "—" : `${formatRiskPct(treated ?? baseline)}%`}
      </p>
    </div>
  );
}

function DeltaLine({ baseline, treated, treatedCi, anyStarted, ready }) {
  if (!ready || !anyStarted) {
    return (
      <p className="flex min-h-[2rem] items-center justify-center text-center text-[9px] leading-snug text-muted">
        {ready ? "Tick a medicine to model treated risk." : ""}
      </p>
    );
  }
  const drop = baseline != null && treated != null ? (baseline - treated) * 100 : null;
  if (drop == null) return <p className="min-h-[2rem]" />;
  const magnitude = Math.abs(drop) >= 0.05 ? Math.abs(drop).toFixed(1) : "<0.1";
  const rising = drop < 0;
  return (
    <p className={`min-h-[2rem] text-center text-[10px] leading-snug ${rising ? "text-continue" : "text-proceed"}`}>
      {rising ? "+" : "−"}
      {magnitude} points
      {treatedCi ? (
        <span className="block text-[9px] text-muted">
          treated 95% CI {formatRiskPct(treatedCi[0])}–{formatRiskPct(treatedCi[1])}%
        </span>
      ) : null}
    </p>
  );
}

function OutcomeCard({
  category,
  title,
  model,
  horizon,
  color,
  baseline,
  treated,
  treatedCi,
  anyStarted,
  status,
  footnote,
  caution,
}) {
  const ready = !status;
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-2">
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{category}</p>
      <p className="text-[13px] font-semibold leading-tight text-ink">{title}</p>
      <p className="text-[9px] leading-snug text-muted">
        {model} · {horizon}
      </p>

      <div className="mt-1.5 flex min-h-[7.5rem] flex-1 items-center justify-center">
        {ready ? (
          <VerticalPair baseline={baseline} treated={treated} color={color} />
        ) : (
          <p
            className={`px-1 text-center text-[10px] leading-snug ${
              status.tone === "warn" ? "text-continue" : "text-muted"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>

      <DeltaLine baseline={baseline} treated={treated} treatedCi={treatedCi} anyStarted={anyStarted} ready={ready} />

      <div className="mt-auto border-t border-slate-100 pt-1">
        <p className="text-[9px] leading-snug text-muted">{footnote}</p>
        {caution ? <p className="mt-0.5 text-[9px] leading-snug text-continue">{caution}</p> : null}
      </div>
    </div>
  );
}

export default function CalculatorView() {
  const [form, setForm] = useState(emptyForm);
  const [kidneyYears, setKidneyYears] = useState(5);
  const [heartYears, setHeartYears] = useState(10);

  function set(key, value) {
    setForm((current) => updateFormField(current, key, value));
  }

  const started = useMemo(
    () => ({
      sglt2i: Boolean(form.onSglt),
      nsmra: Boolean(form.onFinerenone),
      glp1: Boolean(form.onGlp),
    }),
    [form.onSglt, form.onFinerenone, form.onGlp],
  );
  const anyStarted = started.sglt2i || started.nsmra || started.glp1;

  const age = parseNum(form.age);
  const egfr = parseNum(form.egfr);
  const tc = cholToMgDl(form.tc, form.cholUnit);
  const male = form.sex === "male" ? 1 : form.sex === "female" ? 0 : null;
  const uacrMgG = uacrToMgG(form.uacr, form.uacrUnit);
  const cholLabel = form.cholUnit === "mmol" ? "mmol/L" : "mg/dL";

  const kidney = useMemo(() => {
    if (age == null || male == null || egfr == null || uacrMgG == null) return null;
    return kfreRisk({ age, male, egfr, uacrMgG, northAmerica: form.northAmerica });
  }, [age, male, egfr, uacrMgG, form.northAmerica]);

  const heart = useMemo(
    () =>
      form.knownCvd
        ? null
        : preventRisk({
            age: form.age,
            sex: form.sex,
            sbp: form.sbp,
            tc: cholToMgDl(form.tc, form.cholUnit),
            hdl: cholToMgDl(form.hdl, form.cholUnit),
            egfr: form.egfr,
            bmi: form.bmi,
            diabetes: form.diabetes,
            smoking: form.smoking,
            bpmed: form.bpmed,
            statin: form.statin,
          }),
    [form],
  );

  const cvDeath = scoreCkdRisk({
    age: form.age,
    sex: form.sex,
    sbp: form.sbp,
    tc: tc == null ? null : tc * 0.02586,
    egfr: form.egfr,
    uacrMgG,
    smoking: form.smoking,
    calibration: SCORE_CALIBRATION,
    knownCvd: form.knownCvd,
  });

  const ckdOutcome = outcomeFor("ckd");
  const hfOutcome = outcomeFor("hhf");
  const maceOutcome = outcomeFor("mace");
  const cvDeathOutcome = outcomeFor("cvdeath");

  const kidneyBase = kidney ? (kidneyYears === 2 ? kidney.year2 : kidney.year5) : null;
  const hfBase = heart?.hf?.[heartYears] ?? null;
  const ascvdBase = heart?.ascvd?.[heartYears] ?? null;
  const cvDeathBase = cvDeath?.patched ?? null;

  const kidneyTreated = anyStarted ? applyHazardRatio(kidneyBase, combinedHazardRatio(ckdOutcome, started)) : kidneyBase;
  const hfTreated = anyStarted ? applyHazardRatio(hfBase, combinedHazardRatio(hfOutcome, started)) : hfBase;
  const ascvdTreated = anyStarted ? applyHazardRatio(ascvdBase, combinedHazardRatio(maceOutcome, started)) : ascvdBase;
  const cvDeathTreated = anyStarted
    ? applyHazardRatio(cvDeathBase, combinedHazardRatio(cvDeathOutcome, started))
    : cvDeathBase;

  function treatedRange(baseline, ci) {
    if (baseline == null || !ci) return null;
    const a = applyHazardRatio(baseline, ci[0]);
    const b = applyHazardRatio(baseline, ci[1]);
    if (a == null || b == null) return null;
    return [Math.min(a, b), Math.max(a, b)];
  }

  const kidneyTreatedCi = anyStarted ? treatedRange(kidneyBase, combinedCi(ckdOutcome, started)) : null;
  const hfTreatedCi = anyStarted ? treatedRange(hfBase, combinedCi(hfOutcome, started)) : null;
  const ascvdTreatedCi = anyStarted ? treatedRange(ascvdBase, combinedCi(maceOutcome, started)) : null;
  const cvDeathTreatedCi = anyStarted ? treatedRange(cvDeathBase, combinedCi(cvDeathOutcome, started)) : null;

  // A card stays quiet until the user has entered something. Diabetes is excluded
  // because it is pre-ticked, so it is not evidence that the form has been used.
  const anyInput =
    [form.age, form.sex, form.egfr, form.sbp, form.uacr, form.tc, form.hdl, form.bmi].some(
      (value) => String(value ?? "").trim() !== "",
    ) || form.smoking || form.bpmed || form.statin || form.knownCvd;

  function statusFor(baseline, outcome, years = 10) {
    if (baseline != null) return null;
    if (!anyInput) return { tone: "muted", message: "Enter patient details to calculate." };
    return { tone: "warn", message: riskInputIssue(outcome, form, years) ?? "Not available for these inputs." };
  }

  const kidneyStatus = statusFor(kidneyBase, "ckd");
  const hfStatus = statusFor(hfBase, "hhf", heartYears);
  const maceStatus = statusFor(ascvdBase, "mace", heartYears);
  const cvDeathStatus = statusFor(cvDeathBase, "cvdeath");


  return (
    <div className="space-y-2.5">
      <div className="grid items-stretch gap-2.5 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
        <div className="overflow-hidden rounded-2xl border border-sglt/20 bg-white shadow-sm">
          <div className="h-full px-3 py-2" style={{ background: "linear-gradient(180deg, #e6f6ee 0%, #ffffff 100%)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-sglt">Risk calculator</p>
                <h2 className="font-serif text-base leading-tight text-ink">Baseline, then medicines</h2>
              </div>
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-ink"
              >
                Clear
              </button>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              KFRE, PREVENT and SCORE + CKD Patch calculate baseline risks. Tick medicines to compare modelled effects.
              Nothing is stored.
            </p>

            <form className="mt-2 space-y-1.5" onSubmit={(event) => event.preventDefault()}>
              <Section
                title="Patient"
                aside={
                  <MiniChoice
                    label="KFRE region"
                        value={form.northAmerica ? "na" : "other"}
                    onChange={(id) => set("northAmerica", id === "na")}
                    options={[
                      { id: "na", label: "North America" },
                      { id: "other", label: "Other" },
                    ]}
                  />
                }
              >
                <div className="grid grid-cols-2 gap-1.5">
                  <Field label="Age" hint="years" tags={["K", "P", "S"]}>
                    <RangeInput
                      className={inputClass()}
                      type="number"
                      inputMode="numeric"
                      range={calculatorRange("age", form)}
                      value={form.age}
                      onChange={(e) => set("age", e.target.value)}
                    />
                  </Field>
                  <ChoiceField
                    label="Sex"
                    tags={["K", "P", "S"]}
                        value={form.sex}
                    onChange={(id) => set("sex", id)}
                    options={[
                      { id: "female", label: "Female" },
                      { id: "male", label: "Male" },
                    ]}
                  />
                </div>
              </Section>

              <Section
                title="Labs and vitals"
                aside={
                  <div className="flex flex-wrap items-center gap-2">
                    <MiniChoice
                      label="ACR"
                          value={form.uacrUnit}
                      onChange={(id) => set("uacrUnit", id)}
                      options={[
                        { id: "mgmmol", label: "mg/mmol" },
                        { id: "mgg", label: "mg/g" },
                      ]}
                    />
                    <MiniChoice
                      label="Chol"
                          value={form.cholUnit}
                      onChange={(id) => set("cholUnit", id)}
                      options={[
                        { id: "mmol", label: "mmol/L" },
                        { id: "mgdl", label: "mg/dL" },
                      ]}
                    />
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  <Field label="eGFR" hint="mL/min/1.73 m²" tags={["K", "P", "S"]}>
                    <RangeInput
                      className={inputClass()}
                      type="number"
                      inputMode="decimal"
                      range={calculatorRange("egfr", form)}
                      value={form.egfr}
                      onChange={(e) => set("egfr", e.target.value)}
                    />
                  </Field>
                  <Field label="SBP" hint="mm Hg" tags={["P", "S"]}>
                    <RangeInput
                      className={inputClass()}
                      type="number"
                      inputMode="numeric"
                      range={calculatorRange("sbp", form)}
                      value={form.sbp}
                      onChange={(e) => set("sbp", e.target.value)}
                    />
                  </Field>
                  <Field label="UACR" hint={form.uacrUnit === "mgg" ? "mg/g" : "mg/mmol"} tags={["K", "S"]}>
                    <RangeInput
                      className={inputClass()}
                      type="number"
                      inputMode="decimal"
                      range={calculatorRange("uacr", form)}
                      value={form.uacr}
                      onChange={(e) => set("uacr", e.target.value)}
                    />
                  </Field>
                  <Field label="Total chol." hint={cholLabel} tags={["P", "S"]}>
                    <RangeInput
                      className={inputClass()}
                      type="number"
                      inputMode="decimal"
                      range={calculatorRange("tc", form)}
                      value={form.tc}
                      onChange={(e) => set("tc", e.target.value)}
                    />
                  </Field>
                  <Field label="HDL" hint={cholLabel} tags={["P"]}>
                    <RangeInput
                      className={inputClass()}
                      type="number"
                      inputMode="decimal"
                      range={calculatorRange("hdl", form)}
                      value={form.hdl}
                      onChange={(e) => set("hdl", e.target.value)}
                    />
                  </Field>
                  <Field label="BMI" hint="kg/m²" tags={["P"]}>
                    <RangeInput
                      className={inputClass()}
                      type="number"
                      inputMode="decimal"
                      range={calculatorRange("bmi", form)}
                      value={form.bmi}
                      onChange={(e) => set("bmi", e.target.value)}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Conditions and therapy">
                <div className="grid grid-cols-2 gap-1.5">
                  <PillCheck
                    className="w-full"
                    checked={form.diabetes}
                    onChange={(e) => set("diabetes", e.target.checked)}
                    label="Diabetes"
                    toneKey="sglt"
                  />
                  <PillCheck
                    className="w-full"
                    checked={form.smoking}
                    onChange={(e) => set("smoking", e.target.checked)}
                    label="Smoking"
                    toneKey="mra"
                  />
                  <PillCheck
                    className="w-full"
                    checked={form.bpmed}
                    onChange={(e) => set("bpmed", e.target.checked)}
                    label="BP therapy"
                    toneKey="glp"
                  />
                  <PillCheck
                    className="w-full"
                    checked={form.statin}
                    onChange={(e) => set("statin", e.target.checked)}
                    label="Statin"
                    toneKey="rasi"
                  />
                  <PillCheck
                    className="col-span-2 w-full"
                    checked={form.knownCvd}
                    onChange={(e) => set("knownCvd", e.target.checked)}
                    label="Known CVD (ASCVD or heart failure)"
                    toneKey="glp"
                  />
                </div>
              </Section>

              <Section title="Already started">
                <div className="flex flex-wrap items-center gap-1.5">
                  {startedMeds.map((med) => (
                    <PillCheck
                      key={med.key}
                      checked={form[med.key]}
                      onChange={(e) => set(med.key, e.target.checked)}
                      label={med.label}
                      toneKey={med.tone}
                    />
                  ))}
                  <span className="text-[10px] text-muted">Effects added to usual care.</span>
                </div>
              </Section>

              <p className="px-1 text-[9px] leading-snug text-muted">
                Field tags: <span className="font-bold">K</span> KFRE · <span className="font-bold">P</span> PREVENT ·{" "}
                <span className="font-bold">S</span> SCORE + CKD Patch.
              </p>
            </form>
          </div>
        </div>

        <RiskReductionSection form={form} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-3 py-2" style={{ background: "linear-gradient(180deg, #e6f6ee 0%, #ffffff 55%)" }}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-sglt">Absolute risk</p>
              <h3 className="font-serif text-base leading-tight text-ink">Baseline vs selected medicines</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Kidney horizon</p>
                <Choice
                  value={String(kidneyYears)}
                  onChange={(id) => setKidneyYears(Number(id))}
                  options={[
                    { id: "2", label: "2-year" },
                    { id: "5", label: "5-year" },
                  ]}
                />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted">HF / ASCVD horizon</p>
                <Choice
                  value={String(heartYears)}
                  onChange={(id) => setHeartYears(Number(id))}
                  options={[
                    { id: "10", label: "10-year" },
                    { id: "30", label: "30-year" },
                  ]}
                />
              </div>
            </div>
          </div>
          <p className="mt-0.5 text-[10px] leading-snug text-muted">
            Faint bar is the baseline model. Solid bar applies the trial hazard ratios as 1 − (1 − baseline)
            <sup>HR</sup>. Treated risks are modelled approximations. Every bar is scaled 0 to 100%, with gridlines at
            25, 50 and 75.
          </p>

          <div className="mt-2 grid items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <OutcomeCard
              category="Kidney"
              title="Kidney failure"
              model="KFRE"
              horizon={`${kidneyYears}-year`}
              color="#0e7c72"
              baseline={kidneyBase}
              treated={kidneyTreated}
              treatedCi={kidneyTreatedCi}
              anyStarted={anyStarted}
              status={kidneyStatus}
              footnote="Endpoint: dialysis or transplant."
            />
            <OutcomeCard
              category="Heart"
              title="Heart failure"
              model="PREVENT"
              horizon={`${heartYears}-year`}
              color="#e11d48"
              baseline={hfBase}
              treated={hfTreated}
              treatedCi={hfTreatedCi}
              anyStarted={anyStarted}
              status={hfStatus}
              footnote="Endpoint: incident heart failure."
            />
            <OutcomeCard
              category="ASCVD"
              title={<>ASCVD<sup className="ml-0.5 text-[9px]">*</sup></>}
              model="PREVENT"
              horizon={`${heartYears}-year`}
              color="#1a365d"
              baseline={ascvdBase}
              treated={ascvdTreated}
              treatedCi={ascvdTreatedCi}
              anyStarted={anyStarted}
              status={maceStatus}
              footnote="* Endpoint: PREVENT ASCVD."
            />
            <OutcomeCard
              category="CV death"
              title="Cardiovascular death"
              model="SCORE + CKD Patch"
              horizon="10-year, fixed"
              color="#1b7a4e"
              baseline={cvDeathBase}
              treated={cvDeathTreated}
              treatedCi={cvDeathTreatedCi}
              anyStarted={anyStarted}
              status={cvDeathStatus}
              footnote="Endpoint: fatal CVD. Fixed 10-year horizon."
            />
          </div>
        </div>

        {form.knownCvd ? (
          <div className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] leading-relaxed text-continue">
            Known CVD is ticked. PREVENT and SCORE + CKD Patch are primary-prevention models, so the heart failure, ASCVD
            and cardiovascular death baselines are not shown.
          </div>
        ) : null}
      </div>
      <CalculatorReferences />
    </div>
  );
}
