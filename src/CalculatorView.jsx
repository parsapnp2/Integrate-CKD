import { useMemo, useState } from "react";
import { riskOutcomes } from "./data.js";
import { kfreRisk, uacrToMgG } from "./kfre.js";
import { combinedCi, combinedHazardRatio, parseNum } from "./logic.js";
import { preventRisk } from "./prevent.js";
import { applyHazardRatio, formatRiskPct } from "./riskApply.js";
import RiskReductionSection from "./RiskReductionSection.jsx";
import { tone } from "./theme.js";

const emptyForm = {
  age: "",
  sex: "",
  egfr: "",
  uacr: "",
  uacrUnit: "mgg",
  northAmerica: true,
  sbp: "",
  tc: "",
  hdl: "",
  bmi: "",
  diabetes: true,
  smoking: false,
  bpmed: false,
  statin: false,
  onSglt: false,
  onFinerenone: false,
  onGlp: false,
};

const startedMeds = [
  { key: "onSglt", label: "SGLT2i", tone: "sglt" },
  { key: "onFinerenone", label: "Finerenone", tone: "mra" },
  { key: "onGlp", label: "GLP-1 RA", tone: "glp" },
];

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

function Field({ label, hint, children }) {
  return (
    <label className="rounded-xl border border-slate-200 bg-white px-2.5 py-1">
      <span className="block whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint ? <span className="block text-[10px] leading-tight text-muted">{hint}</span> : null}
    </label>
  );
}

function inputClass() {
  return "mt-0.5 w-full bg-transparent text-sm text-ink outline-none";
}

function VerticalPair({ baseline, treated, color, treatedLabel }) {
  const toH = (risk) => `${Math.min(100, Math.max(0, (risk ?? 0) * 100))}%`;
  return (
    <div className="mt-1.5 flex items-end justify-center gap-3">
      <div className="flex w-11 flex-col items-center">
        <div className="relative h-[4.75rem] w-full overflow-hidden rounded-t-lg bg-slate-100">
          <div
            className="absolute inset-x-0 bottom-0 opacity-45 transition-all duration-700"
            style={{ height: toH(baseline), background: color }}
          />
        </div>
        <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-muted">Baseline</p>
        <p className="text-[13px] font-bold tabular-nums text-ink">{baseline == null ? "—" : `${formatRiskPct(baseline)}%`}</p>
      </div>
      <div className="flex w-11 flex-col items-center">
        <div className="relative h-[4.75rem] w-full overflow-hidden rounded-t-lg bg-slate-100">
          <div
            className="absolute inset-x-0 bottom-0 transition-all duration-700"
            style={{ height: toH(treated ?? baseline), background: color }}
          />
        </div>
        <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-muted">{treatedLabel}</p>
        <p className="text-[13px] font-bold tabular-nums text-proceed">
          {treated == null && baseline == null ? "—" : `${formatRiskPct(treated ?? baseline)}%`}
        </p>
      </div>
    </div>
  );
}

function OutcomeCard({ title, category, hint, color, baseline, treated, treatedCi, extra, warning }) {
  const absDrop = baseline != null && treated != null ? (baseline - treated) * 100 : null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2">
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{category}</p>
      <p className="text-[13px] font-semibold leading-tight text-ink">{title}</p>
      <p className="text-[9px] leading-snug text-muted">{hint}</p>
      <VerticalPair baseline={baseline} treated={treated} color={color} treatedLabel="With meds" />
      {absDrop != null && absDrop > 0.05 ? (
        <p className="mt-1 text-center text-[10px] text-proceed">
          −{absDrop.toFixed(1)} points
          {treatedCi ? (
            <span className="block text-[9px] text-muted">
              treated 95% CI {formatRiskPct(treatedCi[0])}–{formatRiskPct(treatedCi[1])}%
            </span>
          ) : null}
        </p>
      ) : baseline != null ? (
        <p className="mt-1 text-center text-[9px] text-muted">Tick a medicine to lower the treated bar.</p>
      ) : null}
      {extra}
      {warning ? <p className="mt-0.5 text-[9px] leading-snug text-continue">{warning}</p> : null}
    </div>
  );
}

export default function CalculatorView() {
  const [form, setForm] = useState(emptyForm);
  const [kidneyYears, setKidneyYears] = useState(5);
  const [heartYears, setHeartYears] = useState(10);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
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
  const male = form.sex === "male" ? 1 : form.sex === "female" ? 0 : null;
  const uacrMgG = uacrToMgG(form.uacr, form.uacrUnit);

  const kidney = useMemo(() => {
    if (age == null || male == null || egfr == null || uacrMgG == null) return null;
    return kfreRisk({
      age,
      male,
      egfr,
      uacrMgG,
      northAmerica: form.northAmerica,
    });
  }, [age, male, egfr, uacrMgG, form.northAmerica]);

  const heart = useMemo(
    () =>
      preventRisk({
        age: form.age,
        sex: form.sex,
        sbp: form.sbp,
        tc: form.tc,
        hdl: form.hdl,
        egfr: form.egfr,
        bmi: form.bmi,
        diabetes: form.diabetes,
        smoking: form.smoking,
        bpmed: form.bpmed,
        statin: form.statin,
      }),
    [form],
  );

  const ckdOutcome = riskOutcomes.find((row) => row.id === "ckd");
  const hfOutcome = riskOutcomes.find((row) => row.id === "hhf");
  const maceOutcome = riskOutcomes.find((row) => row.id === "mace");

  const kidneyHr = combinedHazardRatio(ckdOutcome, started);
  const hfHr = combinedHazardRatio(hfOutcome, started);
  const maceHr = combinedHazardRatio(maceOutcome, started);
  const kidneyCi = combinedCi(ckdOutcome, started);
  const hfCi = combinedCi(hfOutcome, started);
  const maceCi = combinedCi(maceOutcome, started);

  const kidneyBase = kidney ? (kidneyYears === 2 ? kidney.year2 : kidney.year5) : null;
  const hfBase = heart?.hf?.[heartYears] ?? null;
  const ascvdBase = heart?.ascvd?.[heartYears] ?? null;
  const cvdBase = heart?.cvd?.[heartYears] ?? null;

  const kidneyTreated = anyStarted ? applyHazardRatio(kidneyBase, kidneyHr) : kidneyBase;
  const hfTreated = anyStarted ? applyHazardRatio(hfBase, hfHr) : hfBase;
  const ascvdTreated = anyStarted ? applyHazardRatio(ascvdBase, maceHr) : ascvdBase;

  function treatedRange(baseline, ci) {
    if (baseline == null || !ci) return null;
    const a = applyHazardRatio(baseline, ci[0]);
    const b = applyHazardRatio(baseline, ci[1]);
    return [Math.min(a, b), Math.max(a, b)];
  }

  const kidneyTreatedCi = anyStarted ? treatedRange(kidneyBase, kidneyCi) : null;
  const hfTreatedCi = anyStarted ? treatedRange(hfBase, hfCi) : null;
  const ascvdTreatedCi = anyStarted ? treatedRange(ascvdBase, maceCi) : null;

  const notes = [];
  if (egfr != null && egfr >= 60) notes.push("KFRE is intended for CKD G3–G5 (eGFR < 60).");
  if (age != null && (age < 30 || age > 79)) notes.push("PREVENT is defined for ages 30–79.");
  if (heartYears === 30 && age != null && age > 59) notes.push("30-year PREVENT is only defined for ages 30–59.");
  const sbp = parseNum(form.sbp);
  const tc = parseNum(form.tc);
  const hdl = parseNum(form.hdl);
  const bmi = parseNum(form.bmi);
  if (sbp != null && (sbp < 90 || sbp > 200)) notes.push("PREVENT SBP range is 90–200 mm Hg.");
  if (tc != null && (tc < 130 || tc > 320)) notes.push("PREVENT total cholesterol range is 130–320 mg/dL.");
  if (hdl != null && (hdl < 20 || hdl > 100)) notes.push("PREVENT HDL range is 20–100 mg/dL.");
  if (bmi != null && (bmi < 18.5 || bmi > 39.9)) notes.push("PREVENT BMI range is 18.5–39.9 kg/m².");

  return (
    <div className="space-y-2.5">
      <div className="grid items-stretch gap-2.5 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
        <div className="overflow-hidden rounded-2xl border border-sglt/20 bg-white shadow-sm">
          <div
            className="h-full px-3 py-2"
            style={{ background: "linear-gradient(180deg, #e6f6ee 0%, #ffffff 100%)" }}
          >
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
              KFRE and PREVENT first. Tick medicines to see relative and absolute reduction. Nothing is stored.
            </p>

            <form className="mt-2 space-y-2" onSubmit={(event) => event.preventDefault()}>
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="Age" hint="years">
                  <input className={inputClass()} type="number" min="18" max="100" value={form.age} onChange={(e) => set("age", e.target.value)} />
                </Field>
                <div className="rounded-xl border border-slate-200 bg-white px-2 py-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Sex</p>
                  <Choice
                    value={form.sex}
                    onChange={(id) => set("sex", id)}
                    options={[
                      { id: "female", label: "Female" },
                      { id: "male", label: "Male" },
                    ]}
                  />
                </div>
                <Field label="eGFR" hint="mL/min/1.73 m²">
                  <input className={inputClass()} type="number" min="5" max="140" step="1" value={form.egfr} onChange={(e) => set("egfr", e.target.value)} />
                </Field>
                <Field label="SBP" hint="mm Hg">
                  <input className={inputClass()} type="number" min="80" max="220" step="1" value={form.sbp} onChange={(e) => set("sbp", e.target.value)} />
                </Field>
              </div>

              <div className="grid gap-1.5 xl:grid-cols-2">
              <div className="rounded-xl border border-sglt/25 bg-sglt-soft/40 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-sglt">Kidney failure · KFRE</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <Field label="UACR" hint={form.uacrUnit === "mgg" ? "mg/g" : "mg/mmol"}>
                    <input className={inputClass()} type="number" min="0.1" step="1" value={form.uacr} onChange={(e) => set("uacr", e.target.value)} />
                  </Field>
                  <div className="rounded-xl border border-slate-200 bg-white px-2 py-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">ACR unit</p>
                    <Choice
                      value={form.uacrUnit}
                      onChange={(id) => set("uacrUnit", id)}
                      options={[
                        { id: "mgg", label: "mg/g" },
                        { id: "mgmmol", label: "mg/mmol" },
                      ]}
                    />
                  </div>
                </div>
                <div className="mt-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Region</p>
                  <Choice
                    value={form.northAmerica ? "na" : "other"}
                    onChange={(id) => set("northAmerica", id === "na")}
                    options={[
                      { id: "na", label: "North America" },
                      { id: "other", label: "Other" },
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-glp/25 bg-glp-soft/50 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-glp">Heart · PREVENT base</p>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  <Field label="Total chol." hint="mg/dL">
                    <input className={inputClass()} type="number" min="80" max="400" step="1" value={form.tc} onChange={(e) => set("tc", e.target.value)} />
                  </Field>
                  <Field label="HDL" hint="mg/dL">
                    <input className={inputClass()} type="number" min="10" max="120" step="1" value={form.hdl} onChange={(e) => set("hdl", e.target.value)} />
                  </Field>
                  <Field label="BMI" hint="kg/m²">
                    <input className={inputClass()} type="number" min="15" max="50" step="0.1" value={form.bmi} onChange={(e) => set("bmi", e.target.value)} />
                  </Field>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <PillCheck className="w-full" checked={form.diabetes} onChange={(e) => set("diabetes", e.target.checked)} label="Diabetes" toneKey="sglt" />
                  <PillCheck className="w-full" checked={form.smoking} onChange={(e) => set("smoking", e.target.checked)} label="Smoking" toneKey="mra" />
                  <PillCheck className="w-full" checked={form.bpmed} onChange={(e) => set("bpmed", e.target.checked)} label="BP therapy" toneKey="glp" />
                  <PillCheck className="w-full" checked={form.statin} onChange={(e) => set("statin", e.target.checked)} label="Statin" toneKey="rasi" />
                </div>
              </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Already started</span>
                {startedMeds.map((med) => (
                  <PillCheck
                    key={med.key}
                    checked={form[med.key]}
                    onChange={(e) => set(med.key, e.target.checked)}
                    label={med.label}
                    toneKey={med.tone}
                  />
                ))}
                <span className="text-[10px] text-muted">RASi is in the baseline.</span>
              </div>
            </form>
          </div>
        </div>

        <RiskReductionSection form={form} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="px-3 py-2"
          style={{ background: "linear-gradient(180deg, #e6f6ee 0%, #ffffff 55%)" }}
        >
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
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Heart horizon</p>
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
          <p className="mt-0.5 text-[10px] text-muted">
            Faint bar is KFRE or PREVENT. Solid bar applies Neuen Figures 1–2 hazard ratios as 1 − (1 − baseline)
            <sup>HR</sup>.
          </p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <OutcomeCard
              category="Kidney"
              title="Kidney failure"
              hint={`KFRE ${kidneyYears}-year dialysis or transplant`}
              color="#0e7c72"
              baseline={kidneyBase}
              treated={kidneyTreated}
              treatedCi={kidneyTreatedCi}
              warning={!kidney ? "Needs age, sex, eGFR, and UACR." : null}
            />
            <OutcomeCard
              category="Heart"
              title="Heart failure"
              hint={`PREVENT ${heartYears}-year incident HF`}
              color="#e11d48"
              baseline={hfBase}
              treated={hfTreated}
              treatedCi={hfTreatedCi}
              warning={!hfBase ? "Needs age, sex, SBP, eGFR, and BMI." : null}
            />
            <OutcomeCard
              category="ASCVD"
              title="ASCVD"
              hint={`PREVENT ${heartYears}-year MI, stroke, or CV death`}
              color="#1a365d"
              baseline={ascvdBase}
              treated={ascvdTreated}
              treatedCi={ascvdTreatedCi}
              extra={
                <p className="mt-0.5 text-center text-[9px] text-muted">
                  Reduced with the Neuen MACE hazard ratio.
                </p>
              }
              warning={!ascvdBase ? "Needs age, sex, SBP, eGFR, total cholesterol, and HDL." : null}
            />
            <div className="rounded-xl border border-slate-200 bg-white p-2">
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Total CVD</p>
              <p className="text-[13px] font-semibold leading-tight text-ink">PREVENT total CVD</p>
              <p className="text-[9px] leading-snug text-muted">
                ASCVD plus HF. Shown as baseline only — not a Neuen endpoint.
              </p>
              <VerticalPair baseline={cvdBase} treated={cvdBase} color="#3d5a80" treatedLabel="Baseline" />
              <p className="mt-1 text-center text-[10px] tabular-nums text-ink">
                {cvdBase != null ? `${formatRiskPct(cvdBase)}% ${heartYears}-year` : "Enter PREVENT inputs."}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[10px] leading-relaxed text-muted">
          {notes.length > 0 ? (
            <ul className="mb-2 space-y-1 text-continue">
              {notes.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          ) : null}
          <p>
            KFRE 4-variable: Tangri et al. JAMA 2011;305:1553–1559, multinational calibration JAMA 2016;315:164–174.
            North America S₀ 0.9750 / 0.9240; other regions 0.9832 / 0.9365. ACR in mg/g (mg/mmol × 8.84).{" "}
            <a className="font-semibold text-sglt underline-offset-2 hover:underline" href="https://kidneyfailurerisk.com/" target="_blank" rel="noreferrer">
              kidneyfailurerisk.com
            </a>
          </p>
          <p className="mt-1">
            PREVENT base model: Khan et al. Circulation 2024;149:430–449. Not for people with known CVD.{" "}
            <a
              className="font-semibold text-sglt underline-offset-2 hover:underline"
              href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator"
              target="_blank"
              rel="noreferrer"
            >
              AHA PREVENT calculator
            </a>
          </p>
          <p className="mt-1">
            Treatment HRs from Neuen et al. Circulation 2024, Figures 1–2, versus conventional care that already includes
            RASi. Applied as an approximation on the absolute-risk scale. Visual aid only.
          </p>
        </div>
      </div>
    </div>
  );
}
