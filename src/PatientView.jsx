import { useMemo, useRef, useState } from "react";
import { lifetimeGainsAge50, riskOutcomes } from "./data.js";
import { kfreRisk, uacrToMgG } from "./kfre.js";
import { combinedHazardRatio, parseNum } from "./logic.js";
import { preventRisk } from "./prevent.js";
import { scoreCkdRisk } from "./scoreCkd.js";
import { applyHazardRatio } from "./riskApply.js";
import Icon from "./PatientIcons.jsx";
import { WARM_THEME as THEME } from "./uiTheme.js";
import { updateFormField } from "./formUnits.js";
import RangeInput from "./RangeInput.jsx";
import { calculatorRange, rangeError } from "./inputRanges.js";
import { riskInputIssue } from "./riskInputIssue.js";
import {
  acrStageFor,
  acrStages,
  disclaimer,
  egfrStageFor,
  egfrStages,
  filterFlow,
  frequencyScale,
  kidneyBasics,
  medicines,
  medicinesTogether,
  numberMeanings,
  outcomeCopy,
  questionsToAsk,
  sickDayCard,
  treatedCaveat,
} from "./patientContent.js";

const MMOL_TO_MGDL = 38.67;
const SCORE_CALIBRATION = "low";

const OUTCOME_COLOR = {
  ckd: "var(--p-kidney)",
  hhf: "var(--p-heart)",
  mace: "var(--p-mace)",
  cvdeath: "var(--p-death)",
};
const OUTCOME_ICON = { ckd: "kidney", hhf: "heart", mace: "bolt", cvdeath: "alert" };

/** Shorter, plainer labels for the years-gained bars. */
const YEARS_LABEL = {
  ckd: "Kidney disease getting worse",
  mace: "Heart attack or stroke",
  hhf: "Heart failure in hospital",
};

const emptyForm = {
  age: "", sex: "", egfr: "", uacr: "", uacrUnit: "mgmmol", northAmerica: true,
  sbp: "", tc: "", hdl: "", cholUnit: "mmol", bmi: "",
  diabetes: false, smoking: false, bpmed: false, statin: false, knownCvd: false,
  onSglt: false, onFinerenone: false, onGlp: false,
};

const exampleForm = {
  ...emptyForm,
  age: "58", sex: "male", egfr: "42", uacr: "60",
  sbp: "138", tc: "4.8", hdl: "1.1", bmi: "31.2", diabetes: true,
};

const cholToMgDl = (value, unit) => {
  const n = parseNum(value);
  if (n == null) return null;
  return unit === "mmol" ? n * MMOL_TO_MGDL : n;
};

const outcomeById = Object.fromEntries(riskOutcomes.map((row) => [row.id, row]));
const FALLBACK = { hrs: {}, ci: {}, combinationMethod: "multiplicative" };
const outcomeFor = (id) => outcomeById[id] ?? FALLBACK;

const modelledMedicines = medicines.filter((medicine) => medicine.key);

const toCount = (risk) =>
  risk == null || !Number.isFinite(risk) ? null : Math.round(Math.min(1, Math.max(0, risk)) * 100);
const countLabel = (risk) => {
  const count = toCount(risk);
  if (count == null) return "—";
  return count === 0 ? "<1" : String(count);
};

/* ------------------------------------------------------------------ chrome */

function Pill({ children, icon, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.86em] font-semibold transition"
      style={{
        borderColor: active ? color : "var(--p-line)",
        background: active ? `color-mix(in srgb, ${color} 12%, white)` : "var(--p-card)",
        color: active ? color : "var(--p-muted)",
      }}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      {children}
    </button>
  );
}

function Switch({ on, onChange, color, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300"
      style={{ background: on ? color : "var(--p-neutral)" }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
        style={{ left: on ? "1.5rem" : "0.125rem" }}
      />
    </button>
  );
}

function Panel({ id, icon, color, title, teaser, open, onToggle, children }) {
  return (
    <section
      className="overflow-hidden rounded-2xl border transition-shadow"
      style={{
        borderColor: "var(--p-line)",
        background: "var(--p-card)",
        boxShadow: open ? "0 6px 24px -14px rgba(45,42,38,.35)" : "none",
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }}
        >
          <Icon name={icon} size={23} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1.15em] font-semibold leading-tight" style={{ color: "var(--p-ink)" }}>
            {title}
          </span>
          <span className="block text-[0.86em] leading-snug" style={{ color: "var(--p-muted)" }}>
            {teaser}
          </span>
        </span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300"
          style={{ background: "var(--p-sand)", color: "var(--p-muted)", transform: open ? "rotate(180deg)" : "none" }}
        >
          <Icon name="chevron" size={18} />
        </span>
      </button>
      {open ? (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--p-line)" }}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

/* ----------------------------------------------------------------- visuals */

/** Kidney silhouette whose fill height and colour follow the eGFR. */
function KidneyGauge({ egfr, stage, size = 128 }) {
  const fraction = egfr == null ? 0 : Math.min(1, Math.max(0.04, egfr / 90));
  const color =
    egfr == null ? "var(--p-neutral)"
      : egfr >= 60 ? "var(--p-sage)"
      : egfr >= 30 ? "var(--p-clay)"
      : "var(--p-heart)";
  const shape =
    "M52 10C70 10 78 28 76 52C74 76 64 98 44 100C24 102 12 84 16 60C18 48 26 44 26 34C26 20 36 10 52 10Z";
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5" style={{ width: size }}>
      <svg viewBox="0 0 90 110" className="w-full" style={{ height: (size * 110) / 90 }}>
        <defs>
          <clipPath id="kidney-clip">
            <path d={shape} />
          </clipPath>
        </defs>
        <path d={shape} fill="var(--p-sand)" stroke="var(--p-line)" strokeWidth="2.5" />
        <g clipPath="url(#kidney-clip)">
          <rect
            x="0"
            width="90"
            fill={color}
            opacity="0.85"
            style={{ transition: "y 900ms ease, height 900ms ease, fill 900ms ease" }}
            y={110 - fraction * 110}
            height={fraction * 110}
          />
        </g>
        <path
          d="M40 38c9 5 13 15 13 24s-5 17-13 21"
          fill="none"
          stroke="white"
          strokeOpacity="0.5"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <div
        className="flex items-baseline gap-1.5 rounded-full px-3 py-1"
        style={{ background: "var(--p-card)", boxShadow: "0 1px 3px rgba(45,42,38,.12)" }}
      >
        <span className="text-[1.25em] font-bold leading-none" style={{ color: "var(--p-ink)" }}>
          {egfr ?? "?"}
        </span>
        <span className="text-[0.72em] font-bold uppercase tracking-wide" style={{ color: color }}>
          {stage ? stage.label : "eGFR"}
        </span>
      </div>
    </div>
  );
}

/** One hundred figures: still affected, difference the medicines make, unaffected. */
function IconArray({ baseline, treated, color, showTreated }) {
  const baseCount = toCount(baseline) ?? 0;
  const treatedCount =
    !showTreated || treated == null ? baseCount : Math.min(baseCount, toCount(treated) ?? baseCount);
  return (
    <div
      className="grid w-fit grid-cols-10 gap-[3px]"
      role="img"
      aria-label={`${baseCount} of 100 people affected, ${Math.max(0, baseCount - treatedCount)} fewer with the medicines`}
    >
      {Array.from({ length: 100 }, (_, index) => {
        const fill = index < treatedCount ? color : index < baseCount ? "var(--p-sage-soft)" : "var(--p-neutral)";
        return (
          <svg
            key={index}
            viewBox="0 0 12 20"
            className="block h-[18px] w-auto"
            style={{ aspectRatio: "12 / 20", fill, transition: "fill 500ms ease" }}
            aria-hidden="true"
          >
            <circle cx="6" cy="3.6" r="3.1" />
            <path d="M6 8.2c3.1 0 5 2.1 5 5.2V20H1v-6.6c0-3.1 1.9-5.2 5-5.2Z" />
          </svg>
        );
      })}
    </div>
  );
}

/**
 * Stepped benefit chart. Each row is the risk after one more medicine is added,
 * so the patient sees what each one contributes rather than one lumped total.
 */
function BenefitChart({ outcomeId, baseline, started }) {
  const outcome = outcomeFor(outcomeId);
  const rows = [{ id: "base", label: "As things are now", risk: baseline, color: "var(--p-ink)", on: true }];
  let running = { sglt2i: false, nsmra: false, glp1: false };
  for (const medicine of modelledMedicines) {
    const on = Boolean(started[medicine.id]);
    const next = { ...running, [medicine.id]: true };
    const risk = applyHazardRatio(baseline, combinedHazardRatio(outcome, on ? next : running));
    rows.push({ id: medicine.id, label: `with ${medicine.name}`, risk: on ? risk : null, color: medicine.color, on });
    if (on) running = next;
  }
  const max = baseline || 1;
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const pct = row.risk == null ? 0 : Math.max(2, (row.risk / max) * 100);
        return (
          <div key={row.id} className="grid grid-cols-[7.5rem_minmax(0,1fr)_3rem] items-center gap-2">
            <span
              className="truncate text-[0.8em] font-semibold"
              style={{ color: row.on ? "var(--p-ink)" : "var(--p-muted)", opacity: row.on ? 1 : 0.6 }}
              title={row.label}
            >
              {row.label}
            </span>
            <div className="h-5 rounded-full" style={{ background: "var(--p-sand)" }}>
              {row.on ? (
                <div
                  className="h-5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, background: row.color }}
                  title={`${countLabel(row.risk)} in 100`}
                />
              ) : (
                <div className="flex h-5 items-center pl-2 text-[0.72em]" style={{ color: "var(--p-muted)" }}>
                  switch it on to see
                </div>
              )}
            </div>
            <span
              className="text-right text-[0.86em] font-bold tabular-nums"
              style={{ color: row.on ? "var(--p-ink)" : "var(--p-neutral)" }}
            >
              {row.on ? countLabel(row.risk) : "–"}
            </span>
          </div>
        );
      })}
      <p className="pt-0.5 text-[0.78em]" style={{ color: "var(--p-muted)" }}>
        Bars are people out of 100. Each row adds one more medicine to the one above it.
      </p>
    </div>
  );
}

/** KDIGO grid. Colour is always backed by a written label, never colour alone. */
const RISK_BANDS = {
  low: { label: "Low", bg: "#e3ecdd", ink: "#3f6b47" },
  moderate: { label: "Moderate", bg: "#f7e8c8", ink: "#8a6a1e" },
  high: { label: "High", bg: "#f2d3b0", ink: "#9c5f27" },
  veryhigh: { label: "Very high", bg: "#eec2c2", ink: "#9c3d46" },
};
const KDIGO = {
  G1: ["low", "moderate", "high"],
  G2: ["low", "moderate", "high"],
  G3a: ["moderate", "high", "veryhigh"],
  G3b: ["high", "veryhigh", "veryhigh"],
  G4: ["veryhigh", "veryhigh", "veryhigh"],
  G5: ["veryhigh", "veryhigh", "veryhigh"],
};

function StageGrid({ gStage, aStage }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] border-separate border-spacing-1 text-[0.8em]">
        <thead>
          <tr>
            <th className="w-24 p-1 text-left font-semibold" style={{ color: "var(--p-muted)" }}>
              Filtering
            </th>
            {acrStages.map((column) => (
              <th key={column.id} className="p-1 text-center font-semibold" style={{ color: "var(--p-muted)" }}>
                {column.id}
                <span className="block text-[0.85em] font-normal">{column.plain}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {egfrStages.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="p-1 text-left font-semibold" style={{ color: "var(--p-ink)" }}>
                {row.id}
                <span className="block text-[0.85em] font-normal" style={{ color: "var(--p-muted)" }}>
                  {row.range}
                </span>
              </th>
              {acrStages.map((column, index) => {
                const band = RISK_BANDS[KDIGO[row.id][index]];
                const here = gStage?.id === row.id && aStage?.id === column.id;
                return (
                  <td
                    key={column.id}
                    className="rounded-lg p-1.5 text-center font-semibold"
                    style={{
                      background: band.bg,
                      color: band.ink,
                      outline: here ? "3px solid var(--p-ink)" : "none",
                      outlineOffset: "1px",
                    }}
                  >
                    {band.label}
                    {here ? (
                      <span
                        className="mt-0.5 flex items-center justify-center gap-1 text-[0.85em]"
                        style={{ color: "var(--p-ink)" }}
                      >
                        <Icon name="person" size={13} /> you
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FreqDots({ freq }) {
  const level = frequencyScale.find((row) => row.id === freq) ?? frequencyScale[2];
  return (
    <span className="flex items-center gap-1" title={level.label}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: index < level.dots ? "var(--p-clay)" : "var(--p-neutral)" }}
        />
      ))}
      <span className="text-[0.75em]" style={{ color: "var(--p-muted)" }}>
        {level.label}
      </span>
    </span>
  );
}

function SideEffectTile({ effect, open, onToggle }) {
  return (
    <div className="rounded-xl border" style={{ borderColor: "var(--p-line)", background: "var(--p-cream)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 p-2 text-left"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--p-sand)", color: "var(--p-clay)" }}
        >
          <Icon name={effect.icon} size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9em] font-semibold leading-tight" style={{ color: "var(--p-ink)" }}>
            {effect.label}
          </span>
          <FreqDots freq={effect.freq} />
        </span>
        <span style={{ color: "var(--p-muted)" }}>
          <Icon name={open ? "minus" : "plus"} size={16} />
        </span>
      </button>
      {open ? (
        <p
          className="border-t px-2 py-2 text-[0.84em] leading-relaxed"
          style={{ borderColor: "var(--p-line)", color: "var(--p-muted)" }}
        >
          {effect.note}
        </p>
      ) : null}
    </div>
  );
}

function StepFlow({ steps, color }) {
  return (
    <div className="flex flex-wrap items-stretch gap-1.5">
      {steps.map((step, index) => (
        <div key={step.text} className="flex items-center gap-1.5">
          <div
            className="flex w-28 flex-col items-center gap-1 rounded-xl px-2 py-2 text-center"
            style={{ background: `color-mix(in srgb, ${color} 10%, white)`, color: "var(--p-ink)" }}
          >
            <span style={{ color }}>
              <Icon name={step.icon} size={22} />
            </span>
            <span className="text-[0.76em] leading-snug">{step.text}</span>
          </div>
          {index < steps.length - 1 ? (
            <span className="-rotate-90" style={{ color: "var(--p-neutral)" }}>
              <Icon name="chevron" size={18} />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MedicineCard({ medicine, open, onToggle, on, onSwitch, openEffect, setOpenEffect, kidneyDrop }) {
  const color = medicine.color;
  return (
    <div
      className="overflow-hidden rounded-2xl border transition-all"
      style={{
        borderColor: on ? color : "var(--p-line)",
        background: "var(--p-card)",
        boxShadow: on ? `0 0 0 1px ${color}` : "none",
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors"
            style={{ background: `color-mix(in srgb, ${color} ${on ? 22 : 12}%, white)`, color }}
          >
            <Icon name={medicine.icon} size={25} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1.05em] font-semibold leading-tight" style={{ color: "var(--p-ink)" }}>
              {medicine.name}
            </span>
            <span className="block text-[0.82em] leading-snug" style={{ color: "var(--p-muted)" }}>
              {medicine.short}
              {medicine.always ? " · part of usual care" : ""}
            </span>
          </span>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300"
            style={{ background: "var(--p-sand)", color: "var(--p-muted)", transform: open ? "rotate(180deg)" : "none" }}
          >
            <Icon name="chevron" size={16} />
          </span>
        </button>
        {medicine.key ? (
          <Switch on={on} onChange={onSwitch} color={color} label={`Include ${medicine.name} in the estimate`} />
        ) : (
          <span
            className="rounded-full px-2 py-1 text-[0.72em] font-semibold"
            style={{ background: "var(--p-sand)", color: "var(--p-muted)" }}
          >
            always on
          </span>
        )}
      </div>

      {open ? (
        <div className="space-y-3 border-t px-3 pb-3 pt-3" style={{ borderColor: "var(--p-line)" }}>
          <p className="text-[0.86em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
            {medicine.alsoCalled}
          </p>

          <div>
            <p className="mb-1.5 text-[0.76em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
              How it works
            </p>
            <StepFlow steps={medicine.steps} color={color} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl p-2.5" style={{ background: "var(--p-cream)" }}>
              <p className="text-[0.76em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
                What it does
              </p>
              <p className="mt-0.5 text-[0.88em] leading-relaxed" style={{ color: "var(--p-ink)" }}>
                {medicine.does}
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: "var(--p-cream)" }}>
              <p className="text-[0.76em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
                What to expect
              </p>
              <p className="mt-0.5 text-[0.88em] leading-relaxed" style={{ color: "var(--p-ink)" }}>
                {medicine.expect}
              </p>
            </div>
          </div>

          {kidneyDrop != null ? (
            <div
              className="flex items-center gap-2 rounded-xl px-2.5 py-2"
              style={{ background: `color-mix(in srgb, ${color} 10%, white)` }}
            >
              <span style={{ color }}>
                <Icon name="trend" size={20} />
              </span>
              <p className="text-[0.86em] leading-snug" style={{ color: "var(--p-ink)" }}>
                In trials this medicine lowered the chance of kidney failure by about <strong>{kidneyDrop}%</strong> on
                top of usual care.
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-1.5 text-[0.76em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
              Side effects · tap one to read what to do
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {medicine.sideEffects.map((effect) => {
                const key = `${medicine.id}:${effect.label}`;
                return (
                  <SideEffectTile
                    key={key}
                    effect={effect}
                    open={openEffect === key}
                    onToggle={() => setOpenEffect(openEffect === key ? null : key)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------- form bits */

function Field({ label, hint, children }) {
  return (
    <label
      className="block rounded-xl border px-3 py-2"
      style={{ borderColor: "var(--p-line)", background: "var(--p-card)" }}
    >
      <span className="block text-[0.82em] font-semibold" style={{ color: "var(--p-ink)" }}>
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-[0.76em] leading-tight" style={{ color: "var(--p-muted)" }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--p-line)", background: "var(--p-card)" }}>
      <span className="block text-[0.82em] font-semibold" style={{ color: "var(--p-ink)" }}>
        {label}
      </span>
      <div className="mt-1 flex rounded-lg p-0.5" style={{ background: "var(--p-sand)" }}>
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className="flex-1 rounded-md px-2 py-1 text-[0.82em] font-semibold transition"
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
    </div>
  );
}

function Check({ checked, onChange, label }) {
  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[0.88em] font-semibold transition"
      style={{
        borderColor: checked ? "var(--p-clay)" : "var(--p-line)",
        background: checked ? "color-mix(in srgb, var(--p-clay) 10%, white)" : "var(--p-card)",
        color: checked ? "var(--p-ink)" : "var(--p-muted)",
      }}
    >
      <input
        type="checkbox"
        className="h-4 w-4"
        style={{ accentColor: "var(--p-clay)" }}
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------- view */

const PANELS = ["basics", "numbers", "stage", "risk", "medicines", "questions"];

export default function PatientView() {
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState([]);
  const [openMedicine, setOpenMedicine] = useState(null);
  const [openEffect, setOpenEffect] = useState(null);
  const [riskOutcome, setRiskOutcome] = useState("ckd");
  const [riskView, setRiskView] = useState("people");
  const [large, setLarge] = useState(false);
  const [questions, setQuestions] = useState(() =>
    questionsToAsk.map((text, index) => ({ id: `q${index}`, text, done: false })),
  );
  const [draft, setDraft] = useState("");
  const nextId = useRef(0);

  const set = (key, value) => setForm((current) => updateFormField(current, key, value));
  const toggle = (id) =>
    setOpen((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  const isOpen = (id) => open.includes(id);

  const age = parseNum(form.age);
  const egfr = rangeError(form.egfr, calculatorRange("egfr")) ? null : parseNum(form.egfr);
  const male = form.sex === "male" ? 1 : form.sex === "female" ? 0 : null;
  const uacrMgG = uacrToMgG(form.uacr, form.uacrUnit);
  const tc = cholToMgDl(form.tc, form.cholUnit);

  const started = useMemo(
    () => ({ sglt2i: Boolean(form.onSglt), nsmra: Boolean(form.onFinerenone), glp1: Boolean(form.onGlp) }),
    [form.onSglt, form.onFinerenone, form.onGlp],
  );
  const anyMedicine = started.sglt2i || started.nsmra || started.glp1;
  const startedCount = [started.sglt2i, started.nsmra, started.glp1].filter(Boolean).length;

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

  const baselines = {
    ckd: kidney?.year5 ?? null,
    hhf: heart?.hf?.[10] ?? null,
    mace: heart?.ascvd?.[10] ?? null,
    cvdeath: cvDeath?.patched ?? null,
  };
  const treatedOf = (id) =>
    anyMedicine ? applyHazardRatio(baselines[id], combinedHazardRatio(outcomeFor(id), started)) : baselines[id];

  const hasCore = ["age", "egfr", "uacr"].every((key) => !rangeError(form[key], calculatorRange(key, form), true)) && ["male", "female"].includes(form.sex);
  const gStage = egfrStageFor(egfr);
  const aStage = acrStageFor(uacrMgG);


  function printAll() {
    setOpen(PANELS);
    setOpenMedicine("all");
    window.setTimeout(() => window.print(), 80);
  }

  const outcomeTabs = [
    { id: "ckd", label: "Kidney failure" },
    { id: "hhf", label: "Heart failure" },
    { id: "mace", label: "Heart attack or stroke" },
    { id: "cvdeath", label: "Heart-related death" },
  ];

  return (
    <div style={{ ...THEME, color: "var(--p-ink)", fontSize: large ? "17px" : "15px" }}>
      <div
        className="overflow-hidden rounded-3xl border p-4 sm:p-5"
        style={{
          borderColor: "var(--p-line)",
          background: "linear-gradient(155deg, #e9f4ef 0%, var(--p-cream) 42%, var(--p-sand) 100%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.78em] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--p-kidney)" }}>
              For patients
            </p>
            <h2 className="font-serif text-[1.85em] leading-tight">Your kidneys, in plain language</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Pill icon="sparkle" onClick={() => setLarge((v) => !v)} active={large} color="var(--p-clay)">
              {large ? "Normal text" : "Larger text"}
            </Pill>
            <Pill icon="printer" onClick={printAll} color="var(--p-kidney)">
              Print
            </Pill>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <KidneyGauge egfr={egfr} stage={gStage} />

          <div className="min-w-[13rem] flex-1">
            {kidney != null ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-[0.82em] font-bold"
                    style={{ background: "var(--p-card)", color: "var(--p-kidney)" }}
                  >
                    Stage {gStage?.id} {aStage?.id}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[0.82em] font-semibold"
                    style={{ background: "var(--p-card)", color: "var(--p-muted)" }}
                  >
                    {gStage?.plain}
                  </span>
                </div>
                <p className="mt-2 text-[1.05em] leading-relaxed">
                  Out of 100 people with numbers like yours, about{" "}
                  <strong style={{ color: "var(--p-kidney)" }}>{countLabel(baselines.ckd)}</strong> would reach kidney
                  failure within 5 years.{" "}
                  {anyMedicine ? (
                    <>
                      With the medicines you have switched on, about{" "}
                      <strong style={{ color: "var(--p-sage)" }}>{countLabel(treatedOf("ckd"))}</strong> would.
                    </>
                  ) : (
                    <span style={{ color: "var(--p-muted)" }}>
                      Switch medicines on below to see the difference they make.
                    </span>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-[1.05em] leading-relaxed">
                  {hasCore ? riskInputIssue("ckd", form) : "Start by adding your numbers from your test results. Any missing or out-of-range values are explained beside the fields."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                  <Pill
                    icon="plus"
                    color="var(--p-kidney)"
                    onClick={() => {
                      if (!isOpen("numbers")) toggle("numbers");
                    }}
                  >
                    Add my numbers
                  </Pill>
                  <Pill
                    icon="people"
                    color="var(--p-clay)"
                    onClick={() => {
                      setForm(exampleForm);
                      if (!isOpen("risk")) toggle("risk");
                    }}
                  >
                    Show me an example
                  </Pill>
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border p-3" style={{ borderColor: "var(--p-line)", background: "var(--p-card)" }}>
            <p className="text-[0.76em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
              Protective medicines
            </p>
            <p className="text-[1.5em] font-bold leading-tight" style={{ color: "var(--p-kidney)" }}>
              {startedCount + 1}{" "}
              <span className="text-[0.55em] font-semibold" style={{ color: "var(--p-muted)" }}>
                of 4 on
              </span>
            </p>
            <div className="mt-1.5 flex gap-1.5">
              {medicines.map((medicine) => {
                const on = medicine.always || Boolean(form[medicine.key]);
                return (
                  <span
                    key={medicine.id}
                    title={medicine.name}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                    style={{
                      background: on ? `color-mix(in srgb, ${medicine.color} 18%, white)` : "var(--p-sand)",
                      color: on ? medicine.color : "var(--p-neutral)",
                    }}
                  >
                    <Icon name={medicine.icon} size={18} />
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <p
          className="mt-4 flex gap-2 rounded-2xl border px-3 py-2 text-[0.82em] leading-relaxed"
          style={{ borderColor: "var(--p-line)", background: "var(--p-card)", color: "var(--p-muted)" }}
        >
          <span className="shrink-0" style={{ color: "var(--p-clay)" }}>
            <Icon name="alert" size={18} />
          </span>
          {disclaimer}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-[0.78em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
          Sections
        </span>
        <Pill icon="plus" color="var(--p-kidney)" onClick={() => setOpen(PANELS)}>
          Open all
        </Pill>
        <Pill icon="minus" color="var(--p-muted)" onClick={() => setOpen([])}>
          Close all
        </Pill>
      </div>

      <div className="mt-2 space-y-2.5">
        <Panel
          id="basics"
          icon="kidney"
          color="var(--p-kidney)"
          title="What is kidney disease?"
          teaser="What your kidneys do, and what the two numbers mean"
          open={isOpen("basics")}
          onToggle={toggle}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {filterFlow.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl p-3" style={{ background: "var(--p-cream)" }}>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--p-sand)", color: "var(--p-kidney)" }}
                >
                  <Icon name={step.icon} size={21} />
                </span>
                <p className="mt-2 text-[0.95em] font-semibold">{step.title}</p>
                <p className="mt-0.5 text-[0.84em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                  {step.text}
                </p>
                <span className="absolute right-2 top-2 text-[0.7em] font-bold" style={{ color: "var(--p-neutral)" }}>
                  {index + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {kidneyBasics.map((item) => (
              <div key={item.title} className="rounded-2xl border p-3" style={{ borderColor: "var(--p-line)" }}>
                <p className="text-[0.95em] font-semibold">{item.title}</p>
                <p className="mt-1 text-[0.84em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {numberMeanings.map((meaning) => (
              <div key={meaning.id} className="flex gap-3 rounded-2xl p-3" style={{ background: "var(--p-cream)" }}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--p-sand)", color: "var(--p-kidney)" }}
                >
                  <Icon name={meaning.icon} size={22} />
                </span>
                <div>
                  <p className="text-[1em] font-semibold">{meaning.title}</p>
                  <p className="text-[0.8em] font-semibold" style={{ color: "var(--p-kidney)" }}>
                    {meaning.sub}
                  </p>
                  <p className="mt-0.5 text-[0.84em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                    {meaning.plain}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          id="numbers"
          icon="clipboard"
          color="var(--p-clay)"
          title="Your numbers"
          teaser={hasCore ? `eGFR ${form.egfr}, ACR ${form.uacr}, age ${form.age}` : "Four numbers from your test results"}
          open={isOpen("numbers")}
          onToggle={toggle}
        >
          <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Age">
                <RangeInput className="mt-0.5 w-full bg-transparent text-[1.15em] outline-none" style={{ color: "var(--p-ink)" }}
                  type="number"
                  inputMode="numeric"
                  range={calculatorRange("age", form)}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                />
              </Field>
              <Segmented
                label="Sex"
                value={form.sex}
                onChange={(id) => set("sex", id)}
                options={[
                  { id: "female", label: "Female" },
                  { id: "male", label: "Male" },
                ]}
              />
              <Field label="eGFR" hint="Higher is better">
                <RangeInput className="mt-0.5 w-full bg-transparent text-[1.15em] outline-none" style={{ color: "var(--p-ink)" }}
                  type="number"
                  inputMode="decimal"
                  range={calculatorRange("egfr", form)}
                  value={form.egfr}
                  onChange={(e) => set("egfr", e.target.value)}
                />
              </Field>
              <Field label="Urine ACR" hint="Lower is better">
                <RangeInput className="mt-0.5 w-full bg-transparent text-[1.15em] outline-none" style={{ color: "var(--p-ink)" }}
                  type="number"
                  inputMode="decimal"
                  range={calculatorRange("uacr", form)}
                  value={form.uacr}
                  onChange={(e) => set("uacr", e.target.value)}
                />
              </Field>
              <Segmented
                label="ACR units"
                value={form.uacrUnit}
                onChange={(id) => set("uacrUnit", id)}
                options={[
                  { id: "mgmmol", label: "mg/mmol" },
                  { id: "mgg", label: "mg/g" },
                ]}
              />
            </div>

            <div className="rounded-2xl p-3" style={{ background: "var(--p-cream)" }}>
              <p className="text-[0.82em] font-semibold" style={{ color: "var(--p-muted)" }}>
                For the heart estimates, add these too
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="Blood pressure" hint="top number">
                  <RangeInput className="mt-0.5 w-full bg-transparent text-[1.15em] outline-none" style={{ color: "var(--p-ink)" }}
                    type="number"
                    inputMode="numeric"
                  range={calculatorRange("sbp", form)}
                    value={form.sbp}
                    onChange={(e) => set("sbp", e.target.value)}
                  />
                </Field>
                <Field label="Total cholesterol">
                  <RangeInput className="mt-0.5 w-full bg-transparent text-[1.15em] outline-none" style={{ color: "var(--p-ink)" }}
                    type="number"
                    inputMode="decimal"
                  range={calculatorRange("tc", form)}
                    value={form.tc}
                    onChange={(e) => set("tc", e.target.value)}
                  />
                </Field>
                <Field label="HDL" hint="good cholesterol">
                  <RangeInput className="mt-0.5 w-full bg-transparent text-[1.15em] outline-none" style={{ color: "var(--p-ink)" }}
                    type="number"
                    inputMode="decimal"
                  range={calculatorRange("hdl", form)}
                    value={form.hdl}
                    onChange={(e) => set("hdl", e.target.value)}
                  />
                </Field>
                <Field label="BMI">
                  <RangeInput className="mt-0.5 w-full bg-transparent text-[1.15em] outline-none" style={{ color: "var(--p-ink)" }}
                    type="number"
                    inputMode="decimal"
                  range={calculatorRange("bmi", form)}
                    value={form.bmi}
                    onChange={(e) => set("bmi", e.target.value)}
                  />
                </Field>
                <Segmented
                  label="Cholesterol units"
                  value={form.cholUnit}
                  onChange={(id) => set("cholUnit", id)}
                  options={[
                    { id: "mmol", label: "mmol/L" },
                    { id: "mgdl", label: "mg/dL" },
                  ]}
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Check
                  checked={form.diabetes}
                  onChange={(e) => set("diabetes", e.target.checked)}
                  label="I have diabetes"
                />
                <Check checked={form.smoking} onChange={(e) => set("smoking", e.target.checked)} label="I smoke" />
                <Check
                  checked={form.bpmed}
                  onChange={(e) => set("bpmed", e.target.checked)}
                  label="Blood pressure medicine"
                />
                <Check checked={form.statin} onChange={(e) => set("statin", e.target.checked)} label="I take a statin" />
                <Check
                  checked={form.knownCvd}
                  onChange={(e) => set("knownCvd", e.target.checked)}
                  label="I have had a heart attack, stroke or heart failure"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <Pill icon="people" color="var(--p-clay)" onClick={() => setForm(exampleForm)}>
                Fill with an example
              </Pill>
              <Pill icon="trash" color="var(--p-muted)" onClick={() => setForm(emptyForm)}>
                Clear everything
              </Pill>
            </div>
          </form>
        </Panel>

        <Panel
          id="stage"
          icon="trend"
          color="var(--p-mace)"
          title="Where you are on the map"
          teaser={hasCore ? `You are in ${gStage?.id} ${aStage?.id}` : "The stage grid, once your numbers are in"}
          open={isOpen("stage")}
          onToggle={toggle}
        >
          {hasCore ? (
            <>
              <p className="mb-2 text-[0.88em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                Kidney teams use a grid. Filtering speed runs down the side, leaking protein runs across the top. Your
                square is outlined. Moving down or right means closer watching, not a countdown.
              </p>
              <StageGrid gStage={gStage} aStage={aStage} />
            </>
          ) : (
            <p
              className="rounded-xl p-3 text-center text-[0.9em]"
              style={{ background: "var(--p-cream)", color: "var(--p-muted)" }}
            >
              Add your eGFR and urine ACR in Your numbers to place yourself on the grid.
            </p>
          )}
        </Panel>

        <Panel
          id="risk"
          icon="people"
          color="var(--p-heart)"
          title="What happens to 100 people like you"
          teaser={hasCore ? "Your risks, and what the medicines change" : "Pictures of risk, once your numbers are in"}
          open={isOpen("risk")}
          onToggle={toggle}
        >
          {!hasCore ? (
            <p
              className="rounded-xl p-3 text-center text-[0.9em]"
              style={{ background: "var(--p-cream)", color: "var(--p-muted)" }}
            >
              Add your four numbers in Your numbers to see these pictures.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 print:hidden">
                {outcomeTabs.map((tab) => (
                  <Pill
                    key={tab.id}
                    active={riskOutcome === tab.id}
                    color={OUTCOME_COLOR[tab.id]}
                    icon={OUTCOME_ICON[tab.id]}
                    onClick={() => setRiskOutcome(tab.id)}
                  >
                    {tab.label}
                  </Pill>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border p-3" style={{ borderColor: "var(--p-line)" }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-serif text-[1.35em] leading-tight">{outcomeCopy[riskOutcome].title}</h4>
                    <p className="text-[0.86em] leading-snug" style={{ color: "var(--p-muted)" }}>
                      {outcomeCopy[riskOutcome].plain}
                    </p>
                  </div>
                  <div className="flex rounded-lg p-0.5 print:hidden" style={{ background: "var(--p-sand)" }}>
                    {[
                      { id: "people", label: "People" },
                      { id: "chart", label: "Step by step" },
                    ].map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        aria-pressed={riskView === view.id}
                        onClick={() => setRiskView(view.id)}
                        className="rounded-md px-2.5 py-1 text-[0.8em] font-semibold"
                        style={{
                          background: riskView === view.id ? "var(--p-card)" : "transparent",
                          color: riskView === view.id ? "var(--p-ink)" : "var(--p-muted)",
                        }}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>

                {baselines[riskOutcome] == null ? (
                  <p
                    className="mt-3 rounded-xl p-3 text-center text-[0.9em]"
                    style={{ background: "var(--p-cream)", color: "var(--p-muted)" }}
                  >
                    {riskInputIssue(riskOutcome, form) ?? "This estimate is not available for these inputs."}
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap items-start gap-6">
                    <div className="min-w-[12rem] flex-1 space-y-3">
                      <div>
                        <p className="text-[0.76em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
                          As things are now
                        </p>
                        <p className="text-[2em] font-bold leading-none">
                          {countLabel(baselines[riskOutcome])}
                          <span className="ml-1 text-[0.45em] font-semibold" style={{ color: "var(--p-muted)" }}>
                            in 100
                          </span>
                        </p>
                        <p className="text-[0.78em]" style={{ color: "var(--p-muted)" }}>
                          {outcomeCopy[riskOutcome].horizonNote}
                        </p>
                      </div>
                      {anyMedicine ? (
                        <div>
                          <p
                            className="text-[0.76em] font-bold uppercase tracking-wide"
                            style={{ color: "var(--p-muted)" }}
                          >
                            With your medicines
                          </p>
                          <p className="text-[2em] font-bold leading-none" style={{ color: "var(--p-sage)" }}>
                            {countLabel(treatedOf(riskOutcome))}
                            <span className="ml-1 text-[0.45em] font-semibold" style={{ color: "var(--p-muted)" }}>
                              in 100
                            </span>
                          </p>
                          <p className="text-[0.78em]" style={{ color: "var(--p-muted)" }}>
                            about{" "}
                            {Math.max(
                              0,
                              (toCount(baselines[riskOutcome]) ?? 0) - (toCount(treatedOf(riskOutcome)) ?? 0),
                            )}{" "}
                            fewer
                          </p>
                        </div>
                      ) : (
                        <p className="text-[0.82em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                          Switch a medicine on in Your medicines and this picture changes.
                        </p>
                      )}
                      <div className="space-y-1 text-[0.78em]" style={{ color: "var(--p-muted)" }}>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ background: OUTCOME_COLOR[riskOutcome] }}
                          />
                          Would still have it
                        </span>
                        {anyMedicine ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: "var(--p-sage-soft)" }} />
                            Fewer, because of the medicines
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: "var(--p-neutral)" }} />
                          Would not have it
                        </span>
                      </div>
                    </div>

                    <div className="min-w-[15rem] flex-1">
                      {riskView === "people" ? (
                        <IconArray
                          baseline={baselines[riskOutcome]}
                          treated={treatedOf(riskOutcome)}
                          color={OUTCOME_COLOR[riskOutcome]}
                          showTreated={anyMedicine}
                        />
                      ) : (
                        <BenefitChart outcomeId={riskOutcome} baseline={baselines[riskOutcome]} started={started} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl p-3" style={{ background: "var(--p-cream)" }}>
                  <p className="flex items-center gap-2 text-[0.95em] font-semibold">
                    <span style={{ color: "var(--p-sage)" }}>
                      <Icon name="clock" size={20} />
                    </span>
                    Time without problems
                  </p>
                  <p className="mt-1 text-[0.82em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                    A published modelling study estimated the extra years free of each problem for a 50 year old taking
                    all three medicines rather than usual care alone.
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {lifetimeGainsAge50.map((row) => (
                      <div key={row.id} className="grid grid-cols-[8.5rem_minmax(0,1fr)_3.2rem] items-center gap-2">
                        <span className="text-[0.8em] font-semibold leading-tight">{YEARS_LABEL[row.id] ?? row.label}</span>
                        <div className="h-3 rounded-full" style={{ background: "var(--p-sand)" }}>
                          <div
                            className="h-3 rounded-full transition-all duration-700"
                            style={{ width: `${(row.years / 6) * 100}%`, background: "var(--p-sage)" }}
                          />
                        </div>
                        <span className="text-right text-[0.8em] font-bold tabular-nums">+{row.years} yr</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p
                  className="flex gap-2 rounded-2xl border px-3 py-2.5 text-[0.84em] leading-relaxed"
                  style={{ borderColor: "var(--p-line)", background: "var(--p-card)", color: "var(--p-muted)" }}
                >
                  <span className="shrink-0" style={{ color: "var(--p-clay)" }}>
                    <Icon name="question" size={18} />
                  </span>
                  {treatedCaveat}
                </p>
              </div>
            </>
          )}
        </Panel>

        <Panel
          id="medicines"
          icon="pill"
          color="var(--p-death)"
          title="Your medicines"
          teaser="What each one does, how it works, and its side effects"
          open={isOpen("medicines")}
          onToggle={toggle}
        >
          <p className="mb-3 text-[0.88em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
            {medicinesTogether}
          </p>
          <div className="space-y-2">
            {medicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                open={openMedicine === medicine.id || openMedicine === "all"}
                onToggle={() => setOpenMedicine(openMedicine === medicine.id ? null : medicine.id)}
                on={medicine.always || Boolean(form[medicine.key])}
                onSwitch={() => medicine.key && set(medicine.key, !form[medicine.key])}
                openEffect={openEffect}
                setOpenEffect={setOpenEffect}
                kidneyDrop={
                  outcomeFor("ckd").hrs[medicine.id] != null
                    ? Math.round((1 - outcomeFor("ckd").hrs[medicine.id]) * 100)
                    : null
                }
              />
            ))}
          </div>

          <div className="mt-3 flex gap-3 rounded-2xl p-3" style={{ background: "var(--p-cream)" }}>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--p-sand)", color: "var(--p-heart)" }}
            >
              <Icon name={sickDayCard.icon} size={22} />
            </span>
            <div>
              <p className="text-[1em] font-semibold">{sickDayCard.title}</p>
              <p className="mt-0.5 text-[0.86em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
                {sickDayCard.text}
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          id="questions"
          icon="question"
          color="var(--p-sage)"
          title="Questions for your next appointment"
          teaser={`${questions.filter((q) => q.done).length} of ${questions.length} ticked off`}
          open={isOpen("questions")}
          onToggle={toggle}
        >
          <ul className="space-y-2">
            {questions.map((question) => (
              <li
                key={question.id}
                className="flex items-start gap-2.5 rounded-xl border p-2.5"
                style={{
                  borderColor: question.done ? "var(--p-sage)" : "var(--p-line)",
                  background: question.done ? "color-mix(in srgb, var(--p-sage) 8%, white)" : "var(--p-card)",
                }}
              >
                <button
                  type="button"
                  aria-pressed={question.done}
                  aria-label={question.done ? "Mark as not asked" : "Mark as asked"}
                  onClick={() =>
                    setQuestions((current) =>
                      current.map((row) => (row.id === question.id ? { ...row, done: !row.done } : row)),
                    )
                  }
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition"
                  style={{
                    borderColor: question.done ? "var(--p-sage)" : "var(--p-line)",
                    background: question.done ? "var(--p-sage)" : "transparent",
                    color: "white",
                  }}
                >
                  {question.done ? <Icon name="check" size={14} strokeWidth={2.4} /> : null}
                </button>
                <span
                  className="min-w-0 flex-1 text-[0.9em] leading-relaxed"
                  style={{
                    color: "var(--p-ink)",
                    textDecoration: question.done ? "line-through" : "none",
                    opacity: question.done ? 0.6 : 1,
                  }}
                >
                  {question.text}
                </span>
                <button
                  type="button"
                  aria-label="Remove this question"
                  onClick={() => setQuestions((current) => current.filter((row) => row.id !== question.id))}
                  className="shrink-0 rounded-lg p-1 print:hidden"
                  style={{ color: "var(--p-neutral)" }}
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>

          <form
            className="mt-3 flex flex-wrap gap-2 print:hidden"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft.trim();
              if (!text) return;
              nextId.current += 1;
              setQuestions((current) => [...current, { id: `own${nextId.current}`, text, done: false }]);
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a question of your own"
              className="min-w-[14rem] flex-1 rounded-xl border px-3 py-2 text-[0.9em] outline-none"
              style={{ borderColor: "var(--p-line)", background: "var(--p-card)", color: "var(--p-ink)" }}
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.88em] font-semibold text-white"
              style={{ background: "var(--p-sage)" }}
            >
              <Icon name="plus" size={16} /> Add
            </button>
          </form>

          <div className="mt-3 rounded-2xl p-3" style={{ background: "var(--p-cream)" }}>
            <p className="text-[0.76em] font-bold uppercase tracking-wide" style={{ color: "var(--p-muted)" }}>
              Notes from my appointment
            </p>
            <div className="mt-3 space-y-7">
              {[0, 1, 2, 3].map((line) => (
                <div key={line} className="border-b border-dashed" style={{ borderColor: "var(--p-line)" }} />
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <p className="mt-3 px-1 text-[0.78em] leading-relaxed" style={{ color: "var(--p-muted)" }}>
        {disclaimer}
      </p>
    </div>
  );
}
