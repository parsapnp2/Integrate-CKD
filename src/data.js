export const kBands = [
  {
    id: "proceed",
    label: "Proceed",
    range: "K⁺ ≤ 4.8",
    action: "Initiate and titrate all agents",
    color: "proceed",
  },
  {
    id: "continue",
    label: "Continue",
    range: "K⁺ 4.8–5.5",
    action: "Same or reduced dose onward",
    color: "continue",
  },
  {
    id: "reduce",
    label: "Reduce",
    range: "K⁺ 5.5–6.0",
    action: "Reduce RASi · pause finerenone · K⁺ binder (standard)",
    color: "reduce",
  },
  {
    id: "pause",
    label: "Pause",
    range: "K⁺ > 6.0",
    action: "Urgent review · <6.5: repeat within 24 h · ≥6.5: immediate hospital assessment",
    color: "pause",
  },
];

export const indications = [
  {
    id: "sglt2i",
    name: "SGLT2i",
    tone: "sglt",
    guideline: [
      "T2D, eGFR ≥ 20",
      "eGFR ≥ 20, UACR ≥ 20",
      "eGFR ≥ 20 and ≤ 45, UACR < 20",
    ],
    practice: ["eGFR ≥ 20, UACR ≥ 3; with or without T2D"],
  },
  {
    id: "nsmra",
    name: "ns-MRA (finerenone)",
    tone: "mra",
    guideline: ["eGFR ≥ 25, UACR ≥ 3"],
    practice: ["eGFR ≥ 25, UACR ≥ 3; non-DM CKD; for T1D and T2D"],
  },
  {
    id: "glp1",
    name: "GLP-1 RA",
    tone: "glp",
    guideline: ["T2D, eGFR ≥ 25, UACR ≥ 3"],
    practice: ["T2D, UACR ≥ 3"],
  },
];

export const steps = [
  {
    id: "rasi",
    number: "1",
    name: "RASi",
    role: "Foundation — start first, at half dose",
    tone: "rasi",
    summary: "Half dose then titrate ↑",
    dose: "Half dose then titrate ↑",
    action: "Foundation — start first, at half dose.",
    checks: [
      { band: "proceed", bands: ["proceed", "continue", "reduce"], text: "K⁺ < 6.0 — continue/reduce RASi per K⁺ band → add SGLT2i" },
      { band: "pause", text: "K⁺ > 6.0 — urgent potassium pathway first; pause RASi; reassess before SGLT2i" },
    ],
    next: "Check K⁺; address urgent hyperkalaemia before adding SGLT2i, even if RASi is paused.",
    details: [
      "K⁺ < 6.0: continue/reduce RASi per K⁺ band → add SGLT2i. At K⁺ 6.0, use the urgent potassium pathway first.",
      "K⁺ > 6.0: urgent potassium pathway first; <6.5: repeat within 24 h; ≥6.5: immediate hospital assessment. Pause RASi; reassess before SGLT2i.",
    ],
  },
  {
    id: "sglt2i",
    number: "2",
    name: "SGLT2i",
    role: "Target dose — continue below eGFR 20 until RRT",
    tone: "sglt",
    summary: "Target dose — continue below eGFR 20 until RRT.",
    dose: "empagliflozin 10 mg · dapagliflozin 10 mg · canagliflozin 100 mg",
    action: "Target dose — continue below eGFR 20 until RRT.",
    checks: [
      { band: "proceed", text: "K⁺ ≤ 4.8 — start finerenone" },
      { band: "continue", bands: ["continue", "reduce"], text: "K⁺ 4.8–6.0 — defer ns-MRA, continue RASi same/reduced" },
      { band: "pause", text: "K⁺ > 6.0 — pause RASi, recheck before ns-MRA" },
    ],
    next: "Check K⁺ before starting finerenone.",
    details: [
      "eGFR “dip” expected.",
      "Genital mycotic infection.",
      "Sick-day medication.",
      "Start if HbA1c < 10.",
    ],
  },
  {
    id: "finerenone",
    number: "3",
    name: "Finerenone · ns-MRA",
    role: "Recheck K⁺ in 2–4 weeks after starting",
    tone: "mra",
    summary: "Recheck K⁺ in 2–4 weeks after starting.",
    dose: "10 mg (eGFR 25–59) · 20 mg (eGFR ≥ 60)",
    action: "Recheck K⁺ in 2–4 weeks after starting.",
    checks: [
      { band: "proceed", text: "K⁺ ≤ 4.8 — proceed to GLP-1 RA" },
      { band: "continue", text: "K⁺ 4.8–5.5 — continue both" },
      { band: "reduce", text: "K⁺ 5.5–6.0 — pause finerenone, continue RASi if able" },
      { band: "pause", text: "K⁺ > 6.0 — pause both" },
    ],
    next: "Check K⁺ 2–4 weeks after start or dose change, then add GLP-1 RA.",
    details: [
      "Consider first if eGFR ≈ 25, before SGLT2i.",
      "Gradual and slow uptitration.",
      "Check / re-test K⁺.",
    ],
  },
  {
    id: "glp1",
    number: "4",
    name: "GLP-1 RA",
    role: "Quarter dose to limit GI effects — initiated last",
    tone: "glp",
    summary: "Quarter dose to limit GI effects — initiated last.",
    dose: "semaglutide 0.25 mg weekly",
    action: "Quarter dose to limit GI effects — initiated last.",
    checks: [],
    next: "Titrate to maximum tolerated dose.",
    details: [
      "Check for diabetic retinopathy.",
      "Endocrinology referral if on insulin.",
      "Avoid if pancreatitis or MEN 2 history.",
    ],
  },
  {
    id: "titrate",
    number: "5",
    name: "Titrate to maximum tolerated dose",
    role: "RASi ↑ · finerenone → 20 mg · semaglutide 0.25 → 0.5 → 1 mg weekly",
    tone: "ink",
    summary: "Titrate to maximum tolerated dose.",
    dose: "RASi ↑ · finerenone → 20 mg · semaglutide 0.25 → 0.5 → 1 mg weekly",
    action: "Titrate to maximum tolerated dose.",
    checks: [],
    next: "Reassess K⁺, eGFR, BP, and symptoms at each titration.",
    details: [
      "RASi ↑",
      "Finerenone → 20 mg",
      "Semaglutide 0.25 → 0.5 → 1 mg weekly",
    ],
  },
];

export const stopRules = [
  { label: "SBP < 90", note: "systolic / orthostatic — RASi / ns-MRA / SGLT2i" },
  { label: "eGFR dip ≥ 30%", note: "vs last labs" },
  { label: "K⁺ > 4.8", note: "RASi / ns-MRA" },
  { label: "HbA1c > 10%", note: "SGLT2i start" },
];

export const protocols = [
  {
    id: "egfr",
    title: "eGFR dip",
    points: [
      "≥ 30% vs last labs: repeat in 2 wks, hold meds.",
      "≥ 40% vs baseline: stop/reduce dose, renal ultrasound.",
    ],
  },
  {
    id: "bp",
    title: "Blood pressure",
    points: [
      "Step 1: reduce other BP meds.",
      "Step 2: consider RASi dose decrease.",
    ],
  },
  {
    id: "hypo",
    title: "Hypoglycemia",
    points: [
      "HbA1c > 8%: no adjustment.",
      "HbA1c ≤ 8%: reduce insulin/secretagogue.",
    ],
  },
];

export const kManagement = [
  "Add K⁺-wasting diuretic.",
  "Dietitian referral.",
];

/** Relative effects on top of RASi (conventional care) from Neuen et al. Circulation 2024, Figures 1 and 2. */
export const riskAgents = [
  { id: "sglt2i", formKey: "onSglt", name: "SGLT2i", tone: "sglt" },
  { id: "nsmra", formKey: "onFinerenone", name: "ns-MRA", tone: "mra" },
  { id: "glp1", formKey: "onGlp", name: "GLP-1 RA", tone: "glp" },
];

export const riskOutcomes = [
  {
    id: "hhf",
    category: "Heart",
    label: "Heart failure",
    hint: "Hospitalization for heart failure",
    icon: "heart",
    fillFrom: "#b08a8e",
    fillTo: "#e11d48",
    valueClass: "text-ink",
    maxPct: 55,
    // SGLT2i: Apperloo/SMART-C Lancet Diabetes Endocrinol 2024, Figure 2B
    // (hospitalisation for heart failure alone, 12 trials, n=73,238).
    // Finerenone: INFINITY, Lancet 2026, Figure 2 (HF hospitalization alone).
    // GLP-1 RA: Lee et al. Diabetes Care 2025 (long-acting agents, T2D).
    combinationMethod: "multiplicative",
    hrs: { sglt2i: 0.7, nsmra: 0.78, glp1: 0.86 },
    ci: {
      sglt2i: [0.65, 0.75],
      nsmra: [0.66, 0.92],
      glp1: [0.79, 0.93],
    },
  },
  {
    id: "ckd",
    category: "Kidney",
    label: "Kidney failure",
    hint: "Dialysis or transplant",
    icon: "kidney",
    fillFrom: "#94a3b8",
    fillTo: "#0e7c72",
    valueClass: "text-sglt",
    maxPct: 58,
    // SGLT2i: Nuffield/SMART-C Lancet 2022, kidney-failure subcomponent in the four
    // CKD trials — the endpoint KFRE actually predicts (ESKD), not the eGFR-decline composite.
    // Finerenone: INFINITY Figure 2, post-hoc dialysis/transplant outcome, HR 0.77
    // (0.64–0.94).
    // GLP-1 kidney estimate: semaglutide, Mann et al. Lancet Diabetes Endocrinol 2026,
    // Table 2 / Figure 2 (kidney failure: persistent eGFR <15 or kidney replacement
    // therapy; 206 vs 241 events). Endpoint is broader than KFRE dialysis/transplant.
    combinationMethod: "multiplicative",
    hrs: { sglt2i: 0.67, nsmra: 0.77, glp1: 0.83 },
    ci: {
      sglt2i: [0.59, 0.77],
      nsmra: [0.64, 0.94],
      glp1: [0.69, 1.00],
    },
  },
  {
    id: "mace",
    category: "ASCVD",
    label: "ASCVD",
    hint: "MACE risk reduction used as a proxy for ASCVD risk reduction",
    icon: "mace",
    fillFrom: "#94a3b8",
    fillTo: "#1a365d",
    valueClass: "text-glp",
    maxPct: 35,
    // SGLT2i: Apperloo/SMART-C Lancet Diabetes Endocrinol 2024 (MACE, 12 trials, n=73,238)
    combinationMethod: "multiplicative",
    hrs: { sglt2i: 0.89, nsmra: 0.9, glp1: 0.86 },
    ci: {
      sglt2i: [0.85, 0.94],
      nsmra: [0.81, 1],
      glp1: [0.81, 0.90],
    },
  },
  {
    id: "cvdeath",
    category: "CV death",
    label: "Cardiovascular death",
    hint: "Death from cardiovascular causes",
    icon: "cvdeath",
    fillFrom: "#94a3b8",
    fillTo: "#1b7a4e",
    valueClass: "text-proceed",
    maxPct: 33,
    // Cardiovascular death only: SMART-C 2024 Figure 2C, INFINITY 2026 Figure 2,
    // and SELECT/FLOW/SOUL pooled analysis (Mann 2026), Table 2.
    // Preserve INFINITY’s published upper CI of 0.999.
    combinationMethod: "multiplicative",
    hrs: { sglt2i: 0.86, nsmra: 0.82, glp1: 0.85 },
    ci: {
      sglt2i: [0.80, 0.92],
      nsmra: [0.67, 0.999],
      glp1: [0.77, 0.95],
    },
  },
];

export const lifetimeGainsAge50 = [
  { id: "ckd", label: "CKD progression", years: 5.5, ci: "4.0–6.7" },
  { id: "mace", label: "MACE", years: 3.2, ci: "2.1–4.3" },
  { id: "hhf", label: "Hospitalization for HF", years: 3.2, ci: "2.4–4.0" },
];

export const riskSources = [
  {
    id: "lee2025",
    cite: "Lee MMY, et al. Cardiovascular and kidney outcomes and mortality with long-acting injectable and oral GLP-1 receptor agonists. Diabetes Care. 2025;48:846–859.",
    href: "https://doi.org/10.2337/dc25-0241",
    note: "10 trials, 71,351 people with T2D. HF hospitalization 0.86 (0.79–0.93), MACE 0.86 (0.81–0.90).",
  },
  {
    id: "mann2026",
    cite: "SELECT, FLOW and SOUL pooled analysis — Mann JFE, et al. Effect of semaglutide on kidney outcomes in the SELECT, FLOW, and SOUL trials: a prespecified pooled analysis. Lancet Diabetes Endocrinol. 2026. Published online August 7.",
    href: "https://doi.org/10.1016/S2213-8587(26)00134-8",
    note: "Semaglutide cardiovascular death HR 0.85 (0.77–0.95), Table 2, 647 vs 751 events. Kidney failure HR 0.83 (0.69–1.00), Table 2 and Figure 2; 30,787 participants, 206 vs 241 events. Endpoint: persistent eGFR <15 or initiation of kidney replacement therapy, broader than KFRE dialysis/transplant. The primary kidney composite (0.84) and narrower kidney composite (0.80) are not used.",
  },
  {
    id: "smartc-glp1",
    cite: "SMART-C — Apperloo EM, Neuen BL, et al. Lancet Diabetes Endocrinol. 2024;12:545–557.",
    href: "https://doi.org/10.1016/S2213-8587(24)00155-4",
    note: "SGLT2i anchors for hospitalisation for heart failure (0.70, Figure 2B), MACE (0.89, Figure 1) and cardiovascular death (0.86, 95% CI 0.80–0.92, Figure 2C). SMART-C collaborative meta-analysis, 12 trials, 73,238 participants with diabetes. Effects were consistent across background GLP-1 RA use, supporting (but not proving) the independence assumption.",
  },
  {
    id: "smartc-diabetes",
    cite: "SMART-C — Nuffield Department of Population Health Renal Studies Group. Lancet. 2022;400:1788–1801.",
    href: "https://doi.org/10.1016/S0140-6736(22)02074-8",
    note: "SGLT2i anchor for kidney failure (0.67, kidney-failure subcomponent of the four CKD trials). 13 trials, 90,409 participants. Effects were consistent regardless of diabetes status, primary kidney diagnosis, and baseline eGFR (trial means 37–85), which supports applying one hazard ratio across the calculator’s input range.",
  },
  {
    id: "infinity",
    cite: "INFINITY — Neuen BL, et al. Lancet. 2026;407:2375–2386.",
    href: "https://doi.org/10.1016/S0140-6736(26)01009-3",
    note: "Finerenone alone added to conventional care: HF hospitalization 0.78 (95% CI 0.66–0.92), dialysis or transplant 0.77 (0.64–0.94; post-hoc analysis), and cardiovascular death 0.82 (0.67–0.999), Figure 2. Cardiovascular death excludes undetermined deaths. The dialysis/transplant endpoint matches KFRE; the broader kidney-failure outcome (0.85) also includes sustained eGFR below 15. Studied albuminuric CKD with and without type 2 diabetes; median follow-up 3.1 years. Current individual estimates feed the multiplicative combination models. Lifetime projections retain their original inputs.",
  },
  {
    id: "neuen",
    cite: "Neuen BL, et al. Circulation. 2024;149:450–462.",
    href: "https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.123.067584",
    note: "Finerenone MACE (0.90, 95% CI 0.81–1.00), multiplicative combination methodology, and original lifetime projections. Current combinations are recalculated from the individual estimates with approximate CIs based on independent log-HR variances; the published lifetime projections are unchanged.",
  },
];

// All combinations use products of current individual HRs and independent log-HR variances.
