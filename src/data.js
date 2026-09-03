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
    action: "Pause RASi & finerenone · binder (high) × 72 h · recheck 1 wk",
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
      { band: "proceed", bands: ["proceed", "continue", "reduce"], text: "K⁺ ≤ 6.0 — continue RASi → add SGLT2i" },
      { band: "pause", text: "K⁺ > 6.0 — pause RASi then add SGLT2i" },
    ],
    next: "Check K⁺, then add SGLT2i even if RASi is paused.",
    details: [
      "K⁺ ≤ 6.0: continue RASi → add SGLT2i.",
      "K⁺ > 6.0: pause RASi then add SGLT2i. Binder (high) × 72 h — recheck 1 wk.",
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
    label: "HF hospitalization",
    hint: "First hospitalization for heart failure",
    icon: "heart",
    fillFrom: "#b08a8e",
    fillTo: "#e11d48",
    valueClass: "text-ink",
    maxPct: 55,
    hrs: { sglt2i: 0.64, nsmra: 0.78, glp1: 0.89, combo: 0.45 },
    // Figure 1 duals: SGLT2i+ns-MRA, SGLT2i+GLP-1 RA, ns-MRA+GLP-1 RA
    combos: { sglt2i_nsmra: 0.5, sglt2i_glp1: 0.57, nsmra_glp1: 0.69 },
    // 95% CIs: class and triple from Figures 1–2; duals via the paper’s log-HR SEs
    ci: {
      sglt2i: [0.53, 0.77],
      nsmra: [0.66, 0.92],
      glp1: [0.82, 0.98],
      sglt2i_nsmra: [0.39, 0.64],
      sglt2i_glp1: [0.46, 0.7],
      nsmra_glp1: [0.58, 0.84],
      combo: [0.34, 0.58],
    },
  },
  {
    id: "ckd",
    category: "Kidney",
    label: "CKD progression",
    hint: "Doubling of creatinine, kidney failure, or kidney death",
    icon: "kidney",
    fillFrom: "#94a3b8",
    fillTo: "#0e7c72",
    valueClass: "text-sglt",
    maxPct: 58,
    hrs: { sglt2i: 0.63, nsmra: 0.77, glp1: 0.86, combo: 0.42 },
    // Figure 2 duals
    combos: { sglt2i_nsmra: 0.49, sglt2i_glp1: 0.54, nsmra_glp1: 0.66 },
    ci: {
      sglt2i: [0.53, 0.77],
      nsmra: [0.67, 0.88],
      glp1: [0.72, 1.02],
      sglt2i_nsmra: [0.39, 0.61],
      sglt2i_glp1: [0.42, 0.7],
      nsmra_glp1: [0.53, 0.83],
      combo: [0.31, 0.56],
    },
  },
  {
    id: "mace",
    category: "MACE",
    label: "MACE",
    hint: "Nonfatal MI, nonfatal stroke, or CV death",
    icon: "mace",
    fillFrom: "#94a3b8",
    fillTo: "#1a365d",
    valueClass: "text-glp",
    maxPct: 35,
    hrs: { sglt2i: 0.83, nsmra: 0.9, glp1: 0.86, combo: 0.65 },
    // Figure 1 duals
    combos: { sglt2i_nsmra: 0.75, sglt2i_glp1: 0.72, nsmra_glp1: 0.77 },
    ci: {
      sglt2i: [0.75, 0.93],
      nsmra: [0.81, 1],
      glp1: [0.8, 0.93],
      sglt2i_nsmra: [0.64, 0.87],
      sglt2i_glp1: [0.63, 0.81],
      nsmra_glp1: [0.68, 0.88],
      combo: [0.55, 0.76],
    },
  },
  {
    id: "mortality",
    category: "Survival",
    label: "All-cause mortality",
    hint: "Death from any cause",
    icon: "mortality",
    fillFrom: "#94a3b8",
    fillTo: "#1b7a4e",
    valueClass: "text-proceed",
    maxPct: 33,
    hrs: { sglt2i: 0.85, nsmra: 0.89, glp1: 0.88, combo: 0.67 },
    // Figure 2 duals
    combos: { sglt2i_nsmra: 0.76, sglt2i_glp1: 0.75, nsmra_glp1: 0.78 },
    ci: {
      sglt2i: [0.75, 0.96],
      nsmra: [0.79, 1],
      glp1: [0.82, 0.94],
      sglt2i_nsmra: [0.64, 0.9],
      sglt2i_glp1: [0.65, 0.86],
      nsmra_glp1: [0.68, 0.9],
      combo: [0.55, 0.8],
    },
  },
];

export const lifetimeGainsAge50 = [
  { id: "ckd", label: "CKD progression", years: 5.5, ci: "4.0–6.7" },
  { id: "mace", label: "MACE", years: 3.2, ci: "2.1–4.3" },
  { id: "hhf", label: "Hospitalization for HF", years: 3.2, ci: "2.4–4.0" },
  { id: "mortality", label: "All-cause death", years: 2.4, ci: "1.4–3.4" },
];

export const riskSources = [
  {
    id: "neuen",
    cite: "Neuen BL, et al. Circulation. 2024;149:450–462.",
    href: "https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.123.067584",
    note: "Figures 1–2 class, two-drug, and three-drug hazard ratios and 95% CIs. Effects are versus conventional care that already includes RASi. Dual 95% CIs use the paper’s method (independent log-HR standard errors).",
  },
];
