import { useMemo, useState } from "react";
import { indications } from "./data.js";
import { DIP_30, DIP_30_2, DIP_40, DIP_NONE, evaluatePatient } from "./logic.js";
import { bandStyle, tone } from "./theme.js";

const emptyForm = {
  k: "",
  egfr: "",
  uacr: "",
  uacrUnit: "mgmmol",
  sbp: "",
  hba1c: "",
  t2d: true,
  dip: DIP_NONE,
  onInsulin: false,
  hypoEpisodes: false,
  onRasi: false,
  onSglt: false,
  onFinerenone: false,
  onGlp: false,
};

const labs = [
  { key: "k", label: "K⁺", hint: "mmol/L", min: "2", max: "8", step: "0.1", icon: "k" },
  { key: "egfr", label: "eGFR", hint: "mL/min/1.73 m²", min: "0", max: "120", step: "1", icon: "kidney" },
  { key: "sbp", label: "SBP", hint: "mmHg", min: "50", max: "250", step: "1", icon: "heart" },
  { key: "hba1c", label: "HbA1c", hint: "%", min: "4", max: "16", step: "0.1", icon: "a1c" },
];

const startedMeds = [
  { key: "onRasi", label: "RASi", tone: "rasi" },
  { key: "onSglt", label: "SGLT2i", tone: "sglt" },
  { key: "onFinerenone", label: "Finerenone", tone: "mra" },
  { key: "onGlp", label: "GLP-1 RA", tone: "glp" },
];

/** The four agents in sequence order, with the one-pager's indication text. */
const agentBoard = [
  {
    id: "rasi",
    name: "RASi",
    tone: "rasi",
    startedKey: "onRasi",
    role: "Foundation · start first, at half dose",
    indicationId: null,
  },
  {
    id: "sglt2i",
    name: "SGLT2i",
    tone: "sglt",
    startedKey: "onSglt",
    role: "Target dose · continue below eGFR 20 until RRT",
    indicationId: "sglt2i",
  },
  {
    id: "nsmra",
    name: "ns-MRA",
    tone: "mra",
    startedKey: "onFinerenone",
    role: "Finerenone · recheck K⁺ in 2–4 weeks after starting",
    indicationId: "nsmra",
  },
  {
    id: "glp1",
    name: "GLP-1 RA",
    tone: "glp",
    startedKey: "onGlp",
    role: "Quarter dose to limit GI effects · initiated last",
    indicationId: "glp1",
  },
];

const dipOptions = [
  { id: DIP_NONE, label: "No dip" },
  { id: DIP_30, label: "≥ 30% this visit" },
  { id: DIP_30_2, label: "≥ 30% × 2 labs" },
  { id: DIP_40, label: "≥ 40% vs baseline" },
];

/** Directive kind → the swatch it gets, and which summary panel it belongs to. */
const kindStyle = {
  block: { band: "pause", panel: "block" },
  pause: { band: "pause", panel: "act" },
  stop: { band: "pause", panel: "act" },
  reduce: { band: "reduce", panel: "act" },
  continue: { band: "continue", panel: "act" },
};

function Icon({ name, className = "h-4 w-4" }) {
  const common = { viewBox: "0 0 24 24", fill: "none", className, "aria-hidden": true };
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
  if (name === "block") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="m8.6 8.6 6.8 6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function Segmented({ value, onChange, options, className = "" }) {
  return (
    <div className={`flex rounded-lg bg-slate-100 p-0.5 ${className}`}>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
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

/** One agent: is it indicated, and what do these values tell you to do with it. */
function AgentCard({ agent, result, started, isNext }) {
  const t = tone[agent.tone];
  // A drug that is not running yet can only be blocked from starting; "pause"
  // and "reduce" advice is about something already in use.
  const all = result.directives[agent.id] ?? [];
  const directives = started ? all : all.filter((d) => d.kind === "block" || d.kind === "stop");
  const status = result.statuses[agent.id];
  const item = agent.indicationId ? indications.find((entry) => entry.id === agent.indicationId) : null;
  const statusTone = status.band ? bandStyle[status.band] : null;

  let level = null;
  if (agent.indicationId === "sglt2i") level = result.agents.sgltGuideline ? "Guideline" : result.agents.sgltPractice ? "Practice" : null;
  if (agent.indicationId === "nsmra") level = result.agents.nsmraGuideline ? "Guideline" : result.agents.nsmraPractice ? "Practice" : null;
  if (agent.indicationId === "glp1") level = result.agents.glpGuideline ? "Guideline" : result.agents.glpPractice ? "Practice" : null;

  const icon =
    status.id === "ready" || status.id === "continue"
      ? "check"
      : status.id === "notIndicated"
        ? "idle"
        : status.id === "blocked"
          ? "block"
          : "alert";

  return (
    <div className={`rounded-xl border p-2 ${t.border} ${isNext ? t.bg : "bg-white"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className={`text-[13px] font-bold ${t.text}`}>{agent.name}</p>
        <span
          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            statusTone ? `${statusTone.soft} ${statusTone.text}` : "text-muted"
          }`}
        >
          <Icon name={icon} className="h-3 w-3" />
          {status.label}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] leading-snug text-muted">
        {started ? "Already started · " : ""}
        {agent.role}
      </p>

      {item ? (
        <p className="mt-1 text-[10px] leading-snug text-ink/75">
          <span className="font-semibold text-ink">{level ?? "Not met"}</span>
          {" · "}
          {level === "Practice" ? item.practice[0] : item.guideline.join(" or ")}
        </p>
      ) : null}

      {directives.length > 0 ? (
        <ul className="mt-1 space-y-0.5">
          {directives.map((directive) => {
            const ds = bandStyle[kindStyle[directive.kind].band];
            return (
              <li
                key={directive.id}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-snug ${ds.soft} ${ds.text}`}
              >
                {directive.text}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function InteractiveView() {
  const [form, setForm] = useState(emptyForm);
  const result = useMemo(() => evaluatePatient(form), [form]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const nextAgent =
    result.now.stepId === "rasi"
      ? "rasi"
      : result.now.stepId === "sglt2i"
        ? "sglt2i"
        : result.now.stepId === "finerenone"
          ? "nsmra"
          : result.now.stepId === "glp1"
            ? "glp1"
            : null;

  const bandTone = result.band ? bandStyle[result.band.id] : null;

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

              <label className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                  <Icon name="uacr" className="h-3.5 w-3.5 text-sglt" />
                  UACR
                </span>
                <input
                  className="mt-0.5 w-full bg-transparent text-sm text-ink outline-none"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0"
                  value={form.uacr}
                  onChange={(event) => set("uacr", event.target.value)}
                />
                <Segmented
                  className="mt-0.5"
                  value={form.uacrUnit}
                  onChange={(id) => set("uacrUnit", id)}
                  options={[
                    { id: "mgmmol", label: "mg/mmol" },
                    { id: "mgg", label: "mg/g" },
                  ]}
                />
              </label>
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
              <PillCheck
                checked={form.onInsulin}
                onChange={(event) => set("onInsulin", event.target.checked)}
                label="On insulin / secretagogue"
                toneKey="glp"
              />
              <PillCheck
                checked={form.hypoEpisodes}
                onChange={(event) => set("hypoEpisodes", event.target.checked)}
                label="≥ 2 hypo episodes/wk (Level 2–3)"
                toneKey="glp"
              />
              <span className="ml-1 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted">eGFR dip</span>
                <Segmented value={form.dip} onChange={(id) => set("dip", id)} options={dipOptions} />
              </span>
            </div>
          </form>
        </div>

        <div className="grid gap-2 bg-slate-50/80 p-2.5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className={`rounded-2xl border px-3 py-2.5 ${bandTone ? `${bandTone.soft} ${bandTone.border}` : "border-slate-200 bg-white"}`}>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted">
              <Icon name="k" className="h-3.5 w-3.5" />
              K⁺ band
            </p>
            {result.band ? (
              <>
                <p className={`text-lg font-bold leading-tight ${bandTone.text}`}>{result.band.label}</p>
                <p className="text-[11px] font-semibold text-ink/70">{result.band.range}</p>
                <ul className="mt-1 space-y-0.5">
                  {result.kActions.map((action) => (
                    <li key={action} className="text-[11px] leading-snug text-ink">
                      · {action}
                    </li>
                  ))}
                </ul>
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
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {result.now.dose ? (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-ink">{result.now.dose}</span>
              ) : null}
              {result.now.recheck ? (
                <span className="rounded-md bg-sglt-soft px-1.5 py-0.5 text-[11px] font-medium text-sglt">{result.now.recheck}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
            Sequence · indication and what is blocking each agent
          </p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {agentBoard.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                result={result}
                started={Boolean(form[agent.startedKey])}
                isNext={nextAgent === agent.id}
              />
            ))}
          </div>
        </div>
      </div>

      {["block", "act"].map((panel) => {
        const items = result.allDirectives.filter((d) => kindStyle[d.kind].panel === panel);
        if (items.length === 0) return null;
        const isBlock = panel === "block";
        return (
          <div
            key={panel}
            className={`rounded-2xl border px-3 py-2 ${isBlock ? "border-pause/30 bg-pause-soft" : "border-reduce/30 bg-reduce-soft"}`}
          >
            <p className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${isBlock ? "text-pause" : "text-reduce"}`}>
              <Icon name="alert" className="h-3.5 w-3.5" />
              {isBlock ? "Do not initiate or titrate" : "Stop, pause or reduce what is running"}
            </p>
            <ul className="mt-1 space-y-1 text-[12px] text-ink">
              {items.map((directive) => (
                <li key={directive.id}>
                  · <span className="font-semibold">{directive.text}</span> —{" "}
                  {directive.agents.map((id) => agentBoard.find((a) => a.id === id)?.name).join(", ")}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

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
    </div>
  );
}
