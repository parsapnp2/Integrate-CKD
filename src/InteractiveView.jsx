import { useMemo, useState } from "react";
import { indications } from "./data.js";
import { evaluatePatient } from "./logic.js";
import { bandStyle, tone } from "./theme.js";
import RiskReductionSection from "./RiskReductionSection.jsx";

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

const labs = [
  { key: "k", label: "K⁺", hint: "mmol/L", min: "2", max: "8", step: "0.1", icon: "k" },
  { key: "egfr", label: "eGFR", hint: "mL/min/1.73 m²", min: "0", max: "120", step: "1", icon: "kidney" },
  { key: "uacr", label: "UACR", hint: "mg/mmol", min: "0", step: "1", icon: "uacr" },
  { key: "sbp", label: "SBP", hint: "mmHg", min: "50", max: "250", step: "1", icon: "heart" },
  { key: "hba1c", label: "HbA1c", hint: "%", min: "4", max: "16", step: "0.1", icon: "a1c" },
];

const startedMeds = [
  { key: "onRasi", label: "RASi", tone: "rasi" },
  { key: "onSglt", label: "SGLT2i", tone: "sglt" },
  { key: "onFinerenone", label: "Finerenone", tone: "mra" },
  { key: "onGlp", label: "GLP-1 RA", tone: "glp" },
];

function Icon({ name, className = "h-4 w-4" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    className,
    "aria-hidden": true,
  };
  if (name === "k") {
    return (
      <svg {...common}>
        <path d="M12 3.5c3.2 5.2 6.5 8.2 6.5 12.1A6.5 6.5 0 1 1 5.5 15.6C5.5 11.7 8.8 8.7 12 3.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 14.5h4M12 12.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "kidney") {
    return (
      <svg {...common}>
        <path d="M14 4.5c3.4 0 5 3.2 4.6 7.2-.4 4.2-2.3 8.2-5.8 8.6-3.4.3-5.4-2.8-4.8-6.8.3-2 .7-3.2.7-5.1C9.7 6 11.3 4.5 14 4.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11.5 9.5c1.4.7 2.1 2.3 2.1 3.7s-.8 2.7-2.1 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "uacr") {
    return (
      <svg {...common}>
        <path d="M9 4h6v3.2c2.6 2.2 4 4.6 4 7.4A7 7 0 1 1 5 14.6c0-2.8 1.4-5.2 4-7.4V4Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 4h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M12 19s-7-4.6-7-9.1C5 7.2 7.1 5.5 9.4 6.2c1 .3 1.9 1.7 2.6 1.7s1.6-1.4 2.6-1.7c2.3-.7 4.4 1 4.4 3.7C19 14.4 12 19 12 19Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === "a1c") {
    return (
      <svg {...common}>
        <path d="M5 16.5 9.2 11l3.2 3.4L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "idle") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (name === "now") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v4.2L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="m8.5 12.2 2.4 2.4 4.6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "alert") {
    return (
      <svg {...common}>
        <path d="M12 4.8 20.2 19H3.8L12 4.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 10v4.2M12 16.8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "note") {
    return (
      <svg {...common}>
        <path d="M7 5.5h10v13H7z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.5 9h5M9.5 12.5h5M9.5 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

function PillCheck({ checked, onChange, label, toneKey }) {
  const t = tone[toneKey] ?? tone.ink;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm font-semibold transition ${
        checked ? `${t.bg} ${t.border} ${t.text}` : "border-slate-200 bg-white text-ink hover:border-slate-300"
      }`}
    >
      <input type="checkbox" className="accent-current" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
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
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-sglt/20 bg-white shadow-sm">
        <div
          className="border-b border-slate-100 px-3 py-2.5"
          style={{ background: "linear-gradient(180deg, #e6f6ee 0%, #ffffff 100%)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-sglt">Patient snapshot</p>
              <h2 className="font-serif text-base leading-tight text-ink">Enter values</h2>
            </div>
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">Nothing is stored. This stays on your computer.</p>

          <form className="mt-2.5" onSubmit={(event) => event.preventDefault()}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {labs.map((lab) => (
                <label key={lab.key} className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                    <Icon name={lab.icon} className="h-3.5 w-3.5 text-sglt" />
                    {lab.label}
                  </span>
                  <input
                    className="mt-0.5 w-full bg-transparent text-sm text-ink outline-none"
                    type="number"
                    inputMode="decimal"
                    step={lab.step}
                    min={lab.min}
                    max={lab.max}
                    value={form[lab.key]}
                    onChange={(event) => set(lab.key, event.target.value)}
                  />
                  <span className="block text-[10px] text-muted">{lab.hint}</span>
                </label>
              ))}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Already started</span>
              {startedMeds.map((med) => (
                <PillCheck
                  key={med.key}
                  checked={form[med.key]}
                  onChange={(event) => set(med.key, event.target.checked)}
                  label={med.label}
                  toneKey={med.tone}
                />
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Also true</span>
              <PillCheck checked={form.t2d} onChange={(event) => set("t2d", event.target.checked)} label="Type 2 diabetes" toneKey="sglt" />
              <PillCheck checked={form.egfrDip} onChange={(event) => set("egfrDip", event.target.checked)} label="eGFR dip ≥ 30%" toneKey="mra" />
              <PillCheck checked={form.onInsulin} onChange={(event) => set("onInsulin", event.target.checked)} label="On insulin / secretagogue" toneKey="glp" />
            </div>
          </form>
        </div>

        <div className="grid gap-2 bg-slate-50/80 p-2.5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.1fr)_minmax(0,1.2fr)]">
          <div
            className={`rounded-2xl border px-3 py-2.5 ${
              result.band
                ? `${bandStyle[result.band.id].soft} ${bandStyle[result.band.id].border}`
                : "border-slate-200 bg-white"
            }`}
          >
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
              <Icon name="k" className="h-3.5 w-3.5" />
              K⁺ band
            </p>
            {result.band ? (
              <>
                <p className={`text-lg font-bold ${bandStyle[result.band.id].text}`}>{result.band.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink">
                  {result.band.range} — {result.band.action}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Add K⁺ to see the band.</p>
            )}
          </div>

          <div className="rounded-2xl border border-sglt/25 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-sglt">
              <Icon name="now" className="h-3.5 w-3.5" />
              Do this now
            </p>
            <h3 className="font-serif text-base leading-tight text-ink">{result.now.title}</h3>
            <p className="mt-1 text-[12px] leading-snug text-muted">{result.now.detail}</p>
            {result.dose && result.now.stepId === "finerenone" ? (
              <p className="mt-1.5 text-[12px] font-medium text-ink">eGFR-based dose: {result.dose}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Indication check</p>
            <div className="mt-1.5 space-y-1.5">
              {agentRows.map((row) => {
                const t = tone[row.tone];
                const item = indications.find((entry) => entry.id === row.id);
                const status = row.guideline ? "Guideline" : row.practice ? "Practice" : "No";
                return (
                  <div key={row.id} className={`flex items-center justify-between gap-2 rounded-xl border px-2 py-1.5 ${t.border} ${t.bg}`} title={item?.guideline.join("; ")}>
                    <p className={`flex items-center gap-1 text-xs font-bold ${t.text}`}>
                      <Icon name={row.guideline || row.practice ? "check" : "idle"} className="h-3.5 w-3.5" />
                      {row.name}
                    </p>
                    <span className="text-[10px] font-semibold text-ink/70">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {result.stops.length > 0 ? (
        <div className="rounded-2xl border border-pause/30 bg-pause-soft px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-pause">
            <Icon name="alert" className="h-3.5 w-3.5" />
            Safety flags
          </p>
          <ul className="mt-1 space-y-1 text-[12px] text-ink">
            {result.stops.map((stop) => (
              <li key={stop.id}>· {stop.text}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.notes.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-muted">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink">
            <Icon name="note" className="h-3.5 w-3.5 text-sglt" />
            Also consider
          </p>
          <ul className="mt-1 space-y-1">
            {result.notes.map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <RiskReductionSection form={form} agents={result.agents} />
    </div>
  );
}
