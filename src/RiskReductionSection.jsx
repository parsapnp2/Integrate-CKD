import { useMemo, useState } from "react";
import { lifetimeGainsAge50, riskAgents, riskOutcomes, riskSources } from "./data.js";
import { combinedCi, combinedHazardRatio, formatReductionCi, relativeReductionPct } from "./logic.js";
import { tone } from "./theme.js";

const BAR_SCALE = 65;
const ALL_THREE = { sglt2i: true, nsmra: true, glp1: true };

function mixHex(from, to, amount) {
  const parse = (hex) => hex.slice(1).match(/.{2}/g).map((part) => Number.parseInt(part, 16));
  const a = parse(from);
  const b = parse(to);
  const t = Math.min(1, Math.max(0, amount));
  return `#${[0, 1, 2]
    .map((i) => Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, "0"))
    .join("")}`;
}

function FillShape({ d, viewBox, fill, glow, potentialGlow, pulse, extra }) {
  const inset = (amount) => `inset(${Math.round((1 - amount) * 1000) / 10}% 0 0 0)`;
  return (
    <svg viewBox={viewBox} className={`h-full w-full ${pulse ? "organ-pulse" : ""}`} aria-hidden="true">
      <path d={d} fill="#e8eef3" stroke="#94a3b8" strokeWidth="2.2" />
      {potentialGlow > glow + 0.02 ? (
        <path
          d={d}
          fill={fill}
          opacity="0.22"
          style={{ clipPath: inset(potentialGlow), transition: "clip-path 700ms ease, fill 700ms ease" }}
        />
      ) : null}
      <path
        d={d}
        fill={fill}
        style={{ clipPath: inset(glow), transition: "clip-path 700ms ease, fill 700ms ease" }}
      />
      {extra}
    </svg>
  );
}

function HeartMark(props) {
  return (
    <FillShape
      {...props}
      viewBox="0 0 100 100"
      d="M50 86C50 86 16 63 16 41C16 27 28 18 40 22C45 24 50 32 50 32C50 32 55 24 60 22C72 18 84 27 84 41C84 63 50 86 50 86Z"
      extra={
        <path
          d="M34 44c8 1 12 8 16 8s8-7 16-8"
          fill="none"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />
      }
    />
  );
}

function KidneyMark(props) {
  return (
    <FillShape
      {...props}
      viewBox="0 0 90 110"
      d="M52 10C70 10 78 28 76 52C74 76 64 98 44 100C24 102 12 84 16 60C18 48 26 44 26 34C26 20 36 10 52 10Z"
      extra={
        <path
          d="M40 38c8 4 12 14 12 22s-5 16-12 20"
          fill="none"
          stroke="white"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeLinecap="round"
        />
      }
    />
  );
}

function MaceMark(props) {
  return (
    <FillShape
      {...props}
      viewBox="0 0 100 100"
      d="M18 50c0-18 14-32 32-32s32 14 32 32-14 32-32 32-32-14-32-32Z"
      extra={
        <path
          d="M28 52h10l6-14 8 24 6-10h14"
          fill="none"
          stroke="white"
          strokeOpacity="0.7"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      }
    />
  );
}

function MortalityMark(props) {
  return (
    <FillShape
      {...props}
      viewBox="0 0 100 100"
      d="M22 18h56c6 0 10 4 10 10v44c0 6-4 10-10 10H22c-6 0-10-4-10-10V28c0-6 4-10 10-10Z"
      extra={
        <path
          d="M26 50h12l5-12 8 24 6-12h17"
          fill="none"
          stroke="white"
          strokeOpacity="0.7"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      }
    />
  );
}

const icons = {
  heart: HeartMark,
  kidney: KidneyMark,
  mace: MaceMark,
  mortality: MortalityMark,
};

function CiNote({ ci }) {
  const range = formatReductionCi(ci);
  if (!range) return null;
  return (
    <span className="block text-[9px] font-medium tabular-nums text-muted" title="95% CI from Neuen Figures 1–2">
      {range}
    </span>
  );
}

function BarTrack({ pct, ci, barClass }) {
  const toPct = (value) => `${Math.min(100, (Math.max(0, value) / BAR_SCALE) * 100)}%`;
  const lo = ci ? Math.max(0, Math.round((1 - ci[1]) * 100)) : 0;
  const hi = ci ? Math.max(0, Math.round((1 - ci[0]) * 100)) : 0;
  const showCi = Boolean(ci && pct > 0);
  return (
    <div className="relative h-3.5 rounded-full bg-slate-100">
      {showCi ? (
        <div
          className={`absolute inset-y-0 rounded-full ${barClass} opacity-25`}
          style={{ left: toPct(Math.min(lo, hi)), width: toPct(Math.abs(hi - lo)) }}
        />
      ) : null}
      <div className={`h-full rounded-full ${barClass} transition-all duration-700`} style={{ width: toPct(pct) }} />
      {showCi ? (
        <span
          className="pointer-events-none absolute top-1/2 z-[1] h-3.5 -translate-y-1/2 rounded-sm border-x-2 border-ink/70"
          style={{ left: toPct(Math.min(lo, hi)), width: toPct(Math.abs(hi - lo)) }}
          title={`95% CI ${formatReductionCi(ci)}`}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({ outcome, livePct, liveCi, potentialPct, anyStarted }) {
  const Icon = icons[outcome.icon];
  const toGlow = (pct) => 0.12 + (pct / outcome.maxPct) * 0.88;
  const glow = toGlow(livePct);
  const potentialGlow = toGlow(potentialPct);
  const fill = mixHex(outcome.fillFrom, outcome.fillTo, anyStarted ? glow : 0.18);

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2">
      <div className="h-16 w-16 shrink-0">
        <Icon fill={fill} glow={glow} potentialGlow={potentialGlow} pulse={anyStarted && livePct >= 30} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{outcome.category}</p>
        <p className="text-sm font-semibold text-ink">{outcome.label}</p>
        <p className={`text-lg font-bold tabular-nums leading-tight ${outcome.valueClass}`}>↓{livePct}%</p>
        {anyStarted ? <CiNote ci={liveCi} /> : <p className="text-[10px] text-muted">risk reduction</p>}
        {potentialPct > livePct ? <p className="text-[10px] text-muted">up to ↓{potentialPct}%</p> : null}
      </div>
    </div>
  );
}

function DrugBars({ outcome, started, potential, anyStarted }) {
  const livePct = relativeReductionPct(combinedHazardRatio(outcome, started));
  const liveCi = combinedCi(outcome, started);
  const potentialPct = relativeReductionPct(combinedHazardRatio(outcome, potential));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{outcome.label}</p>
          <p className="text-[10px] leading-snug text-muted">{outcome.hint}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums leading-tight text-proceed">↓{livePct}%</p>
          {anyStarted ? <CiNote ci={liveCi} /> : <p className="text-[10px] text-muted">risk reduction</p>}
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {riskAgents.map((agent) => {
          const t = tone[agent.tone];
          const hr = outcome.hrs[agent.id];
          const classPct = relativeReductionPct(hr);
          const on = started[agent.id];
          const shownPct = on ? classPct : 0;
          return (
            <div key={agent.id} className={`grid grid-cols-[4.75rem_minmax(0,1fr)_3.1rem] items-center gap-2 ${on ? "" : "opacity-60"}`}>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${t.text}`}>
                {on ? <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.bar}`} /> : null}
                {agent.name}
              </span>
              <BarTrack pct={shownPct} ci={on ? outcome.ci[agent.id] : null} barClass={t.bar} />
              <span className="text-right text-[11px] font-semibold leading-tight tabular-nums text-ink">
                {shownPct}%
                {on ? <CiNote ci={outcome.ci[agent.id]} /> : null}
              </span>
            </div>
          );
        })}
        <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_3.1rem] items-center gap-2 border-t border-slate-100 pt-1.5">
          <span className="text-[11px] font-semibold text-ink">Together</span>
          <BarTrack pct={livePct} ci={anyStarted ? liveCi : null} barClass="bg-proceed" />
          <span className="text-right text-[11px] font-semibold leading-tight tabular-nums text-proceed">
            {livePct}%
            {anyStarted ? <CiNote ci={liveCi} /> : null}
          </span>
        </div>
        {anyStarted && potentialPct > livePct ? (
          <p className="pt-0.5 text-[10px] text-muted">Indicated add-ons could reach ↓{potentialPct}%.</p>
        ) : null}
      </div>
    </div>
  );
}

function FootnoteButton({ open, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
        open ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function RiskReductionSection({ form, agents }) {
  const [panel, setPanel] = useState(null);

  const started = useMemo(
    () => ({
      sglt2i: Boolean(form.onSglt),
      nsmra: Boolean(form.onFinerenone),
      glp1: Boolean(form.onGlp),
    }),
    [form.onSglt, form.onFinerenone, form.onGlp],
  );

  const potential = useMemo(
    () => ({
      sglt2i: started.sglt2i || Boolean(agents.sgltGuideline || agents.sgltPractice),
      nsmra: started.nsmra || Boolean(agents.nsmraGuideline),
      glp1: started.glp1 || Boolean(agents.glpGuideline || agents.glpPractice),
    }),
    [started, agents],
  );

  const anyStarted = started.sglt2i || started.nsmra || started.glp1;
  const anyPotential = potential.sglt2i || potential.nsmra || potential.glp1;
  const startedCount = [started.sglt2i, started.nsmra, started.glp1].filter(Boolean).length;
  const vitality = anyStarted ? 0.55 : 0.12;

  function togglePanel(id) {
    setPanel((current) => (current === id ? null : id));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        className="border-b border-slate-200 px-3 py-3"
        style={{
          background: `linear-gradient(180deg, ${mixHex("#f8fafc", "#e6f6ee", vitality)} 0%, #ffffff 100%)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-sglt">Estimated risk reduction</p>
            <h3 className="font-serif text-lg text-ink">Cardiorenal risk reduction</h3>
          </div>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted">Relative risk reduction on top of RASi (the baseline). Ranges are 95% CIs.</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {riskOutcomes.map((outcome) => {
            const livePct = relativeReductionPct(combinedHazardRatio(outcome, started));
            const liveCi = combinedCi(outcome, started);
            const potentialPct = relativeReductionPct(
              combinedHazardRatio(outcome, anyPotential ? potential : ALL_THREE),
            );
            return (
              <div key={outcome.id} className="space-y-2">
                <SummaryCard
                  outcome={outcome}
                  livePct={livePct}
                  liveCi={liveCi}
                  potentialPct={potentialPct}
                  anyStarted={anyStarted}
                />
                <DrugBars
                  outcome={outcome}
                  started={started}
                  potential={potential}
                  anyStarted={anyStarted}
                />
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          {anyStarted
            ? `${startedCount} of 3 pillars started — bars and organ fill rise as medicines are added.`
            : "No pillars started yet. Values are 0% until a medicine is ticked. Faint fill is combination therapy."}
        </p>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <FootnoteButton open={panel === "sources"} onClick={() => togglePanel("sources")}>
            Sources
          </FootnoteButton>
          <span className="text-slate-300">·</span>
          <FootnoteButton open={panel === "lifetime"} onClick={() => togglePanel("lifetime")}>
            Lifetime years at age 50
          </FootnoteButton>
        </div>

        {panel === "sources" ? (
          <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
            <p>
              RASi is baseline (conventional care). These are relative reductions from trials in type 2 diabetes with
              albuminuria; they are shown even if this patient’s labs differ. Single-agent, two-drug, and three-drug
              values follow Neuen Figures 1–2. Ranges are 95% CIs (dual CIs use the paper’s independent log-HR standard
              errors).
            </p>
            {riskSources.map((source) => (
              <p key={source.id}>
                <a className="font-semibold text-sglt underline-offset-2 hover:underline" href={source.href} target="_blank" rel="noreferrer">
                  {source.cite}
                </a>{" "}
                {source.note}
              </p>
            ))}
          </div>
        ) : null}

        {panel === "lifetime" ? (
          <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
            <p>
              Projected event-free years gained for a 50-year-old starting SGLT2i + GLP-1 RA + ns-MRA versus conventional
              care, from Neuen et al. Circulation 2024.
            </p>
            <ul className="space-y-1">
              {lifetimeGainsAge50.map((row) => (
                <li key={row.id} className="flex items-baseline justify-between gap-3 text-ink">
                  <span>{row.label}</span>
                  <span className="tabular-nums font-semibold">
                    +{row.years} y <span className="font-normal text-muted">({row.ci})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
