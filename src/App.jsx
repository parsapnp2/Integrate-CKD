import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import ChartView from "./ChartView.jsx";
import InteractiveView from "./InteractiveView.jsx";

const tabs = [
  { id: "chart", label: "Chart" },
  { id: "interactive", label: "Interactive" },
];

export default function App() {
  const [tab, setTab] = useState("chart");

  return (
    <div
      className={`min-h-screen ${
        tab === "interactive"
          ? "bg-[linear-gradient(180deg,#e6f6ee_0%,#eef3f7_38%,#eef3f7_100%)]"
          : ""
      }`}
    >
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 sm:px-5">
          <div className="min-w-0">
            <h1 className="font-serif text-lg leading-tight text-ink sm:text-xl">
              Integrate-CKD Algorithm
            </h1>
            <p className="text-[11px] text-muted">Guideline indications, clinical-practice thresholds, and the sequential treatment pathway</p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="hidden max-w-xs text-[10px] leading-snug text-muted lg:block">
            Visual aid only. Confirm with guidelines and the patient record.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-2.5 sm:px-5">
        {tab === "chart" ? <ChartView /> : <InteractiveView />}
      </main>
      <Analytics />
    </div>
  );
}
