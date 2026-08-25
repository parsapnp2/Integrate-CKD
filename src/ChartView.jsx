import { useMemo, useState } from "react";
import { indications, kBands, kManagement, protocols, steps, stopRules } from "./data.js";
import { bandStyle, tone } from "./theme.js";

function matchesFilter(check, kFilter) {
  if (!kFilter) return true;
  return (check.bands ?? [check.band]).includes(kFilter);
}

function Section({ title, hint, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm ${className}`}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        <div className="flex items-center gap-3">
          {hint ? <p className="hidden text-[11px] text-muted sm:block">{hint}</p> : null}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

function IconPill({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="3.5" width="10" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function ChartView() {
  const [selectedId, setSelectedId] = useState("rasi");
  const [kFilter, setKFilter] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [indicationsOpen, setIndicationsOpen] = useState(false);
  const [protocolsOpen, setProtocolsOpen] = useState(false);

  const selected = useMemo(
    () => steps.find((step) => step.id === selectedId) ?? steps[0],
    [selectedId],
  );
  const selectedBand = kBands.find((band) => band.id === kFilter);
  const selectedTone = tone[selected.tone];

  function toggleK(id) {
    setKFilter((current) => (current === id ? null : id));
  }

  return (
    <div className="space-y-3">
      <Section
        title="Who qualifies"
        action={
          <button
            type="button"
            onClick={() => setIndicationsOpen((value) => !value)}
            className="text-[11px] font-semibold text-sglt"
          >
            {indicationsOpen ? "Hide all" : "Open all"}
          </button>
        }
      >
        <div className="grid gap-2 md:grid-cols-3">
          {indications.map((item) => {
            const t = tone[item.tone];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndicationsOpen((value) => !value)}
                className={`overflow-hidden rounded-xl border text-left shadow-sm ${t.border}`}
              >
                <div className={`flex items-center justify-between px-3 py-2 ${t.bg}`}>
                  <span className={`text-sm font-bold ${t.text}`}>{item.name}</span>
                  <span className="text-[10px] text-muted">{indicationsOpen ? "Hide" : "Open"}</span>
                </div>
                {indicationsOpen && (
                  <div>
                    <div className={`px-3 py-2 text-white ${t.bar}`}>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-white/80">
                        Guideline indications
                      </p>
                      <ul className="mt-1 space-y-0.5 text-[11px] font-medium leading-snug">
                        {item.guideline.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
                        Clinical practice
                      </p>
                      <ul className="mt-1 space-y-0.5 text-[11px] leading-snug text-ink">
                        {item.practice.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Serum K⁺ key" hint="Click a band to highlight matching actions">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {kBands.map((band, index) => {
              const s = bandStyle[band.color];
              const active = kFilter === band.id;
              return (
                <button
                  key={band.id}
                  type="button"
                  onClick={() => toggleK(band.id)}
                  className={`px-2.5 py-2 text-left ${index > 0 ? "border-t border-slate-200 lg:border-t-0 lg:border-l" : ""} ${
                    active ? `${s.bg} text-white` : `${s.soft} ${s.text}`
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide">{band.label}</span>
                    <span className={`text-[10px] ${active ? "text-white/85" : "opacity-80"}`}>{band.range}</span>
                  </div>
                  <p className={`mt-0.5 text-[10px] leading-snug ${active ? "text-white/90" : "text-ink/75"}`}>
                    {band.action}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Sequential initiation" hint="Follow the pathway · click a step">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <ol className="relative ml-1">
            <div className="absolute top-3 bottom-3 left-[15px] w-px bg-slate-200" aria-hidden="true" />
            {steps.map((step, index) => {
              const isInk = step.tone === "ink";
              const t = tone[step.tone];
              const active = selectedId === step.id;
              return (
                <li key={step.id}>
                  {index > 0 && (
                    <CheckNode
                      step={steps[index - 1]}
                      kFilter={kFilter}
                      onSelect={() => setSelectedId(steps[index - 1].id)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(step.id);
                      setOpenDetails(false);
                    }}
                    className={`relative flex w-full items-stretch gap-3 rounded-xl border text-left shadow-sm transition ${
                      isInk
                        ? "border-ink bg-ink text-white"
                        : active
                          ? `${t.border} ${t.bg}`
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`relative z-[1] m-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ring-4 ring-white ${t.bar}`}
                    >
                      {step.number}
                    </span>
                    <span className="min-w-0 flex-1 py-2 pr-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`text-sm font-semibold ${isInk ? "text-white" : "text-ink"}`}>
                          {step.name}
                        </span>
                        {!isInk && <IconPill className={`h-3.5 w-3.5 ${t.text}`} />}
                      </span>
                      <span className={`block text-[10px] ${isInk ? "text-white/75" : "text-muted"}`}>
                        {step.role}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <aside className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3 shadow-sm">
            <div className={`h-1 w-12 rounded-full ${selectedTone.bar}`} />
            <p className={`mt-2 text-[10px] font-semibold uppercase tracking-wide ${selected.tone === "ink" ? "text-ink" : selectedTone.text}`}>
              Step {selected.number}
            </p>
            <h3 className="font-serif text-lg leading-tight text-ink">{selected.name}</h3>
            <p className="text-[11px] text-muted">{selected.role}</p>

            <div className="mt-2 rounded-lg border border-slate-100 bg-white p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Do this</p>
              <p className="text-sm font-semibold leading-snug text-ink">{selected.action}</p>
            </div>

            <dl className="mt-2 space-y-1.5 text-xs">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Dose</dt>
                <dd className="text-ink">{selected.dose}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Then</dt>
                <dd className="text-ink">{selected.next}</dd>
              </div>
            </dl>

            {selected.checks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {selected.checks.map((check) => {
                  const s = bandStyle[check.band];
                  const dim = !matchesFilter(check, kFilter);
                  return (
                    <li
                      key={check.text}
                      className={`rounded-md border px-2 py-1 text-[11px] ${s.soft} ${s.border} ${s.text} ${
                        dim ? "opacity-35" : ""
                      }`}
                    >
                      {check.text}
                    </li>
                  );
                })}
              </ul>
            )}

            {selectedBand && (
              <p
                className={`mt-2 rounded-md px-2 py-1 text-[11px] ${bandStyle[selectedBand.id].soft} ${bandStyle[selectedBand.id].text}`}
              >
                {selectedBand.label}: {selectedBand.action}
              </p>
            )}

            <button
              type="button"
              onClick={() => setOpenDetails((value) => !value)}
              className="mt-2 text-[11px] font-semibold text-glp underline-offset-2 hover:underline"
            >
              {openDetails ? "Hide extra notes" : "Show extra notes"}
            </button>
            {openDetails && (
              <ul className="mt-1.5 space-y-1 text-[11px] text-muted">
                {selected.details.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
                {selected.id === "rasi" &&
                  kManagement.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
              </ul>
            )}
          </aside>
        </div>
      </Section>

      <Section title="Do not initiate or titrate if" className="border-pause/20 bg-pause-soft">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {stopRules.map((rule) => (
            <div key={rule.label} className="rounded-lg bg-white/90 px-2.5 py-1.5 shadow-sm">
              <p className="text-xs font-semibold text-ink">{rule.label}</p>
              <p className="text-[10px] text-muted">{rule.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Clinical considerations"
        action={
          <button
            type="button"
            onClick={() => setProtocolsOpen((value) => !value)}
            className="text-[11px] font-semibold text-sglt"
          >
            {protocolsOpen ? "Hide all" : "Open all"}
          </button>
        }
      >
        <div className="grid gap-2 md:grid-cols-3">
          {protocols.map((protocol) => (
            <button
              key={protocol.id}
              type="button"
              onClick={() => setProtocolsOpen((value) => !value)}
              className="rounded-xl border border-slate-200 bg-slate-50/90 p-2.5 text-left shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{protocol.title}</h3>
                <span className="text-[10px] text-muted">{protocolsOpen ? "Hide" : "Open"}</span>
              </div>
              {protocolsOpen && (
                <ul className="mt-1.5 space-y-1 text-[11px] text-muted">
                  {protocol.points.map((point) => (
                    <li key={point}>· {point}</li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function CheckNode({ step, kFilter, onSelect }) {
  if (!step.checks.length) {
    return <div className="relative z-[1] ml-[15px] h-3 w-px bg-slate-200" />;
  }
  return (
    <div className="relative z-[1] my-1.5 ml-8">
      <button
        type="button"
        onClick={onSelect}
        className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm"
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-md bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Check K⁺
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {step.checks.map((check) => {
            const s = bandStyle[check.band];
            const dim = !matchesFilter(check, kFilter);
            return (
              <span
                key={check.text}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-snug ${s.soft} ${s.text} ${
                  dim ? "opacity-30" : ""
                }`}
              >
                {check.text}
              </span>
            );
          })}
        </div>
      </button>
    </div>
  );
}
