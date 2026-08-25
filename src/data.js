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
      "Consider first if eGFR < 25 before SGLT2i.",
      "Gradual uptitration.",
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
  { label: "SBP < 90", note: "Any agent" },
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
