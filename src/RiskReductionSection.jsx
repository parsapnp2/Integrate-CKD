import { useMemo, useState } from "react";
import { lifetimeGainsAge50, riskAgents, riskOutcomes, riskSources } from "./data.js";
import { combinedHazardRatio, relativeReductionPct } from "./logic.js";
import { tone } from "./theme.js";

const BAR_SCALE = 70;
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

function HeartMark({ fill, glow, potentialGlow, pulse }) {
  const inset = (amount) => `inset(${Math.round((1 - amount) * 1000) / 10}% 0 0 0)`;
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${pulse ? "organ-pulse" : ""}`} aria-hidden="true">
      <path
        d="M50 86C50 86 16 63 16 41C16 27 28 18 40 22C45 24 50 32 50 32C50 32 55 24 60 22C72 18 84 27 84 41C84 63 50 86 50 86Z"
        fill="#e8eef3"
        stroke="#94a3b8"
        strokeWidth="2.2"
      />
      {potentialGlow > glow + 0.02 ? (
        <path
          d="M50 86C50 86 16 63 16 41C16 27 28 18 40 22C45 24 50 32 50 32C50 32 55 24 60 22C72 18 84 27 84 41C84 63 50 86 50 86Z"
          fill={fill}
          opacity="0.22"
          style={{ clipPath: inset(potentialGlow), transition: "clip-path 700ms ease, fill 700ms ease" }}
        />
      ) : null}
      <path
        d="M50 86C50 86 16 63 16 41C16 27 28 18 40 22C45 24 50 32 50 32C50 32 55 24 60 22C72 18 84 27 84 41C84 63 50 86 50 86Z"
        fill={fill}
        style={{ clipPath: inset(glow), transition: "clip-path 700ms ease, fill 700ms ease" }}
      />
      <path
        d="M34 44c8 1 12 8 16 8s8-7 16-8"
        fill="none"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KidneyMark({ fill, glow, potentialGlow, pulse }) {
  const inset = (amount) => `inset(${Math.round((1 - amount) * 1000) / 10}% 0 0 0)`;
  return (
    <svg viewBox="0 0 90 110" className={`h-full w-full ${pulse ? "organ-pulse" : ""}`} aria-hidden="true">
      <path
        d="M52 10C70 10 78 28 76 52C74 76 64 98 44 100C24 102 12 84 16 60C18 48 26 44 26 34C26 20 36 10 52 10Z"
        fill="#e8eef3"
        stroke="#94a3b8"
        strokeWidth="2.2"
      />
      {potentialGlow > glow + 0.02 ? (
        <path
          d="M52 10C70 10 78 28 76 52C74 76 64 98 44 100C24 102 12 84 16 60C18 48 26 44 26 34C26 20 36 10 52 10Z"
          fill={fill}
          opacity="0.22"
          style={{ clipPath: inset(potentialGlow), transition: "clip-path 700ms ease, fill 700ms ease" }}
        />
      ) : null}
      <path
        d="M52 10C70 10 78 28 76 52C74 76 64 98 44 100C24 102 12 84 16 60C18 48 26 44 26 34C26 20 36 10 52 10Z"
        fill={fill}
        style={{ clipPath: inset(glow), transition: "clip-path 700ms ease, fill 700ms ease" }}
      />
      <path
        d="M40 38c8 4 12 14 12 22s-5 16-12 20"
        fill="none"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OutcomeCard({ outcome, started, potential, anyStarted, halfAdditivity }) {
  const liveHr = combinedHazardRatio(outcome, started, halfAdditivity);
  const potentialHr = combinedHazardRatio(outcome, potential, halfAdditivity);
  const previewHr = combinedHazardRatio(outcome, ALL_THREE, halfAdditivity);
  const livePct = relativeReductionPct(liveHr);
  const potentialPct = relativeReductionPct(potentialHr);
  const shownPct = anyStarted ? livePct : relativeReductionPct(previewHr);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{outcome.label}</p>
          <p className="text-[10px] leading-snug text-muted">{outcome.hint}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-proceed">↓{shownPct}%</p>
          <p className="text-[10px] text-muted">{anyStarted ? "with started meds" : "if all three"}</p>
        </div>
      </div>

      <div className="mt-2.5 space-y-1.5">
        {riskAgents.map((agent) => {
          const t = tone[agent.tone];
          const hr = outcome.hrs[agent.id];
          const pct = relativeReductionPct(hr);
          const on = started[agent.id];
          return (
            <div key={agent.id} className={`grid grid-cols-[4.75rem_minmax(0,1fr)_2.4rem] items-center gap-2 ${on ? "" : "opacity-60"}`}>
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${t.text}`}>
                {on ? <span className={`inline-block h-1.5 w-1.5 rounded-full ${t.bar}`} /> : null}
                {agent.name}
              </span>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${t.bar} transition-all duration-700`}
                  style={{ width: `${Math.min(100, (pct / BAR_SCALE) * 100)}%` }}
                  title={`HR ${hr} (${outcome.ci[agent.id]})`}
                />
              </div>
              <span className="text-right text-[11px] font-semibold tabular-nums text-ink">{pct}%</span>
            </div>
          );
        })}
        <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_2.4rem] items-center gap-2 border-t border-slate-100 pt-1.5">
          <span className="text-[11px] font-semibold text-ink">Together</span>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-proceed transition-all duration-700"
              style={{ width: `${Math.min(100, (shownPct / BAR_SCALE) * 100)}%` }}
            />
          </div>
          <span className="text-right text-[11px] font-semibold tabular-nums text-proceed">{shownPct}%</span>
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
  const [halfAdditivity, setHalfAdditivity] = useState(false);
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

  const kidneyOutcome = riskOutcomes.find((item) => item.id === "ckd");
  const heartOutcome = riskOutcomes.find((item) => item.id === "hhf");
  const kidneyPct = relativeReductionPct(combinedHazardRatio(kidneyOutcome, started, halfAdditivity));
  const heartPct = relativeReductionPct(combinedHazardRatio(heartOutcome, started, halfAdditivity));
  const kidneyPotentialPct = relativeReductionPct(
    combinedHazardRatio(kidneyOutcome, anyPotential ? potential : ALL_THREE, halfAdditivity),
  );
  const heartPotentialPct = relativeReductionPct(
    combinedHazardRatio(heartOutcome, anyPotential ? potential : ALL_THREE, halfAdditivity),
  );
  const toGlow = (pct, max) => 0.12 + (pct / max) * 0.88;
  const kidneyGlow = toGlow(kidneyPct, 63);
  const heartGlow = toGlow(heartPct, 55);
  const kidneyPotentialGlow = toGlow(kidneyPotentialPct, 63);
  const heartPotentialGlow = toGlow(heartPotentialPct, 55);
  const vitality = (Math.max(kidneyGlow, kidneyPotentialGlow * 0.45) + Math.max(heartGlow, heartPotentialGlow * 0.45)) / 2;

  const heartFill = mixHex("#b08a8e", "#e11d48", anyStarted ? heartGlow : 0.18);
  const kidneyFill = mixHex("#94a3b8", "#0e7c72", anyStarted ? kidneyGlow : 0.18);

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
            <h3 className="font-serif text-lg text-ink">How each medicine lowers cardiorenal risk</h3>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">
            <input
              type="checkbox"
              checked={halfAdditivity}
              onChange={(event) => setHalfAdditivity(event.target.checked)}
            />
            50% additivity
          </label>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted">
          Relative risk reduction on top of RASi (the baseline). Absolute remaining risk is not shown yet. Tick medicines
          already started to watch the heart and kidney recover.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-2 py-2">
            <div className="h-16 w-16 shrink-0">
              <HeartMark
                fill={heartFill}
                glow={heartGlow}
                potentialGlow={heartPotentialGlow}
                pulse={anyStarted && heartPct >= 30}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Heart</p>
              <p className="text-sm font-semibold text-ink">HF hospitalization</p>
              <p className="text-lg font-bold tabular-nums text-ink">↓{heartPct}%</p>
              {heartPotentialPct > heartPct ? (
                <p className="text-[10px] text-muted">up to ↓{heartPotentialPct}%</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-2 py-2">
            <div className="h-16 w-16 shrink-0">
              <KidneyMark
                fill={kidneyFill}
                glow={kidneyGlow}
                potentialGlow={kidneyPotentialGlow}
                pulse={anyStarted && kidneyPct >= 30}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Kidney</p>
              <p className="text-sm font-semibold text-ink">CKD progression</p>
              <p className="text-lg font-bold tabular-nums text-sglt">↓{kidneyPct}%</p>
              {kidneyPotentialPct > kidneyPct ? (
                <p className="text-[10px] text-muted">up to ↓{kidneyPotentialPct}%</p>
              ) : null}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          {anyStarted
            ? `${startedCount} of 3 pillars started — the heart and kidney fill as combined protection rises.`
            : "No pillars started yet. Solid fill is current protection; the faint fill is combination therapy."}
        </p>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2">
        {riskOutcomes.map((outcome) => (
          <OutcomeCard
            key={outcome.id}
            outcome={outcome}
            started={started}
            potential={potential}
            anyStarted={anyStarted}
            halfAdditivity={halfAdditivity}
          />
        ))}
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
              albuminuria; they are shown even if this patient’s labs differ. Combination assumes independent class effects
              on the hazard-ratio scale, unless 50% additivity is turned on (Neuen: 50% of the GLP-1 RA and ns-MRA effects
              when added to SGLT2i).
            </p>
            {riskSources.map((source) => (
              <p key={source.id}>
                <a className="font-semibold text-sglt underline-offset-2 hover:underline" href={source.href} target="_blank" rel="noreferrer">
                  {source.cite}
                </a>{" "}
                {source.note}
              </p>
            ))}
            <p>
              CKD combination with FLOW is estimated from SGLT2i × FLOW GLP-1 × ns-MRA (HR 0.37 full additivity; 0.48 at
              50% additivity). FLOW’s kidney composite includes CV death; Neuen’s original CKD end point did not.
            </p>
          </div>
        ) : null}

        {panel === "lifetime" ? (
          <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
            <p>
              Projected event-free years gained for a 50-year-old starting SGLT2i + GLP-1 RA + ns-MRA versus conventional
              care, from Neuen et al. Circulation 2024. These were not recalculated with FLOW.
            </p>
            <ul className="space-y-1">
              {lifetimeGainsAge50.map((row) => {
                const years = halfAdditivity ? row.halfYears : row.years;
                const ci = halfAdditivity ? row.halfCi : row.ci;
                return (
                  <li key={row.id} className="flex items-baseline justify-between gap-3 text-ink">
                    <span>{row.label}</span>
                    <span className="tabular-nums font-semibold">
                      +{years} y <span className="font-normal text-muted">({ci})</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p>{halfAdditivity ? "Showing the paper’s 50% additivity projections." : "Turn on 50% additivity to see the attenuated projections."}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
