import { kBands } from "./data.js";
import { interactiveRange, rangeError } from "./inputRanges.js";

export function parseNum(value) {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function kBandFromValue(k) {
  if (k == null) return null;
  if (k <= 4.8) return kBands.find((band) => band.id === "proceed");
  if (k <= 5.5) return kBands.find((band) => band.id === "continue");
  if (k <= 6.0) return kBands.find((band) => band.id === "reduce");
  return kBands.find((band) => band.id === "pause");
}

export function relativeReductionPct(hr) {
  return Math.round((1 - hr) * 100);
}

function selectedKeys(selected) {
  return ["sglt2i", "nsmra", "glp1"].filter((id) => selected[id]);
}

export function combinedHazardRatio(outcome, selected) {
  const keys = selectedKeys(selected);
  if (keys.length === 0) return 1;
  if (keys.length === 1) return outcome.hrs[keys[0]];
  if (outcome.combinationMethod === "multiplicative") {
    return keys.reduce((hr, key) => hr * outcome.hrs[key], 1);
  }
  if (keys.length === 3) return outcome.hrs.combo;
  const dual = outcome.combos[keys.join("_")];
  if (dual == null) {
    throw new Error(`Missing Figure 1/2 dual HR for ${outcome.id}: ${keys.join("_")}`);
  }
  return dual;
}

export function combinedCi(outcome, selected) {
  const keys = selectedKeys(selected);
  if (keys.length === 0) return null;
  if (keys.length > 1 && outcome.combinationMethod === "multiplicative") {
    // Neuen 2024: independent log-HR variances add. Published, rounded CIs
    // approximate each standard error; multiplying CI endpoints is incorrect.
    const variance = keys.reduce((sum, key) => {
      const [lower, upper] = outcome.ci[key];
      return sum + ((Math.log(upper) - Math.log(lower)) / (2 * 1.96)) ** 2;
    }, 0);
    const logHr = Math.log(combinedHazardRatio(outcome, selected));
    const margin = 1.96 * Math.sqrt(variance);
    return [Math.exp(logHr - margin), Math.exp(logHr + margin)];
  }
  const ci = keys.length === 1 ? outcome.ci[keys[0]] : outcome.ci[keys.length === 3 ? "combo" : keys.join("_")];
  if (ci == null) {
    throw new Error(`Missing Figure 1/2 CI for ${outcome.id}: ${keys.join("_")}`);
  }
  return ci;
}

export function formatReductionCi(ci) {
  if (!ci) return null;
  const lo = Math.round((1 - ci[1]) * 100);
  const hi = Math.round((1 - ci[0]) * 100);
  const fmt = (n) => (n < 0 ? `−${Math.abs(n)}` : String(n));
  return `${fmt(Math.min(lo, hi))}–${fmt(Math.max(lo, hi))}`;
}

export function finerenoneDose(egfr) {
  if (egfr == null || egfr < 25) return null;
  if (egfr < 60) return "10 mg daily";
  return "20 mg daily";
}

/** eGFR-dip states from the eGFR management protocol. */
export const DIP_NONE = "none";
export const DIP_30 = "dip30";
export const DIP_30_2 = "dip30x2";
export const DIP_40 = "dip40";

/** The one-pager states UACR thresholds in mg/mmol; 8.84 matches the Calculator tab. */
export function uacrToMgMmol(value, unit) {
  const n = parseNum(value);
  if (n == null) return null;
  return unit === "mgg" ? n / 8.84 : n;
}

export const AGENT_IDS = ["rasi", "sglt2i", "nsmra", "glp1"];

/**
 * Every directive these values trigger, per agent.
 *
 * `kind` separates the two clinical questions the one-pager asks:
 *   block     — do not initiate or titrate (Fig 3 initiation/titration guidelines)
 *   continue  — keep running, same or reduced dose (K⁺ key, 4.8–5.5)
 *   reduce    — lower the dose of something already running
 *   pause     — K⁺ wording: "pause RASi & finerenone"
 *   stop      — eGFR wording: "stop / dose reduce"
 *
 * K⁺ rules touch RASi and finerenone only: SGLT2i continues below eGFR 20 until
 * RRT, and no source puts a K⁺, BP or eGFR restriction on GLP-1 RA.
 */
export function agentDirectives({ k, sbp, hba1c, dip, hypoEpisodes, started = {} }) {
  const out = { rasi: [], sglt2i: [], nsmra: [], glp1: [] };
  const push = (agents, directive) => {
    for (const agent of agents) out[agent].push({ ...directive, agents });
  };

  const sbpLow = sbp != null && sbp < 90;

  // Initiation / titration gates.
  if (sbpLow) {
    push(["rasi", "sglt2i", "nsmra"], { id: "sbp", kind: "block", text: "SBP < 90 — no initiation or titration" });
  }
  if (dip === DIP_30) {
    push(["rasi", "sglt2i", "nsmra"], {
      id: "dip30",
      kind: "block",
      text: "eGFR dip ≥ 30% vs last labs — no initiation or titration at this visit; repeat labs in 2 weeks",
    });
  }
  if (k != null && k > 4.8) {
    push(["rasi", "nsmra"], { id: "k48", kind: "block", text: "K⁺ > 4.8 — no initiation or titration" });
  }
  if (hba1c != null && hba1c > 10) {
    push(["sglt2i"], { id: "a1c", kind: "block", text: "HbA1c > 10% — no initiation" });
  }
  if (hypoEpisodes) {
    push(["glp1"], {
      id: "hypo",
      kind: "block",
      text: "≥ 2 hypoglycemic episodes/wk (Level 2–3) — do not start or up-titrate semaglutide",
    });
  }

  // K⁺ key: what to do with RASi and finerenone that are already running.
  if (k != null) {
    if (k > 4.8 && k <= 5.5) {
      push(["rasi", "nsmra"], {
        id: "k-continue",
        kind: "continue",
        text: "K⁺ 4.8–5.5 — continue at the same or a reduced dose",
      });
    } else if (k > 5.5 && k <= 6.0) {
      push(["rasi"], { id: "k-reduce", kind: "reduce", text: "K⁺ 5.5–6.0 — reduce RASi dose" });
      push(["nsmra"], { id: "k-pause-fin", kind: "pause", text: "K⁺ 5.5–6.0 — pause finerenone" });
    } else if (k > 6.0) {
      push(["rasi", "nsmra"], { id: "k-pause", kind: "pause", text: "K⁺ > 6.0 — pause RASi & finerenone" });
    }
  }

  // eGFR escalations, in the protocol's own "stop / dose reduce" wording.
  if (dip === DIP_30_2) {
    push(["rasi", "sglt2i", "nsmra"], {
      id: "dip30x2",
      kind: "stop",
      text: "eGFR dip ≥ 30% on 2 consecutive labs — stop or dose-reduce; renal ultrasound; clinical judgment to change other BP meds",
    });
  }
  if (dip === DIP_40) {
    push(["rasi", "sglt2i", "nsmra"], {
      id: "dip40",
      kind: "stop",
      text: "eGFR dip ≥ 40% vs baseline — sequentially stop or dose-reduce; no further titration; renal ultrasound",
    });
  }

  // BP protocol step 2 only applies once RASi is running.
  if (sbpLow && started.rasi) {
    push(["rasi"], {
      id: "bp-step2",
      kind: "reduce",
      text: "SBP < 90 — reduce or stop other BP meds first, then ± consider a decrease in RASi dose",
    });
  }

  return out;
}

const STARTED_STATUS = [
  ["pause", { id: "pause", label: "Pause", band: "pause" }],
  ["stop", { id: "stop", label: "Stop / reduce", band: "pause" }],
  ["reduce", { id: "reduce", label: "Reduce", band: "reduce" }],
  ["block", { id: "noTitrate", label: "No titration", band: "reduce" }],
  ["continue", { id: "continue", label: "Continue", band: "continue" }],
];

/** Most severe directive wins; not-started agents can only be ready or blocked. */
export function resolveAgentStatus(directives, isStarted, isIndicated) {
  if (!isStarted) {
    if (!isIndicated) return { id: "notIndicated", label: "Not indicated", band: null };
    if (directives.length > 0) return { id: "blocked", label: "Blocked", band: "pause" };
    return { id: "ready", label: "Ready", band: "proceed" };
  }
  for (const [kind, status] of STARTED_STATUS) {
    if (directives.some((d) => d.kind === kind)) return status;
  }
  return { id: "continue", label: "Continue", band: "proceed" };
}

/** What the K+ band means for RASi and finerenone at each assessment. */
export function kActionsForBand(bandId) {
  if (bandId === "proceed") return ["K⁺ ≤ 4.8 — initiate and titrate all agents"];
  if (bandId === "continue") return ["K⁺ 4.8–5.5 — continue RASi & finerenone at same or reduced dose"];
  if (bandId === "reduce") {
    return [
      "K⁺ 5.5–6.0 — reduce RASi dose, pause finerenone (continue RASi if able)",
      "K⁺ binder (standard dose) + K⁺-wasting diuretic per BP",
    ];
  }
  if (bandId === "pause") {
    return [
      "K⁺ > 6.0 — pause RASi & finerenone",
      "K⁺ binder (high dose) × 72 h then standard dose, + diuretic per BP",
      "K⁺ 6.0–<6.5: repeat within 24 hours; K⁺ ≥ 6.5: immediate hospital assessment",
    ];
  }
  return [];
}

/** UKKA 2026 guidelines 1.2.2–1.2.3 and 4.1–4.2. Takes priority over sequencing. */
export function potassiumUrgency(k) {
  if (k == null || !Number.isFinite(k) || k < 6) return null;
  if (k >= 6.5) return {
    title: "Immediate hospital assessment",
    detail: "K⁺ ≥ 6.5 mmol/L — arrange immediate hospital assessment and treatment. Do not wait for routine repeat labs or medication sequencing.",
    recheck: "Immediate assessment and treatment",
    stepId: null, dose: null,
  };
  return {
    title: "Urgent potassium review — repeat within 24 hours",
    detail: "K⁺ 6.0–<6.5 mmol/L — arrange clinical review and repeat potassium within 24 hours. If acutely unwell or acute kidney injury is suspected, arrange hospital assessment. Address hyperkalaemia before routine medication sequencing.",
    recheck: "Repeat K⁺ within 24 hours",
    stepId: null, dose: null,
  };
}

export function evaluatePatient(input) {
  const inputIssues = [];
  const lab = (key) => {
    const n = parseNum(input[key]);
    const issue = rangeError(input[key], interactiveRange(key, input), true);
    if (issue) {
      inputIssues.push(issue);
      return null;
    }
    return n;
  };
  const rawK = parseNum(input.k);
  const urgency = potassiumUrgency(rawK);
  const k = lab("k");
  const egfr = lab("egfr");
  const rawUacr = lab("uacr");
  const uacr = uacrToMgMmol(rawUacr, input.uacrUnit ?? "mgmmol");
  const sbp = lab("sbp");
  const hba1c = lab("hba1c");
  const dip = input.dip ?? DIP_NONE;
  const band = kBandFromValue(k);

  // Guideline / clinical-practice indications, one-pager top band.
  const sgltGuideline =
    egfr != null &&
    ((Boolean(input.t2d) && egfr >= 20) ||
      (uacr != null && egfr >= 20 && uacr >= 20) ||
      (uacr != null && egfr >= 20 && egfr <= 45 && uacr < 20));
  const sgltPractice = egfr != null && uacr != null && egfr >= 20 && uacr >= 3;
  const nsmraGuideline = egfr != null && uacr != null && egfr >= 25 && uacr >= 3;
  // Practice extends ns-MRA to non-diabetic CKD and to both T1D and T2D.
  const nsmraPractice = nsmraGuideline;
  const glpGuideline = Boolean(input.t2d) && egfr != null && uacr != null && egfr >= 25 && uacr >= 3;
  const glpPractice = Boolean(input.t2d) && uacr != null && uacr >= 3;

  const started = {
    rasi: Boolean(input.onRasi),
    sglt2i: Boolean(input.onSglt),
    nsmra: Boolean(input.onFinerenone),
    glp1: Boolean(input.onGlp),
  };
  const directives = agentDirectives({
    k,
    sbp,
    hba1c,
    dip,
    hypoEpisodes: Boolean(input.hypoEpisodes),
    started,
  });
  // Only initiation/titration gates can stop the *next* step in the sequence.
  const blocked = (agent) => directives[agent].some((d) => d.kind === "block" || d.kind === "stop");

  const agents = {
    sgltGuideline,
    sgltPractice,
    nsmraGuideline,
    nsmraPractice,
    glpGuideline,
    glpPractice,
  };

  const indicated = {
    rasi: true, // foundation, started first in every arm of the algorithm
    sglt2i: sgltGuideline || sgltPractice,
    nsmra: nsmraGuideline || nsmraPractice,
    glp1: glpGuideline || glpPractice,
  };

  const statuses = {};
  for (const id of AGENT_IDS) {
    statuses[id] = resolveAgentStatus(directives[id], started[id], indicated[id]);
    if (inputIssues.length && ["ready", "continue", "notIndicated"].includes(statuses[id].id)) {
      statuses[id] = { id: "awaiting", label: "Awaiting required information", band: null };
    }
    if (urgency) statuses[id] = { id: "urgent", label: "Urgent potassium review", band: "pause" };
  }
  // De-duplicated directive list for the summary panels.
  const allDirectives = [];
  for (const id of AGENT_IDS) {
    for (const directive of directives[id]) {
      if (!allDirectives.some((d) => d.id === directive.id)) allDirectives.push(directive);
    }
  }

  const base = {
    band,
    directives,
    statuses,
    allDirectives,
    started,
    inputIssues,
    urgency,
    agents,
    indicated,
    dose: finerenoneDose(egfr),
    kActions: urgency ? [urgency.detail] : inputIssues.length && band?.id === "proceed"
      ? ["K⁺ is within the initiation threshold. Complete the required information before medication decisions."]
      : kActionsForBand(band?.id),
  };

  if (urgency) return { ...base, now: urgency, notes: [] };

  if (inputIssues.length) {
    return {
      ...base,
      now: {
        title: "Awaiting required information",
        detail: inputIssues.join(" "),
        stepId: null,
        recheck: null,
        dose: null,
      },
      notes: [],
    };
  }

  // Skip only classes that are not indicated; never skip an eligible blocked class.
  const nextPending = AGENT_IDS.find((id) => !started[id] && indicated[id]);
  const skipped = AGENT_IDS.filter((id) => !started[id] && !indicated[id]);
  let now;

  if (nextPending === "rasi") {
    // Foundation step.
    if (blocked("rasi")) {
      now = {
        title: "Hold RASi",
        detail: `Do not initiate RASi: ${directives.rasi.filter((d) => d.kind === "block" || d.kind === "stop").map((d) => d.text).join("; ")}.`,
        stepId: "rasi",
        recheck: dip === DIP_30 ? "Repeat labs in 2 weeks" : dip === DIP_30_2 || dip === DIP_40 ? "Renal ultrasound" : null,
        dose: null,
      };
    } else {
      now = {
        title: "Start RASi at half dose",
        detail: "Foundation — start first, at half dose, then titrate up.",
        stepId: "rasi",
        recheck: "Check K⁺ before adding SGLT2i",
        dose: "Half dose, then titrate ↑",
      };
    }
  } else if (nextPending === "sglt2i") {
    // Urgent potassium values have already returned above.
    const kNote = k > 5.5 ? "K⁺ > 5.5 — reduce RASi dose, then add SGLT2i." : "K⁺ ≤ 5.5 — continue RASi, then add SGLT2i.";
    if (blocked("sglt2i")) {
      now = {
        title: "Hold SGLT2i",
        detail: `${kNote} Do not initiate SGLT2i: ${directives.sglt2i.filter((d) => d.kind === "block" || d.kind === "stop").map((d) => d.text).join("; ")}.`,
        stepId: "sglt2i",
        recheck: dip === DIP_30 ? "Repeat labs in 2 weeks" : dip === DIP_30_2 || dip === DIP_40 ? "Renal ultrasound" : null,
        dose: null,
      };
    } else {
      now = {
        title: "Add SGLT2i at target dose",
        detail: `${kNote} Continue below eGFR 20 until RRT.`,
        stepId: "sglt2i",
        recheck: "Check K⁺ before ns-MRA",
        dose: "empagliflozin 10 mg · dapagliflozin 10 mg · canagliflozin 100 mg",
      };
    }
  } else if (nextPending === "nsmra") {
    // Pre-ns-MRA assessment: three K+ branches straight from the one-pager.
    if (k > 4.8) {
      now = {
        title: "Defer ns-MRA",
        detail: "K⁺ 4.8–6.0 — no ns-MRA yet; continue RASi at the same or a reduced dose.",
        stepId: "finerenone",
        recheck: "Recheck K⁺ before ns-MRA",
        dose: null,
      };
    } else if (blocked("nsmra")) {
      now = {
        title: "Hold ns-MRA",
        detail: `Do not initiate ns-MRA: ${directives.nsmra.filter((d) => d.kind === "block" || d.kind === "stop").map((d) => d.text).join("; ")}.`,
        stepId: "finerenone",
        recheck: dip === DIP_30 ? "Repeat labs in 2 weeks" : dip === DIP_30_2 || dip === DIP_40 ? "Renal ultrasound" : null,
        dose: null,
      };
    } else {
      now = {
        title: `Add finerenone ${finerenoneDose(egfr)}`,
        detail: "K⁺ ≤ 4.8 — start ns-MRA.",
        stepId: "finerenone",
        recheck: "Recheck K⁺ in 2–4 weeks after starting",
        dose: "10 mg (eGFR 25–59) · 20 mg (eGFR ≥ 60)",
      };
    }
  } else if (nextPending === "glp1") {
    // Pre-GLP-1 RA assessment: K+ governs RASi/finerenone; GLP-1 RA is added regardless.
    if (blocked("glp1")) {
      now = {
        title: "Do not start semaglutide yet",
        detail: "≥ 2 hypoglycemic episodes/wk at Level 2–3. Review the hypoglycemia protocol first.",
        stepId: "glp1",
        recheck: null,
        dose: null,
      };
    } else {
      now = {
        title: "Add GLP-1 RA at quarter dose",
        detail: `Semaglutide 0.25 mg weekly to limit GI effects — initiated last. ${
          band ? kActionsForBand(band.id)[0] + "." : ""
        }`,
        stepId: "glp1",
        recheck: null,
        dose: "semaglutide 0.25 mg weekly",
      };
    }
  } else {
    // Pre-titration assessment. An eGFR dip or low SBP stops titration outright,
    // so check that before reading the K+ band.
    const titrationStop = AGENT_IDS.filter((id) => started[id])
      .flatMap((agent) => directives[agent].filter((d) => d.kind === "stop"))
      .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);
    const titrationHold = AGENT_IDS.filter((id) => started[id])
      .flatMap((agent) => directives[agent].filter((d) => d.kind === "block" && d.id !== "k48"))
      .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);

    if (titrationStop.length > 0) {
      now = {
        title: "Do not titrate — stop or dose-reduce",
        detail: titrationStop.map((d) => d.text).join(". ") + ".",
        stepId: "titrate",
        recheck: "Renal ultrasound",
        dose: null,
      };
    } else if (titrationHold.length > 0) {
      now = {
        title: "Hold titration",
        detail: titrationHold.map((d) => d.text).join(". ") + ".",
        stepId: "titrate",
        recheck: dip === DIP_30 ? "Repeat labs in 2 weeks" : null,
        dose: null,
      };
    } else if (k > 5.5) {
      now = {
        title: started.nsmra ? "Reduce RASi, pause finerenone" : "Reduce RASi",
        detail: "K⁺ 5.5–6.0. K⁺ binder (standard dose) + K⁺-wasting diuretic per BP.",
        stepId: "titrate",
        recheck: started.nsmra ? "Re-test finerenone 10 mg once K⁺ ≤ 4.8" : "Recheck K⁺ before titration",
        dose: null,
      };
    } else if (k > 4.8) {
      now = {
        title: "Continue at the same or reduced dose",
        detail: `K⁺ 4.8–5.5 — continue ${started.nsmra ? "RASi & finerenone" : "RASi"} onward if possible; do not uptitrate RASi or ns-MRA.`,
        stepId: "titrate",
        recheck: null,
        dose: null,
      };
    } else {
      now = {
        title: "Titrate to maximum tolerated dose",
        detail: "K⁺ ≤ 4.8 — re-test RASi at 50% of last tolerated dose.",
        stepId: "titrate",
        recheck: null,
        dose: [started.rasi && "RASi ↑", started.nsmra && "finerenone → 20 mg", started.glp1 && "semaglutide 0.25 → 0.5 → 1 mg weekly"].filter(Boolean).join(" · "),
      };
    }
  }

  const names = { rasi: "RASi", sglt2i: "SGLT2i", nsmra: "Finerenone", glp1: "GLP-1 RA" };
  const notes = skipped.map((id) => `${names[id]} not indicated on these values — skipped in the sequence; not marked as started.`);
  if (input.onInsulin) {
    if (hba1c != null && hba1c > 8) {
      notes.push("On insulin or a secretagogue, HbA1c > 8% — no dose adjustment needed.");
    } else if (hba1c != null) {
      notes.push("On insulin or a secretagogue, HbA1c ≤ 8% — reduce insulin by 10–20%, reduce secretagogue by 50% or stop.");
    }
    notes.push("GLP-1 RA with insulin — refer to endocrinology.");
  }
  if (band?.id === "reduce" || band?.id === "pause") {
    notes.push("Dietitian referral for all participants, as needed.");
  }
  if (now.stepId === "sglt2i") {
    notes.push("SGLT2i: eGFR “dip” expected · genital mycotic infection · sick-day medication.");
  }
  if (now.stepId === "finerenone" && egfr != null && egfr >= 24 && egfr <= 26) {
    notes.push("At eGFR ≈ 25, consider finerenone first, before SGLT2i.");
  }
  if (now.stepId === "glp1") {
    notes.push("GLP-1 RA: check for diabetic retinopathy · avoid in idiopathic pancreatitis or MEN 2.");
  }

  return { ...base, now, notes, skipped };
}
