import { parseNum } from "./logic.js";

/** AHA PREVENT base model, Khan et al. Circulation 2024;149:430–449 (corrected). */
const MGDL_TO_MMOL = 0.02586;

const models = {
  cvd: {
    female: {
      10: {
        constant: -3.307728,
        age: 0.7939329,
        nonHDL: 0.0305239,
        hdl: -0.1606857,
        sbpLo: -0.2394003,
        sbpHi: 0.3600781,
        dm: 0.8667604,
        smoke: 0.5360739,
        egfrLo: 0.6045917,
        egfrHi: 0.0433769,
        bpmed: 0.3151672,
        statin: -0.1477655,
        statinNonHdl: 0.1197879,
        bpmedSbpHi: -0.0663612,
        ageNonHdl: -0.0819715,
        ageHdl: 0.0306769,
        ageSbpHi: -0.0946348,
        ageDm: -0.27057,
        ageSmoke: -0.078715,
        ageEgfrLo: -0.1637806,
      },
      30: {
        constant: -1.318827,
        age: 0.5503079,
        age2: -0.0928369,
        nonHDL: 0.0409794,
        hdl: -0.1663306,
        sbpLo: -0.1628654,
        sbpHi: 0.3299505,
        dm: 0.6793894,
        smoke: 0.3196112,
        egfrLo: 0.1857101,
        egfrHi: 0.0553528,
        bpmed: 0.2894,
        statin: -0.075688,
        statinNonHdl: 0.1071019,
        bpmedSbpHi: -0.056367,
        ageNonHdl: -0.0751438,
        ageHdl: 0.0301786,
        ageSbpHi: -0.0998776,
        ageDm: -0.3206166,
        ageSmoke: -0.1607862,
        ageEgfrLo: -0.1450788,
      },
    },
    male: {
      10: {
        constant: -3.031168,
        age: 0.7688528,
        nonHDL: 0.0736174,
        hdl: -0.0954431,
        sbpLo: -0.4347345,
        sbpHi: 0.3362658,
        dm: 0.7692857,
        smoke: 0.4386871,
        egfrLo: 0.5378979,
        egfrHi: 0.0164827,
        bpmed: 0.288879,
        statin: -0.1337349,
        statinNonHdl: 0.150273,
        bpmedSbpHi: -0.0475924,
        ageNonHdl: -0.0517874,
        ageHdl: 0.0191169,
        ageSbpHi: -0.1049477,
        ageDm: -0.2251948,
        ageSmoke: -0.0895067,
        ageEgfrLo: -0.1543702,
      },
      30: {
        constant: -1.148204,
        age: 0.4627309,
        age2: -0.0984281,
        nonHDL: 0.0836088,
        hdl: -0.1029824,
        sbpLo: -0.2140352,
        sbpHi: 0.2904325,
        dm: 0.5331276,
        smoke: 0.2141914,
        egfrLo: 0.1155556,
        egfrHi: 0.0603775,
        bpmed: 0.232714,
        statin: -0.0272112,
        statinNonHdl: 0.134192,
        bpmedSbpHi: -0.0384488,
        ageNonHdl: -0.0511759,
        ageHdl: 0.0165865,
        ageSbpHi: -0.1101437,
        ageDm: -0.2585943,
        ageSmoke: -0.1566406,
        ageEgfrLo: -0.1166776,
      },
    },
  },
  ascvd: {
    female: {
      10: {
        constant: -3.819975,
        age: 0.719883,
        nonHDL: 0.1176967,
        hdl: -0.151185,
        sbpLo: -0.0835358,
        sbpHi: 0.3592852,
        dm: 0.8348585,
        smoke: 0.4831078,
        egfrLo: 0.4864619,
        egfrHi: 0.0397779,
        bpmed: 0.2265309,
        statin: -0.0592374,
        statinNonHdl: 0.0844423,
        bpmedSbpHi: -0.0395762,
        ageNonHdl: -0.0567839,
        ageHdl: 0.0325692,
        ageSbpHi: -0.1035985,
        ageDm: -0.2417542,
        ageSmoke: -0.0791142,
        ageEgfrLo: -0.1671492,
      },
      30: {
        constant: -1.974074,
        age: 0.4669202,
        age2: -0.0893118,
        nonHDL: 0.1256901,
        hdl: -0.1542255,
        sbpLo: -0.0018093,
        sbpHi: 0.322949,
        dm: 0.6296707,
        smoke: 0.268292,
        egfrLo: 0.100106,
        egfrHi: 0.0499663,
        bpmed: 0.1875292,
        statin: 0.0152476,
        statinNonHdl: 0.0736147,
        bpmedSbpHi: -0.0276123,
        ageNonHdl: -0.0521962,
        ageHdl: 0.0316918,
        ageSbpHi: -0.1046101,
        ageDm: -0.2727793,
        ageSmoke: -0.1530907,
        ageEgfrLo: -0.1299149,
      },
    },
    male: {
      10: {
        constant: -3.500655,
        age: 0.7099847,
        nonHDL: 0.1658663,
        hdl: -0.1144285,
        sbpLo: -0.2837212,
        sbpHi: 0.3239977,
        dm: 0.7189597,
        smoke: 0.3956973,
        egfrLo: 0.3690075,
        egfrHi: 0.0203619,
        bpmed: 0.2036522,
        statin: -0.0865581,
        statinNonHdl: 0.114563,
        bpmedSbpHi: -0.0322916,
        ageNonHdl: -0.0300005,
        ageHdl: 0.0232747,
        ageSbpHi: -0.0927024,
        ageDm: -0.2018525,
        ageSmoke: -0.0970527,
        ageEgfrLo: -0.1217081,
      },
      30: {
        constant: -1.736444,
        age: 0.3994099,
        age2: -0.0937484,
        nonHDL: 0.1744643,
        hdl: -0.120203,
        sbpLo: -0.0665117,
        sbpHi: 0.2753037,
        dm: 0.4790257,
        smoke: 0.1782635,
        egfrLo: -0.0218789,
        egfrHi: 0.0602553,
        bpmed: 0.1421182,
        statin: 0.0135996,
        statinNonHdl: 0.1013148,
        bpmedSbpHi: -0.0218265,
        ageNonHdl: -0.0312619,
        ageHdl: 0.020673,
        ageSbpHi: -0.0920935,
        ageDm: -0.2159947,
        ageSmoke: -0.1548811,
        ageEgfrLo: -0.0712547,
      },
    },
  },
  hf: {
    female: {
      10: {
        constant: -4.310409,
        age: 0.8998235,
        sbpLo: -0.4559771,
        sbpHi: 0.3576505,
        dm: 1.038346,
        smoke: 0.583916,
        egfrLo: 0.7451638,
        egfrHi: 0.0557087,
        bpmed: 0.3534442,
        bmiLo: -0.0072294,
        bmiHi: 0.2997706,
        bpmedSbpHi: -0.0981511,
        ageSbpHi: -0.0946663,
        ageDm: -0.3581041,
        ageSmoke: -0.1159453,
        ageEgfrLo: -0.1884289,
        ageBmiHi: -0.003878,
      },
      30: {
        constant: -2.205379,
        age: 0.6254374,
        age2: -0.0983038,
        sbpLo: -0.3919241,
        sbpHi: 0.3142295,
        dm: 0.8330787,
        smoke: 0.3438651,
        egfrLo: 0.2981642,
        egfrHi: 0.0667159,
        bpmed: 0.333921,
        bmiLo: 0.0594874,
        bmiHi: 0.2525536,
        bpmedSbpHi: -0.0893177,
        ageSbpHi: -0.0974299,
        ageDm: -0.404855,
        ageSmoke: -0.1982991,
        ageEgfrLo: -0.1564215,
        ageBmiHi: -0.0035619,
      },
    },
    male: {
      10: {
        constant: -3.946391,
        age: 0.8972642,
        sbpLo: -0.6811466,
        sbpHi: 0.3634461,
        dm: 0.923776,
        smoke: 0.5023736,
        egfrLo: 0.6926917,
        egfrHi: 0.0251827,
        bpmed: 0.2980922,
        bmiLo: -0.0485841,
        bmiHi: 0.3726929,
        bpmedSbpHi: -0.0497731,
        ageSbpHi: -0.1289201,
        ageDm: -0.3040924,
        ageSmoke: -0.1401688,
        ageEgfrLo: -0.1797778,
        ageBmiHi: 0.0068126,
      },
      30: {
        constant: -1.95751,
        age: 0.5681541,
        age2: -0.1048388,
        sbpLo: -0.4761564,
        sbpHi: 0.30324,
        dm: 0.6840338,
        smoke: 0.2656273,
        egfrLo: 0.2541805,
        egfrHi: 0.0638923,
        bpmed: 0.2583631,
        bmiLo: 0.0833107,
        bmiHi: 0.26999,
        bpmedSbpHi: -0.0391938,
        ageSbpHi: -0.1269124,
        ageDm: -0.3273572,
        ageSmoke: -0.2043019,
        ageEgfrLo: -0.1342618,
        ageBmiHi: -0.0182831,
      },
    },
  },
};

function terms(input) {
  const ageC = (input.age - 55) / 10;
  const nonHDL = (input.tc - input.hdl) * MGDL_TO_MMOL - 3.5;
  const hdlC = (input.hdl * MGDL_TO_MMOL - 1.3) / 0.3;
  const sbpLo = (Math.min(input.sbp, 110) - 110) / 20;
  const sbpHi = (Math.max(input.sbp, 110) - 130) / 20;
  const egfrLo = (Math.min(input.egfr, 60) - 60) / -15;
  const egfrHi = (Math.max(input.egfr, 60) - 90) / -15;
  const bmiLo = (Math.min(input.bmi, 30) - 25) / 5;
  const bmiHi = (Math.max(input.bmi, 30) - 30) / 5;
  const dm = input.diabetes ? 1 : 0;
  const smoke = input.smoking ? 1 : 0;
  const bpmed = input.bpmed ? 1 : 0;
  const statin = input.statin ? 1 : 0;
  return {
    ageC,
    age2: ageC * ageC,
    nonHDL,
    hdlC,
    sbpLo,
    sbpHi,
    egfrLo,
    egfrHi,
    bmiLo,
    bmiHi,
    dm,
    smoke,
    bpmed,
    statin,
  };
}

function linearPredictor(beta, t) {
  const n = (key) => beta[key] ?? 0;
  return (
    n("constant") +
    n("age") * t.ageC +
    n("age2") * t.age2 +
    n("nonHDL") * t.nonHDL +
    n("hdl") * t.hdlC +
    n("sbpLo") * t.sbpLo +
    n("sbpHi") * t.sbpHi +
    n("dm") * t.dm +
    n("smoke") * t.smoke +
    n("egfrLo") * t.egfrLo +
    n("egfrHi") * t.egfrHi +
    n("bpmed") * t.bpmed +
    n("statin") * t.statin +
    n("bmiLo") * t.bmiLo +
    n("bmiHi") * t.bmiHi +
    n("statinNonHdl") * (t.statin * t.nonHDL) +
    n("bpmedSbpHi") * (t.bpmed * t.sbpHi) +
    n("ageNonHdl") * (t.ageC * t.nonHDL) +
    n("ageHdl") * (t.ageC * t.hdlC) +
    n("ageSbpHi") * (t.ageC * t.sbpHi) +
    n("ageDm") * (t.ageC * t.dm) +
    n("ageSmoke") * (t.ageC * t.smoke) +
    n("ageEgfrLo") * (t.ageC * t.egfrLo) +
    n("ageBmiHi") * (t.ageC * t.bmiHi)
  );
}

function logistic(x) {
  const e = Math.exp(x);
  return e / (1 + e);
}

export function preventRisk(input) {
  const age = parseNum(input.age);
  const tc = parseNum(input.tc);
  const hdl = parseNum(input.hdl);
  const sbp = parseNum(input.sbp);
  const egfr = parseNum(input.egfr);
  const bmi = parseNum(input.bmi);
  const sex = input.sex === "male" ? "male" : input.sex === "female" ? "female" : null;
  if (age == null || sbp == null || egfr == null || !sex) return null;

  const core = {
    age,
    sbp,
    egfr,
    diabetes: Boolean(input.diabetes),
    smoking: Boolean(input.smoking),
    bpmed: Boolean(input.bpmed),
    statin: Boolean(input.statin),
    tc,
    hdl,
    bmi,
  };
  const t = terms(core);
  const out = {};
  for (const outcome of ["cvd", "ascvd", "hf"]) {
    out[outcome] = {};
    for (const years of [10, 30]) {
      if (years === 30 && (age < 30 || age > 59)) {
        out[outcome][years] = null;
        continue;
      }
      if (outcome === "hf" && bmi == null) {
        out[outcome][years] = null;
        continue;
      }
      if (outcome !== "hf" && (tc == null || hdl == null)) {
        out[outcome][years] = null;
        continue;
      }
      const beta = models[outcome][sex][years];
      out[outcome][years] = logistic(linearPredictor(beta, t));
    }
  }
  return out;
}
