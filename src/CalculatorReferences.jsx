import { lifetimeGainsAge50, riskOutcomes, riskSources } from "./data.js";

const baselineSources = [
  {
    id: "score", short: "SCORE 2003",
    cite: "SCORE — Conroy RM, et al. Estimation of ten-year risk of fatal cardiovascular disease in Europe: the SCORE project. European Heart Journal. 2003;24:987–1003.",
    href: "https://doi.org/10.1016/S0195-668X(03)00114-3",
  },
  {
    id: "ckd-patch", short: "CKD-PC · Matsushita 2020",
    cite: "CKD Prognosis Consortium — Matsushita K, et al. Incorporating kidney disease measures into cardiovascular risk prediction: Development and validation in 9 million adults from 72 datasets. EClinicalMedicine. 2020;27:100552. Web Table 13.",
    href: "https://doi.org/10.1016/j.eclinm.2020.100552",
  },
  {
    id: "kfre-original", short: "KFRE · Tangri 2011",
    cite: "Tangri N, et al. A predictive model for progression of chronic kidney disease to kidney failure. JAMA. 2011;305:1553–1559.",
    href: "https://doi.org/10.1001/jama.2011.451",
  },
  {
    id: "kfre-calibration", short: "KFRE calibration · Tangri 2016",
    cite: "Tangri N, et al. Multinational assessment of accuracy of equations for predicting risk of kidney failure: a meta-analysis. JAMA. 2016;315:164–174.",
    href: "https://doi.org/10.1001/jama.2015.18202",
  },
  {
    id: "prevent", short: "PREVENT 2024",
    cite: "Khan SS, et al. Development and validation of the American Heart Association’s PREVENT equations. Circulation. 2024;149:430–449.",
    href: "https://doi.org/10.1161/CIRCULATIONAHA.123.067626",
  },
];

const shortNames = {
  "smartc-glp1": "SMART-C 2024",
  "smartc-diabetes": "SMART-C 2022",
  infinity: "INFINITY 2026",
  neuen: "Neuen 2024",
  lee2025: "Lee 2025",
  mann2026: "SELECT / FLOW / SOUL · Mann 2026",
};
const references = [...baselineSources, ...riskSources];
const sourceById = Object.fromEntries(references.map((source) => [source.id, source]));

const evidence = [
  {
    id: "ckd", baseline: "4-variable KFRE · 2 or 5 years",
    baselineSources: ["kfre-original", "kfre-calibration"],
    sources: { sglt2i: "smartc-diabetes", nsmra: "infinity", glp1: "mann2026" },
    limitation: "KFRE predicts dialysis/transplant. The semaglutide estimate also includes persistent eGFR <15, so applying it to KFRE is an approximation, and its CI reaches 1.00. Finerenone’s matching endpoint is post hoc.",
  },
  {
    id: "hhf", baseline: "PREVENT base · incident HF · 10 or 30 years",
    baselineSources: ["prevent"],
    sources: { sglt2i: "smartc-glp1", nsmra: "infinity", glp1: "lee2025" },
    limitation: "PREVENT predicts incident heart failure, while the treatment ratios measure HF hospitalization. Applying these ratios to incident HF is an endpoint approximation.",
  },
  {
    id: "mace", baseline: "PREVENT base · ASCVD proxy · 10 or 30 years",
    baselineSources: ["prevent"],
    sources: { sglt2i: "smartc-glp1", nsmra: "neuen", glp1: "lee2025" },
    limitation: "PREVENT ASCVD covers MI, fatal coronary disease and stroke. Trial MACE is nonfatal MI, nonfatal stroke or cardiovascular death, including other CV causes. These endpoints differ; ASCVD is a proxy.",
  },
  {
    id: "cvdeath", baseline: "SCORE + CKD Patch · 10 years only",
    baselineSources: ["score", "ckd-patch"],
    sources: { sglt2i: "smartc-glp1", nsmra: "infinity", glp1: "mann2026" },
    limitation: "Fixed to the low-risk European calibration, the closest published calibration to Canada but not a Canadian one, and the published equation differs slightly from the online CKD-PC tool, so treat this as a research estimate. European SCORE calibration with eGFR and UACR added by CKD-PC. Used here only at ages 40–65 without known CVD. Applying trial effects is an indirect approximation. SMART-C includes people with diabetes. INFINITY covers albuminuric CKD with and without T2D and excludes undetermined deaths from CV death. SELECT/FLOW/SOUL pools differing high-risk populations with and without T2D; its estimate is specific to semaglutide.",
  },
];

function SourceLink({ id, full = false }) {
  const source = sourceById[id];
  if (!source) return <span className="text-muted">{shortNames[id] ?? id}</span>;
  return <a className="font-semibold text-sglt underline-offset-2 hover:underline" href={source.href} target="_blank" rel="noreferrer">
    {full ? source.cite : source.short ?? shortNames[id]}
  </a>;
}

const formatHr = (value) => value.toFixed(Number.isInteger(value * 100) ? 2 : 3);

function MedicineEvidence({ outcome, agent, source }) {
  const hr = outcome.hrs[agent];
  const ci = outcome.ci[agent];
  return <>
    <p className="whitespace-nowrap font-semibold tabular-nums text-ink">{hr.toFixed(2)} ({formatHr(ci[0])}–{formatHr(ci[1])})</p>
    <p className="text-muted">{Math.round((1 - hr) * 100)}% relative reduction</p>
    <SourceLink id={source} />
    {source === "mann2026" ? <p className="font-semibold text-muted">Semaglutide</p> : null}
  </>;
}

export default function CalculatorReferences() {
  return (
    <details className="group min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer rounded-2xl px-3 py-2 text-xs font-semibold text-ink focus-visible:outline-2 focus-visible:outline-sglt">
        Sources and evidence
        <span className="ml-2 font-normal text-muted">Baseline models, medication effects and limitations</span>
      </summary>
      <div className="space-y-4 border-t border-slate-100 p-3 text-[11px] leading-relaxed text-muted">
        <p className="lg:hidden">Scroll across the table to see all columns.</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200" role="region" aria-label="Baseline and medication evidence table" tabIndex={0}>
          <table className="w-full min-w-[960px] border-collapse text-left align-top">
            <caption className="p-2 text-left font-semibold text-ink">Baseline estimation and treatment evidence. Medication cells show HR (95% CI); lower HR means lower hazard.</caption>
            <thead className="bg-slate-50 text-ink">
              <tr>{["Outcome", "Baseline estimate and source", "SGLT2 inhibitor", "Finerenone", "GLP-1 RA", "Key limitations"].map((title) => <th key={title} scope="col" className="p-2 align-top">{title}</th>)}</tr>
            </thead>
            <tbody>
              {evidence.map((row) => {
                const outcome = riskOutcomes.find((item) => item.id === row.id);
                return <tr key={row.id} className="border-t border-slate-200">
                  <th scope="row" className="p-2 align-top font-semibold text-ink">{outcome.label}</th>
                  <td className="min-w-40 p-2 align-top">
                    <p>{row.baseline}</p>
                    {row.baselineSources.map((id) => <p key={id}><SourceLink id={id} /></p>)}
                  </td>
                  {["sglt2i", "nsmra", "glp1"].map((agent) => <td key={agent} className="p-2 align-top"><MedicineEvidence outcome={outcome} agent={agent} source={row.sources[agent]} /></td>)}
                  <td className="min-w-56 p-2 align-top">{row.limitation}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-ink">How to interpret the estimates</h4>
          <p>Relative reduction is (1 − HR) × 100. Absolute treated risk is approximated as 1 − (1 − baseline)<sup>HR</sup>. It is not baseline × HR. The treated range reflects medication HR uncertainty only, not baseline-model uncertainty.</p>
          <p>All combinations multiply the current individual HRs, assuming independent effects preserved in combination. Approximate combination CIs use the sum of independent log-HR variances, following <SourceLink id="neuen" />. These are indirect modelled estimates, not results from a trial of each combination.</p>
          <p>Kidney combinations inherit the differing trial endpoints. Trial effects are on top of conventional care including RASi. Baseline models describe care in their source cohorts, not an untreated risk. Applying these effects to KFRE, PREVENT or SCORE + CKD Patch is an approximation; projecting them beyond trial follow-up assumes sustained benefit.</p>
          <p>GLP-1 MACE and HF hospitalization estimates use long-acting agents in T2D from Lee 2025. Kidney failure and cardiovascular-death effects use semaglutide specifically, from the SELECT, FLOW and SOUL pooled analysis (Mann 2026), and should not be assumed identical across all GLP-1 RAs. Table 2 reports cardiovascular-death HR 0.85 (0.77–0.95), a 15% relative reduction. That paper’s broader composites (0.84 primary, 0.80 kidney-specific) are not substituted for kidney failure.</p>
          <p>Cardiovascular-death baseline uses the coronary and noncoronary fatal-event equations from <SourceLink id="score" />, with eGFR and UACR adjustments from <SourceLink id="ckd-patch" />. It remains a 10-year estimate when the HF/MACE horizon is changed. The calibration is fixed to low-risk Europe and is independent of the KFRE region setting; it is not a Canadian calibration. This implementation requires eGFR and UACR and uses the reference tool’s selectable input limits: age 40–65, SBP 90–180 mm Hg, eGFR 15–120, UACR 5–1500 mg/g and cholesterol 3.879–7.241 mmol/L. These are implementation limits, not the full age range of the CKD-PC cohorts.</p>
          <p>The published Web Table 13 and the online CKD-PC calculator are not numerically identical. This implementation follows the published coefficients, using the original SCORE exponent 5.47 consistently for high-risk men’s noncoronary risk (Table 13 prints 5.57 in one term). For a synthetic 60-year-old man, nonsmoker, SBP 120, total cholesterol 5.1 mmol/L, eGFR 45 and UACR 30 mg/g, the low-risk published equation gives 4.53% versus 4.62% online. The remaining difference has not been reconciled; treat this as a research estimate. Medication CIs do not capture this baseline uncertainty or differences in event ascertainment.</p>
          <p>PREVENT is for people without known CVD, ages 30–79 for 10-year risk and 30–59 for 30-year risk. The base model is used here. KFRE uses age, sex, eGFR and UACR; the region selection changes KFRE calibration only. ACR conversion: mg/mmol × 8.84 = mg/g. Cholesterol conversion: mmol/L × 38.67 = mg/dL.</p>
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-ink">References</h4>
          <ol className="list-decimal space-y-1 pl-5">
            {references.map((source) => <li key={source.id}><SourceLink id={source.id} full /></li>)}
          </ol>
          <p>Official baseline tools: <a className="font-semibold text-sglt hover:underline" href="https://kidneyfailurerisk.com/" target="_blank" rel="noreferrer">KFRE</a> · <a className="font-semibold text-sglt hover:underline" href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" target="_blank" rel="noreferrer">AHA PREVENT</a> · <a className="font-semibold text-sglt hover:underline" href="https://ckdpcrisk.org/ckdpatchscore/" target="_blank" rel="noreferrer">SCORE + CKD Patch</a>.</p>
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-ink">Original lifetime projections at age 50</h4>
          <p>From <SourceLink id="neuen" />: estimated event-free years gained with all three medicines versus conventional care. These original projections have not been recalculated using the newer medication estimates.</p>
          <ul className="space-y-1">
            {lifetimeGainsAge50.map((row) => <li key={row.id}>{row.label}: +{row.years} years (95% CI {row.ci}).</li>)}
          </ul>
        </div>
      </div>
    </details>
  );
}
