import { Fragment, useMemo, useState } from "react";
import { indications, kBands } from "./data.js";
import { DIP_30, DIP_30_2, DIP_40, DIP_NONE, evaluatePatient } from "./logic.js";
import Icon from "./PatientIcons.jsx";
import { AGENT_COLOR, AGENT_ICON, BAND_COLOR, WARM_THEME } from "./uiTheme.js";
import { updateFormField } from "./formUnits.js";
import RangeInput from "./RangeInput.jsx";
import { interactiveRange } from "./inputRanges.js";
import PotassiumSafetyNote from "./PotassiumSafetyNote.jsx";

/*
 * Presentation only. Every clinical decision on this page still comes from
 * evaluatePatient() in logic.js; nothing here computes, reorders or filters a
 * rule. Changing the layout must never change what the algorithm says.
 */

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
  { key: "k", label: "K⁺", hint: "mmol/L", min: "2", max: "8", step: "0.1", icon: "potassium" },
  { key: "egfr", label: "eGFR", hint: "mL/min/1.73 m²", min: "0", max: "120", step: "1", icon: "kidney" },
  { key: "hba1c", label: "HbA1c", hint: "%", min: "4", max: "16", step: "0.1", icon: "sugar" },
];

const startedMeds = [
  { key: "onRasi", id: "rasi", label: "RASi" },
  { key: "onSglt", id: "sglt2i", label: "SGLT2i" },
  { key: "onFinerenone", id: "nsmra", label: "Finerenone" },
  { key: "onGlp", id: "glp1", label: "GLP-1 RA" },
];

/** The four agents in sequence order, with the one-pager's indication text. */
const agentBoard = [
  { id: "rasi", step: 1, name: "RASi", startedKey: "onRasi", role: "Foundation · start first, at half dose", indicationId: null },
  { id: "sglt2i", step: 2, name: "SGLT2i", startedKey: "onSglt", role: "Target dose · continue below eGFR 20 until RRT", indicationId: "sglt2i" },
  { id: "nsmra", step: 3, name: "ns-MRA", startedKey: "onFinerenone", role: "Finerenone · recheck K⁺ in 2–4 weeks after starting", indicationId: "nsmra" },
  { id: "glp1", step: 4, name: "GLP-1 RA", startedKey: "onGlp", role: "Quarter dose to limit GI effects · initiated last", indicationId: "glp1" },
];

const dipOptions = [
  { id: DIP_NONE, label: "No dip" },
  { id: DIP_30, label: "≥ 30% this visit" },
  { id: DIP_30_2, label: "≥ 30% × 2 labs" },
  { id: DIP_40, label: "≥ 40% vs baseline" },
];

/** Directive kind → severity colour, glyph, and which summary panel it belongs to. */
const kindStyle = {
  block: { band: "pause", panel: "block", icon: "block", verb: "Do not start or titrate" },
  pause: { band: "pause", panel: "act", icon: "pause", verb: "Pause" },
  stop: { band: "pause", panel: "act", icon: "block", verb: "Stop or reduce" },
  reduce: { band: "reduce", panel: "act", icon: "minus", verb: "Reduce" },
  continue: { band: "continue", panel: "act", icon: "check", verb: "Continue" },
};

/**
 * The words shown for each K⁺ band. One escalation vocabulary is used because a
 * label can cover several agents at once, while "reduce" or "pause" belongs to
 * one drug; what to do with each drug stays in the directive lines below it.
 */
const SEVERITY_LABEL = {
  proceed: "Safe",
  continue: "Caution",
  reduce: "High",
  pause: "Critical",
};

/**
 * The same vocabulary per agent, by status id rather than by status colour, so a
 * gate on starting or titrating reads as a caution while K⁺ over 6.0 reads as
 * critical. "continue" is left out on purpose: it covers both an untroubled agent
 * and one held at K⁺ 4.8–5.5, so it falls through to the band wording above.
 */
const STATUS_SEVERITY = {
  urgent: "Urgent potassium review",
  ready: "Safe",
  notIndicated: "Not indicated",
  blocked: "Caution",
  noTitrate: "Caution",
  reduce: "High",
  stop: "Critical",
  pause: "Critical",
};

/** Status id → glyph. Colour always travels with this label, never alone. */
const statusIcon = {
  ready: "check",
  continue: "check",
  notIndicated: "minus",
  blocked: "block",
  pause: "pause",
  stop: "block",
  reduce: "minus",
  noTitrate: "alert",
};

const soft = (color, pct = 12) => `color-mix(in srgb, ${color} ${pct}%, white)`;

/**
 * The potassium scale, drawn from 3.5 to 6.5 so the four published bands fit
 * with a little room either side. Band widths and axis ticks both come from
 * these boundaries, which keeps a tick under the edge it names.
 */
const K_BOUNDS = [3.5, 4.8, 5.5, 6.0, 6.5];
const kPercent = (value) => ((value - K_BOUNDS[0]) / (K_BOUNDS[K_BOUNDS.length - 1] - K_BOUNDS[0])) * 100;
/** Keep a label inside the track when it sits on or near either end. */
const edgeShift = (pct) => (pct <= 4 ? "0%" : pct >= 96 ? "-100%" : "-50%");

/* ------------------------------------------------------------------ pieces */

function Group({ icon, title, hint, accent, aside, children, contentClass = "" }) {
  return (
    <section
      className="flex flex-col rounded-2xl border p-2.5"
      style={{ borderColor: "var(--p-line)", background: "var(--p-card)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: soft(accent, 14), color: accent }}
        >
          <Icon name={icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold leading-tight" style={{ color: "var(--p-ink)" }}>
            {title}
          </p>
          {hint ? (
            <p className="text-[10px] leading-tight" style={{ color: "var(--p-muted)" }}>
              {hint}
            </p>
          ) : null}
        </div>
        {aside}
      </div>
      <div className={`mt-2 flex flex-col ${contentClass}`}>{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label, color, icon, className = "" }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold transition ${className}`}
      style={{
        borderColor: checked ? color : "var(--p-line)",
        background: checked ? soft(color, 10) : "var(--p-card)",
        color: checked ? color : "var(--p-muted)",
      }}
    >
      <input type="checkbox" className="h-3.5 w-3.5" style={{ accentColor: color }} checked={checked} onChange={onChange} />
      {icon ? <Icon name={icon} size={14} /> : null}
      {label}
    </label>
  );
}

function Segmented({ value, onChange, options, className = "" }) {
  return (
    <div className={`flex flex-wrap rounded-lg p-0.5 ${className}`} style={{ background: "var(--p-sand)" }}>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className="rounded-md px-2 py-0.5 text-[11px] font-semibold transition"
            style={{
              background: active ? "var(--p-card)" : "transparent",
              color: active ? "var(--p-ink)" : "var(--p-muted)",
              boxShadow: active ? "0 1px 2px rgba(45,42,38,.12)" : "none",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function LabField({ lab, value, onChange, children, range }) {
  return (
    <label
      className="flex flex-col items-start rounded-xl border px-2.5 py-1.5"
      style={{ borderColor: "var(--p-line)", background: "var(--p-cream)" }}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide" style={{ color: "var(--p-muted)" }}>
        <span style={{ color: "var(--p-kidney)" }}>
          <Icon name={lab.icon} size={14} />
        </span>
        {lab.label}
      </span>
      <RangeInput
        range={range}
        className="mt-0.5 w-full bg-transparent text-left text-sm outline-none"
        style={{ color: "var(--p-ink)" }}
        type="number"
        inputMode="decimal"
        step={lab.step}
        min={lab.min}
        max={lab.max}
        value={value}
        onChange={onChange}
      />
      {children}
    </label>
  );
}

/**
 * The potassium key drawn as a scale. The band itself still comes from
 * logic.js; this only places a marker on the ranges already in data.js.
 */
function PotassiumScale({ k, band }) {
  const value = Number(k);
  const hasValue = k !== "" && Number.isFinite(value);
  const position = hasValue ? Math.min(100, Math.max(0, kPercent(value))) : null;
  return (
    <div>
      <div className="relative mb-0.5 h-3.5">
        {position != null ? (
          <>
            <span
              className="absolute top-0 whitespace-nowrap text-[10px] font-bold leading-none transition-all duration-500"
              style={{ left: `${position}%`, transform: `translateX(${edgeShift(position)})`, color: "var(--p-ink)" }}
            >
              {value}
            </span>
            <span
              className="absolute bottom-0 h-2 w-0.5 -translate-x-1/2 transition-all duration-500"
              style={{ left: `${position}%`, background: "var(--p-ink)" }}
            />
          </>
        ) : null}
      </div>
      <div className="flex h-5 w-full overflow-hidden rounded-lg">
        {kBands.map((entry, index) => (
          <div
            key={entry.id}
            className="relative flex items-center justify-center"
            style={{
              width: `${kPercent(K_BOUNDS[index + 1]) - kPercent(K_BOUNDS[index])}%`,
              background: soft(BAND_COLOR[entry.id], band?.id === entry.id ? 34 : 14),
              color: BAND_COLOR[entry.id],
            }}
            title={`${SEVERITY_LABEL[entry.id] ?? entry.label} · ${entry.range}`}
          >
            <span className="text-[9px] font-bold uppercase tracking-wide">{SEVERITY_LABEL[entry.id] ?? entry.label}</span>
          </div>
        ))}
      </div>
      {/* Ticks sit at the boundary they name, on the same scale as the bands above. */}
      <div className="relative mt-0.5 h-2.5 text-[9px] font-semibold" style={{ color: "var(--p-muted)" }}>
        {K_BOUNDS.map((bound, index) => {
          const pct = kPercent(bound);
          const isEdge = index === 0 || index === K_BOUNDS.length - 1;
          return (
            <Fragment key={bound}>
              {isEdge ? null : (
                <span className="absolute top-0 h-1 w-px -translate-x-1/2" style={{ left: `${pct}%`, background: "var(--p-line)" }} />
              )}
              <span className="absolute bottom-0 leading-none" style={{ left: `${pct}%`, transform: `translateX(${edgeShift(pct)})` }}>
                {bound.toFixed(1)}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function DirectiveChip({ directive, compact = false }) {
  const style = kindStyle[directive.kind];
  const color = BAND_COLOR[style.band];
  return (
    <li
      className={`flex items-start gap-1.5 rounded-lg px-2 ${compact ? "py-1 text-[10px]" : "py-1.5 text-[12px]"} leading-snug`}
      style={{ background: soft(color, 12), color: "var(--p-ink)" }}
    >
      <span className="mt-px shrink-0" style={{ color }}>
        <Icon name={style.icon} size={compact ? 13 : 15} />
      </span>
      <span className="min-w-0">{directive.text}</span>
    </li>
  );
}

/** One agent: is it indicated, and what do these values tell you to do with it. */
function AgentCard({ agent, result, started, isNext }) {
  const color = AGENT_COLOR[agent.id];
  // A drug that is not running yet can only be blocked from starting; "pause"
  // and "reduce" advice is about something already in use.
  const all = result.directives[agent.id] ?? [];
  const directives = started ? all : all.filter((d) => d.kind === "block" || d.kind === "stop");
  const status = result.statuses[agent.id];
  const item = agent.indicationId ? indications.find((entry) => entry.id === agent.indicationId) : null;
  const statusColor = status.band ? BAND_COLOR[status.band] : "var(--p-muted)";
  const statusLabel = STATUS_SEVERITY[status.id] ?? SEVERITY_LABEL[status.band] ?? status.label;

  let level = null;
  if (!result.inputIssues.length) {
    if (agent.indicationId === "sglt2i") level = result.agents.sgltGuideline ? "Guideline" : result.agents.sgltPractice ? "Practice" : null;
    if (agent.indicationId === "nsmra") level = result.agents.nsmraGuideline ? "Guideline" : result.agents.nsmraPractice ? "Practice" : null;
    if (agent.indicationId === "glp1") level = result.agents.glpGuideline ? "Guideline" : result.agents.glpPractice ? "Practice" : null;
  }

  return (
    <div
      className="flex h-full flex-col rounded-2xl border p-2.5 transition-shadow"
      style={{
        borderColor: isNext ? color : "var(--p-line)",
        background: "var(--p-card)",
        boxShadow: isNext ? `0 0 0 1px ${color}, 0 8px 24px -16px rgba(45,42,38,.5)` : "none",
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: soft(color, started ? 20 : 11), color }}
        >
          <Icon name={AGENT_ICON[agent.id]} size={21} />
          <span
            className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: color }}
          >
            {agent.step}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-tight" style={{ color }}>
            {agent.name}
          </p>
          <p className="text-[10px] leading-snug" style={{ color: "var(--p-muted)" }}>
            {started ? "Already started · " : ""}
            {agent.role}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: status.band ? soft(statusColor, 14) : "var(--p-sand)", color: statusColor }}
        >
          <Icon name={statusIcon[status.id] ?? "alert"} size={12} />
          {statusLabel}
        </span>
        {isNext ? (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: color }}
          >
            <Icon name="target" size={12} />
            This step
          </span>
        ) : null}
        {item ? (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: level ? soft(BAND_COLOR.proceed, 12) : "var(--p-sand)",
              color: level ? BAND_COLOR.proceed : "var(--p-muted)",
            }}
          >
            <Icon name={level ? "check" : "minus"} size={12} />
            {level ?? (result.inputIssues.length ? "Awaiting inputs" : "Not met")}
          </span>
        ) : null}
      </div>

      {item ? (
        <p className="mt-1.5 text-[10px] leading-snug" style={{ color: "var(--p-muted)" }}>
          {level === "Practice" ? item.practice[0] : item.guideline.join(" or ")}
        </p>
      ) : null}

      {directives.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {directives.map((directive) => (
            <DirectiveChip key={directive.id} directive={directive} compact />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- view */

export default function InteractiveView() {
  const [form, setForm] = useState(emptyForm);
  const result = useMemo(() => evaluatePatient(form), [form]);

  function set(key, value) {
    setForm((current) => updateFormField(current, key, value));
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

  const bandColor = result.urgency ? BAND_COLOR.pause : result.band ? BAND_COLOR[result.band.id] : null;
  const nextColor = result.urgency ? BAND_COLOR.pause : nextAgent ? AGENT_COLOR[nextAgent] : "var(--p-kidney)";
  const startedCount = startedMeds.filter((med) => form[med.key]).length;

  return (
    <div className="space-y-2.5" style={{ ...WARM_THEME, color: "var(--p-ink)" }}>
      {result.urgency ? (
        <div role="alert" className="rounded-2xl border-2 p-3" style={{ borderColor: BAND_COLOR.pause, background: soft(BAND_COLOR.pause, 8) }}>
          <h2 className="font-bold" style={{ color: BAND_COLOR.pause }}>{result.urgency.title}</h2>
          <p className="mt-1 text-sm">{result.urgency.detail}</p>
          <PotassiumSafetyNote />
        </div>
      ) : null}
      {/* ------------------------------------------------------------ inputs */}
      <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: "var(--p-line)", background: "var(--p-card)" }}>
        <div
          className="px-3 pb-1 pt-2.5"
          style={{ background: "linear-gradient(155deg, #e9f4ef 0%, var(--p-cream) 45%, var(--p-sand) 100%)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: soft("var(--p-kidney)", 16), color: "var(--p-kidney)" }}
              >
                <Icon name="clipboard" size={20} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--p-kidney)" }}>
                  Patient snapshot
                </p>
                <h2 className="font-serif text-base leading-tight">Enter values</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: "var(--p-muted)" }}>
                Nothing is stored
              </span>
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{ borderColor: "var(--p-line)", background: "var(--p-card)", color: "var(--p-muted)" }}
              >
                <Icon name="trash" size={13} />
                Clear
              </button>
            </div>
          </div>

          {/* Column widths follow how much each group holds, so the four cards
              end up close in height and the row has no dead strip. */}
          <form
            className="mt-2 grid items-start gap-2 lg:grid-cols-2 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.95fr)]"
            onSubmit={(event) => event.preventDefault()}
          >
            <Group icon="potassium" title="Labs" hint="Potassium, filtering, glycemia" accent="var(--p-kidney)">
              <div className="grid grid-cols-3 items-start gap-1.5">
                {labs.map((lab) => (
                  <LabField key={lab.key} lab={lab} range={interactiveRange(lab.key, form)} value={form[lab.key]} onChange={(event) => set(lab.key, event.target.value)} />
                ))}
              </div>
            </Group>

            <Group icon="droplet" title="Albuminuria and BP" hint="Urine ACR, systolic" accent="var(--p-heart)">
              <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-1.5">
                {/* The unit switch sits with the field it applies to, which keeps
                    the card header on one line. */}
                <LabField
                  lab={{
                    label: "UACR",
                    icon: "droplet",
                    step: "1",
                    min: "0",
                    max: undefined,
                    hint: form.uacrUnit === "mgg" ? "mg/g" : "mg/mmol",
                  }}
                  range={interactiveRange("uacr", form)}
                  value={form.uacr}
                  onChange={(event) => set("uacr", event.target.value)}
                >
                  <Segmented
                    className="mt-1"
                    value={form.uacrUnit}
                    onChange={(id) => set("uacrUnit", id)}
                    options={[
                      { id: "mgmmol", label: "mg/mmol" },
                      { id: "mgg", label: "mg/g" },
                    ]}
                  />
                </LabField>
                <LabField
                  lab={{ label: "SBP", icon: "heart", step: "1", min: "50", max: "250", hint: "mmHg" }}
                  range={interactiveRange("sbp", form)}
                  value={form.sbp}
                  onChange={(event) => set("sbp", event.target.value)}
                />
              </div>
            </Group>

            <Group
              icon="person"
              title="Clinical context"
              hint="Diabetes, hypoglycemia, eGFR trajectory"
              accent="var(--p-mace)"
              contentClass="gap-1.5"
            >
              <div className="flex flex-wrap gap-1.5">
                <Toggle checked={form.t2d} onChange={(e) => set("t2d", e.target.checked)} label="Type 2 diabetes" color="var(--p-kidney)" icon="sugar" />
                <Toggle checked={form.onInsulin} onChange={(e) => set("onInsulin", e.target.checked)} label="Insulin / secretagogue" color="var(--p-mace)" icon="syringe" />
                <Toggle
                  checked={form.hypoEpisodes}
                  onChange={(e) => set("hypoEpisodes", e.target.checked)}
                  label="≥ 2 hypos/wk (Level 2–3)"
                  color="var(--p-heart)"
                  icon="alert"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="flex items-center gap-1 text-[10px] font-bold tracking-wide" style={{ color: "var(--p-muted)" }}>
                  <Icon name="trend" size={13} />
                  eGFR dip
                </p>
                <Segmented value={form.dip} onChange={(id) => set("dip", id)} options={dipOptions} />
              </div>
            </Group>

            <Group icon="pill" title="Already started" hint={`${startedCount} of 4 agents running`} accent="var(--p-death)">
              <div className="grid grid-cols-2 gap-1.5">
                {startedMeds.map((med) => (
                  <Toggle
                    key={med.key}
                    checked={form[med.key]}
                    onChange={(event) => set(med.key, event.target.checked)}
                    label={med.label}
                    color={AGENT_COLOR[med.id]}
                    icon={AGENT_ICON[med.id]}
                  />
                ))}
              </div>
            </Group>
          </form>
        </div>

        {/* --------------------------------------------------------- verdict */}
        <div
          className="grid items-stretch gap-2 border-t p-1.5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          style={{ borderColor: "var(--p-line)", background: "var(--p-bg)" }}
        >
          <div
            className="rounded-2xl border px-3 py-1.5"
            style={{ borderColor: bandColor ?? "var(--p-line)", background: bandColor ? soft(bandColor, 8) : "var(--p-card)" }}
          >
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
              <Icon name="potassium" size={14} />
              K⁺ band
            </p>
            {result.band ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold leading-tight" style={{ color: bandColor }}>
                    {result.urgency ? "Urgent review" : result.band.id === "proceed" ? "Within K⁺ threshold" : SEVERITY_LABEL[result.band.id] ?? result.band.label}
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--p-muted)" }}>
                    {result.band.range}
                  </p>
                </div>
                <div className="mt-1">
                  <PotassiumScale k={form.k} band={result.band} />
                </div>
                <ul className="mt-1 space-y-0.5">
                  {result.kActions.map((action) => (
                    <li key={action} className="flex items-start gap-1.5 text-[10px] leading-snug">
                      <span className="mt-px shrink-0" style={{ color: bandColor }}>
                        <Icon name="arrow" size={13} />
                      </span>
                      {action}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="mt-1 text-[12px]" style={{ color: "var(--p-muted)" }}>
                  Add K⁺ to see the band.
                </p>
                <div className="mt-2 opacity-50">
                  <PotassiumScale k="" band={null} />
                </div>
              </>
            )}
          </div>

          <div className="h-full rounded-2xl border px-3 py-1.5" style={{ borderColor: nextColor, background: "var(--p-card)" }}>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: nextColor }}>
              <Icon name="target" size={14} />
              Do this now
            </p>
            <div className="mt-1 flex items-start gap-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: soft(nextColor, 14), color: nextColor }}
              >
                <Icon name={nextAgent ? AGENT_ICON[nextAgent] : "clipboard"} size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-base leading-tight">{result.now.title}</h3>
                <p className="mt-0.5 text-[12px] leading-snug" style={{ color: "var(--p-muted)" }}>
                  {result.now.detail}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.now.dose ? (
                <span
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"
                  style={{ background: "var(--p-sand)", color: "var(--p-ink)" }}
                >
                  <Icon name="pill" size={13} />
                  {result.now.dose}
                </span>
              ) : null}
              {result.now.recheck ? (
                <span
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"
                  style={{ background: soft("var(--p-kidney)", 12), color: "var(--p-kidney)" }}
                >
                  <Icon name="clock" size={13} />
                  {result.now.recheck}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------- sequence */}
        <div className="border-t p-2.5" style={{ borderColor: "var(--p-line)" }}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
            <Icon name="arrow" size={14} />
            Sequence · indication and what is blocking each agent
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* --------------------------------------------------------- summaries */}
      {["block", "act"].map((panel) => {
        const items = result.allDirectives.filter((d) => kindStyle[d.kind].panel === panel);
        if (items.length === 0) return null;
        const isBlock = panel === "block";
        const color = isBlock ? BAND_COLOR.pause : BAND_COLOR.reduce;
        return (
          <div key={panel} className="rounded-2xl border px-3 py-2.5" style={{ borderColor: color, background: soft(color, 7) }}>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color }}>
              <Icon name={isBlock ? "block" : "alert"} size={15} />
              {isBlock ? "Do not initiate or titrate" : "Adjust what is already running"}
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {items.map((directive) => (
                <li key={directive.id} className="flex flex-wrap items-start gap-x-2 gap-y-1 text-[12px] leading-snug">
                  <span className="mt-px shrink-0" style={{ color }}>
                    <Icon name={kindStyle[directive.kind].icon} size={15} />
                  </span>
                  <span className="min-w-0 flex-1 font-semibold">{directive.text}</span>
                  <span className="flex shrink-0 flex-wrap gap-1">
                    {directive.agents.map((id) => {
                      const agent = agentBoard.find((a) => a.id === id);
                      if (!agent) return null;
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ background: soft(AGENT_COLOR[id], 14), color: AGENT_COLOR[id] }}
                        >
                          <Icon name={AGENT_ICON[id]} size={11} />
                          {agent.name}
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {result.notes.length > 0 ? (
        <div className="rounded-2xl border px-3 py-2.5" style={{ borderColor: "var(--p-line)", background: "var(--p-card)" }}>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--p-ink)" }}>
            <span style={{ color: "var(--p-clay)" }}>
              <Icon name="question" size={15} />
            </span>
            Also consider
          </p>
          <ul className="mt-1.5 space-y-1">
            {result.notes.map((note) => (
              <li key={note} className="flex items-start gap-1.5 text-[12px] leading-snug" style={{ color: "var(--p-muted)" }}>
                <span className="mt-px shrink-0" style={{ color: "var(--p-clay)" }}>
                  <Icon name="arrow" size={13} />
                </span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
