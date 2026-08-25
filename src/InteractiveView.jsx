import { useMemo, useState } from "react";
import { indications } from "./data.js";
import { evaluatePatient } from "./logic.js";
import { bandStyle, tone } from "./theme.js";

const emptyForm = {
  k: "",
  egfr: "",
  uacr: "",
  sbp: "",
  hba1c: "",
  t2d: true,
  egfrDip: false,
  onInsulin: false,
  onRasi: false,
  onSglt: false,
  onFinerenone: false,
  onGlp: false,
};

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

function inputClass() {
  return "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-ink outline-none ring-sglt/30 focus:ring-2";
}

export default function InteractiveView() {
  const [form, setForm] = useState(emptyForm);
  const result = useMemo(() => evaluatePatient(form), [form]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const agentRows = [
    {
      id: "sglt2i",
      name: "SGLT2i",
      tone: "sglt",
      guideline: result.agents.sgltGuideline,
      practice: result.agents.sgltPractice,
    },
    {
      id: "nsmra",
      name: "ns-MRA",
      tone: "mra",
      guideline: result.agents.nsmraGuideline,
      practice: result.agents.nsmraGuideline,
    },
    {
      id: "glp1",
      name: "GLP-1 RA",
      tone: "glp",
      guideline: result.agents.glpGuideline,
      practice: result.agents.glpPractice,
    },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form
        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        onSubmit={(event) => event.preventDefault()}
      >
        <h2 className="text-sm font-semibold text-ink">Enter values</h2>
        <p className="text-[11px] text-muted">Nothing is stored. This stays on your computer.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Serum K⁺" hint="mmol/L">
            <input
              className={inputClass()}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="2"
              max="8"
              value={form.k}
              onChange={(event) => set("k", event.target.value)}
            />
          </Field>
          <Field label="eGFR" hint="mL/min/1.73 m²">
            <input
              className={inputClass()}
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              max="120"
              value={form.egfr}
              onChange={(event) => set("egfr", event.target.value)}
            />
          </Field>
          <Field label="UACR" hint="mg/mmol (3 ≈ 30 mg/g)">
            <input
              className={inputClass()}
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              value={form.uacr}
              onChange={(event) => set("uacr", event.target.value)}
            />
          </Field>
          <Field label="SBP" hint="mmHg">
            <input
              className={inputClass()}
              type="number"
              inputMode="numeric"
              step="1"
              min="50"
              max="250"
              value={form.sbp}
              onChange={(event) => set("sbp", event.target.value)}
            />
          </Field>
          <Field label="HbA1c" hint="%">
            <input
              className={inputClass()}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="4"
              max="16"
              value={form.hba1c}
              onChange={(event) => set("hba1c", event.target.value)}
            />
          </Field>
        </div>

        <fieldset className="mt-3">
          <legend className="text-[11px] font-bold uppercase tracking-wide text-muted">Already started</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              ["onRasi", "RASi"],
              ["onSglt", "SGLT2i"],
              ["onFinerenone", "Finerenone"],
              ["onGlp", "GLP-1 RA"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) => set(key, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-[11px] font-bold uppercase tracking-wide text-muted">Also true</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.t2d} onChange={(event) => set("t2d", event.target.checked)} />
            Type 2 diabetes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.egfrDip}
              onChange={(event) => set("egfrDip", event.target.checked)}
            />
            eGFR dip ≥ 30% vs last labs
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.onInsulin}
              onChange={(event) => set("onInsulin", event.target.checked)}
            />
            On insulin or a secretagogue
          </label>
        </fieldset>

        <button
          type="button"
          onClick={() => setForm(emptyForm)}
          className="mt-5 text-sm font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Clear values
        </button>
      </form>

      <div className="space-y-3">
        {result.band && (
          <div
            className={`rounded-xl border px-3 py-2.5 ${bandStyle[result.band.id].soft} ${bandStyle[result.band.id].border}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">K⁺ band</p>
            <p className={`text-lg font-bold ${bandStyle[result.band.id].text}`}>{result.band.label}</p>
            <p className="mt-1 text-sm text-ink">
              {result.band.range} — {result.band.action}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sglt">Do this now</p>
          <h3 className="font-serif text-lg text-ink">{result.now.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{result.now.detail}</p>
          {result.dose && result.now.stepId === "finerenone" && (
            <p className="mt-3 text-sm font-medium text-ink">eGFR-based dose: {result.dose}</p>
          )}
        </div>

        {result.stops.length > 0 && (
          <div className="rounded-xl border border-pause/30 bg-pause-soft p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-pause">Safety flags</p>
            <ul className="mt-2 space-y-2 text-sm text-ink">
              {result.stops.map((stop) => (
                <li key={stop.id}>· {stop.text}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Indication check</p>
          <div className="mt-3 grid gap-3">
            {agentRows.map((row) => {
              const t = tone[row.tone];
              const item = indications.find((entry) => entry.id === row.id);
              return (
                <div key={row.id} className={`rounded-2xl border p-3 ${t.border}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${t.text}`}>{row.name}</p>
                    <span className="text-[11px] text-muted">
                      {row.guideline ? "Guideline yes" : row.practice ? "Practice only" : "Not indicated"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item?.guideline.join("; ")}</p>
                </div>
              );
            })}
          </div>
        </div>

        {result.notes.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-muted">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink">Also consider</p>
            <ul className="mt-2 space-y-2">
              {result.notes.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
