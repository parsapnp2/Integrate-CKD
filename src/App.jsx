import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import CalculatorView from "./CalculatorView.jsx";
import ChartView from "./ChartView.jsx";
import InteractiveView from "./InteractiveView.jsx";
import PatientView from "./PatientView.jsx";
import Icon from "./PatientIcons.jsx";

/**
 * Three clinician views and one patient view. The patient tab is grouped apart
 * and carries its own accent, because switching to it changes who is reading.
 */
const tabs = [
  { id: "chart", label: "Chart", icon: "trend", group: "clinician", accent: "#0e7c72" },
  { id: "interactive", label: "Interactive", icon: "bolt", group: "clinician", accent: "#0e7c72" },
  { id: "calculator", label: "Calculator", icon: "clipboard", group: "clinician", accent: "#0e7c72" },
  { id: "patient", label: "For patients", icon: "people", group: "patient", accent: "#c98b3f" },
];

export default function App() {
  const [tab, setTab] = useState("chart");
  const active = tabs.find((item) => item.id === tab) ?? tabs[0];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e6f6ee_0%,#eef3f7_38%,#eef3f7_100%)]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-2">
            <div className="min-w-0">
              <h1 className="font-serif text-lg leading-tight text-ink sm:text-xl">Integrate-CKD Algorithm</h1>
              <p className="text-[11px] leading-snug text-muted">
                Guideline indications, clinical-practice thresholds, and the sequential treatment pathway
              </p>
            </div>
            <p className="hidden max-w-xs text-[10px] leading-snug text-muted lg:block">
              {active.group === "patient"
                ? "Written for patients. Estimates only, not medical advice."
                : "Visual aid only. Confirm with guidelines and the patient record."}
            </p>
          </div>

          {/* The bar sits on the header's own bottom rule, so the active tab joins
              the page instead of floating above it. */}
          <nav className="-mb-px mt-1.5 flex flex-wrap items-end gap-0.5" aria-label="Views">
            {tabs.map((item, index) => {
              const isActive = tab === item.id;
              const startsPatientGroup = index > 0 && item.group !== tabs[index - 1].group;
              return (
                <div key={item.id} className="flex items-end">
                  {startsPatientGroup ? <span className="mx-2 mb-2 hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" /> : null}
                  <button
                    type="button"
                    onClick={() => setTab(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold transition-colors"
                    style={{
                      borderColor: isActive ? item.accent : "transparent",
                      color: isActive ? item.accent : "#5b6b7c",
                      background: isActive ? `color-mix(in srgb, ${item.accent} 8%, white)` : "transparent",
                    }}
                  >
                    <Icon name={item.icon} size={15} />
                    {item.label}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-2.5 sm:px-5">
        {/* Every view stays mounted and the inactive ones are hidden, so anything
            typed into a tab survives switching away from it and back. */}
        <div className={tab === "chart" ? "" : "hidden"}>
          <ChartView />
        </div>
        <div className={tab === "interactive" ? "" : "hidden"}>
          <InteractiveView />
        </div>
        <div className={tab === "calculator" ? "" : "hidden"}>
          <CalculatorView />
        </div>
        <div className={tab === "patient" ? "" : "hidden"}>
          <PatientView />
        </div>
      </main>
      <Analytics />
    </div>
  );
}
