import { kBands } from "./data.js";

export function parseNum(value) {
  if (value === "" || value == null) return null;
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

export function evaluatePatient(input) {
  const k = parseNum(input.k);
  const egfr = parseNum(input.egfr);
  const uacr = parseNum(input.uacr);
  const sbp = parseNum(input.sbp);
  const hba1c = parseNum(input.hba1c);
  const band = kBandFromValue(k);

  const sgltGuideline =
    egfr != null &&
    ((Boolean(input.t2d) && egfr >= 20) ||
      (uacr != null && egfr >= 20 && uacr >= 20) ||
      (uacr != null && egfr >= 20 && egfr <= 45 && uacr < 20));
  const sgltPractice = egfr != null && uacr != null && egfr >= 20 && uacr >= 3;
  const nsmraGuideline = egfr != null && uacr != null && egfr >= 25 && uacr >= 3;
  const glpGuideline = Boolean(input.t2d) && egfr != null && uacr != null && egfr >= 25 && uacr >= 3;
  const glpPractice = Boolean(input.t2d) && uacr != null && uacr >= 3;

  const stops = [];
  if (sbp != null && sbp < 90) {
    stops.push({ id: "sbp", text: "SBP < 90 — do not initiate or titrate any agent" });
  }
  if (input.egfrDip) {
    stops.push({ id: "dip", text: "eGFR dip ≥ 30% vs last labs — do not initiate or titrate" });
  }
  if (k != null && k > 4.8) {
    stops.push({ id: "k", text: "K⁺ > 4.8 — do not start or uptitrate RASi / ns-MRA" });
  }
  if (hba1c != null && hba1c > 10 && !input.onSglt) {
    stops.push({ id: "a1c", text: "HbA1c > 10% — do not initiate SGLT2i" });
  }

  const haltAll = stops.some((stop) => stop.id === "sbp" || stop.id === "dip");

  let now = {
    title: "Enter labs",
    detail: "Add K⁺, eGFR, UACR, SBP, and HbA1c to see the next action.",
    stepId: null,
  };

  if (k == null || egfr == null || sbp == null) {
    return {
      band,
      stops,
      agents: { sgltGuideline, sgltPractice, nsmraGuideline, glpGuideline, glpPractice },
      dose: finerenoneDose(egfr),
      now,
      notes: [],
    };
  }

  if (haltAll) {
    now = {
      title: "Hold initiation and titration",
      detail: "Correct hypotension or the eGFR dip first, then return to the sequence.",
      stepId: null,
    };
  } else if (!input.onRasi) {
    if (k <= 4.8) {
      now = {
        title: "Start RASi at half dose",
        detail: "Foundation step. Recheck K⁺, then add SGLT2i.",
        stepId: "rasi",
      };
    } else if (k > 6) {
      now = {
        title: "Pause RASi — still add SGLT2i",
        detail: "Use a high-dose K⁺ binder and recheck in 1 week. Do not delay SGLT2i for hyperkalemia alone.",
        stepId: "rasi",
      };
    } else {
      now = {
        title: "Do not start or uptitrate RASi",
        detail: "Keep or reduce the RASi dose if already in use. You can still move to SGLT2i.",
        stepId: "rasi",
      };
    }
  } else if (!input.onSglt) {
    if (hba1c != null && hba1c > 10) {
      now = {
        title: "Defer SGLT2i",
        detail: "HbA1c > 10%. Address glycemia first, then start SGLT2i if eGFR allows.",
        stepId: "sglt2i",
      };
    } else if (sgltGuideline || sgltPractice) {
      now = {
        title: "Start SGLT2i at target dose",
        detail: "Empagliflozin 10 mg, dapagliflozin 10 mg, or canagliflozin 100 mg. Continue until RRT.",
        stepId: "sglt2i",
      };
    } else {
      now = {
        title: "SGLT2i not indicated on these labs",
        detail: "eGFR is likely below 20. Recheck indication if the clinical picture changes.",
        stepId: "sglt2i",
      };
    }
  } else if (!input.onFinerenone) {
    if (!nsmraGuideline) {
      now = {
        title: "Finerenone not indicated yet",
        detail: "Needs eGFR ≥ 25 and UACR ≥ 3. Move to GLP-1 RA if that class is indicated.",
        stepId: "finerenone",
      };
    } else if (band?.id === "proceed") {
      now = {
        title: `Start finerenone ${finerenoneDose(egfr)}`,
        detail: "Recheck K⁺ in 2–4 weeks, then add GLP-1 RA.",
        stepId: "finerenone",
      };
    } else if (band?.id === "continue" || band?.id === "reduce") {
      now = {
        title: "Defer ns-MRA",
        detail: "K⁺ 4.8–6.0. Continue RASi same/reduced. Recheck before ns-MRA.",
        stepId: "finerenone",
      };
    } else {
      now = {
        title: "Pause RASi and finerenone",
        detail: "High-dose binder for 72 h, recheck K⁺ in 1 week. Keep SGLT2i.",
        stepId: "finerenone",
      };
    }
  } else if (!input.onGlp) {
    if (glpGuideline) {
      now = {
        title: "Start GLP-1 RA at quarter dose",
        detail: "Semaglutide 0.25 mg weekly. Then titrate all agents as tolerated.",
        stepId: "glp1",
      };
    } else {
      now = {
        title: "GLP-1 RA not indicated on kidney criteria",
        detail: "Needs T2D plus eGFR ≥ 25 and UACR ≥ 3. You can still titrate the agents already started.",
        stepId: "glp1",
      };
    }
  } else {
    now = {
      title: "Titrate to maximum tolerated dose",
      detail:
        band?.id === "proceed"
          ? "K⁺ allows uptitration of RASi and finerenone (toward 20 mg). Semaglutide toward 1 mg."
          : "Do not uptitrate RASi / ns-MRA while K⁺ is above 4.8. Reassess after K⁺ management.",
      stepId: "titrate",
    };
  }

  const notes = [];
  if (input.onInsulin && hba1c != null && hba1c <= 8 && (now.stepId === "sglt2i" || now.stepId === "glp1")) {
    notes.push("On insulin or a secretagogue with HbA1c ≤ 8% — reduce those agents when adding SGLT2i or GLP-1 RA.");
  }
  if (band?.id === "reduce" || band?.id === "pause") {
    notes.push("Refer to dietitian and use a K⁺ binder rather than abandoning the pathway when possible.");
  }

  return {
    band,
    stops,
    agents: { sgltGuideline, sgltPractice, nsmraGuideline, glpGuideline, glpPractice },
    dose: finerenoneDose(egfr),
    now,
    notes,
  };
}
