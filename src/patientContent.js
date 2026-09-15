/**
 * Plain-language copy for the Patients tab.
 * Kept separate from the components so a clinician can review and edit the
 * wording without reading JSX. Target reading level is roughly grade 8.
 * Nothing here tells a patient to start, stop or change a medicine.
 */

export const kidneyBasics = [
  {
    title: "What your kidneys do",
    body: "Your two kidneys clean your blood. They take out waste and extra water and turn it into urine. They also keep salts like potassium in balance, help control your blood pressure, and help your body make red blood cells.",
  },
  {
    title: "What chronic kidney disease means",
    body: "Chronic kidney disease, or CKD, means your kidneys have been working below normal for at least three months. The two most common causes are diabetes and high blood pressure. CKD usually changes slowly over years, and treatment is aimed at slowing it down.",
  },
  {
    title: "The two numbers that describe it",
    body: "eGFR is an estimate of how much blood your kidneys filter each minute. Higher is better. ACR measures how much of a protein called albumin is leaking into your urine. Lower is better. Together they tell your team how your kidneys are doing and how closely to watch them.",
  },
];

/** KDIGO G categories. */
export const egfrStages = [
  { id: "G1", label: "G1", range: "90 and above", plain: "Normal filtering", min: 90, max: Infinity },
  { id: "G2", label: "G2", range: "60 to 89", plain: "Slightly reduced", min: 60, max: 89.999 },
  { id: "G3a", label: "G3a", range: "45 to 59", plain: "Mildly to moderately reduced", min: 45, max: 59.999 },
  { id: "G3b", label: "G3b", range: "30 to 44", plain: "Moderately to severely reduced", min: 30, max: 44.999 },
  { id: "G4", label: "G4", range: "15 to 29", plain: "Severely reduced", min: 15, max: 29.999 },
  { id: "G5", label: "G5", range: "Under 15", plain: "Kidney failure range", min: 0, max: 14.999 },
];

/** KDIGO A categories. Thresholds in mg/g; 3 mg/mmol is about 30 mg/g. */
export const acrStages = [
  { id: "A1", label: "A1", range: "Under 3 mg/mmol (30 mg/g)", plain: "Normal to mildly raised", min: 0, max: 29.999 },
  { id: "A2", label: "A2", range: "3 to 30 mg/mmol (30 to 300 mg/g)", plain: "Moderately raised", min: 30, max: 300 },
  { id: "A3", label: "A3", range: "Over 30 mg/mmol (300 mg/g)", plain: "Severely raised", min: 300.001, max: Infinity },
];

export function egfrStageFor(egfr) {
  if (egfr == null || !Number.isFinite(egfr)) return null;
  return egfrStages.find((stage) => egfr >= stage.min && egfr <= stage.max) ?? null;
}

export function acrStageFor(uacrMgG) {
  if (uacrMgG == null || !Number.isFinite(uacrMgG)) return null;
  return acrStages.find((stage) => uacrMgG >= stage.min && uacrMgG <= stage.max) ?? null;
}

/** Lay wording for each outcome the risk models estimate. */
export const outcomeCopy = {
  ckd: {
    title: "Kidney failure",
    plain: "Kidneys working so little that dialysis or a kidney transplant would be needed.",
    horizonNote: "Over the next few years.",
  },
  hhf: {
    title: "Heart failure",
    plain: "The heart struggling to pump well enough, which usually means a hospital stay.",
    horizonNote: "Over the next 10 years.",
  },
  mace: {
    title: "Heart attack or stroke",
    plain: "A major heart or blood vessel event, such as a heart attack or a stroke.",
    horizonNote: "Over the next 10 years.",
  },
  cvdeath: {
    title: "Dying from heart or blood vessel disease",
    plain: "This is the hardest number on the page. It is here because lowering it is the point of treatment.",
    horizonNote: "Over the next 10 years.",
  },
};

/**
 * Side effect frequency is given as a three step scale rather than exact numbers,
 * because the numbers differ between agents within a class and between sources.
 * The product leaflet and the pharmacist remain the reference for exact rates.
 */
export const frequencyScale = [
  { id: "common", dots: 3, label: "Common" },
  { id: "less", dots: 2, label: "Less common" },
  { id: "rare", dots: 1, label: "Uncommon but worth knowing" },
];

export const medicines = [
  {
    id: "rasi",
    key: null,
    name: "ACE inhibitor or ARB",
    short: "The foundation",
    alsoCalled: "Sometimes called RASi. Names often end in pril or sartan, like ramipril or losartan.",
    icon: "pill",
    color: "#7b6a55",
    always: true,
    does: "Lowers your blood pressure and takes pressure off the tiny filters in your kidneys, so less protein leaks into your urine.",
    expect: "Usually started at a low dose and increased slowly. Your team checks your kidney function and your potassium with a blood test after each change.",
    steps: [
      { icon: "artery", text: "Relaxes your blood vessels" },
      { icon: "filter", text: "Less pressure inside the kidney filters" },
      { icon: "droplet", text: "Less protein leaks into your urine" },
    ],
    sideEffects: [
      { icon: "cough", label: "Dry cough", freq: "common", note: "More likely with the pril medicines. Your team can usually swap you to a sartan instead." },
      { icon: "dizzy", label: "Lightheaded when you stand", freq: "common", note: "Stand up slowly. Worth mentioning if it keeps happening." },
      { icon: "potassium", label: "Potassium creeping up", freq: "less", note: "Found on a blood test, not by how you feel. That is what the tests are for." },
    ],
  },
  {
    id: "sglt2i",
    key: "onSglt",
    name: "SGLT2 inhibitor",
    short: "Protects kidney and heart",
    alsoCalled: "Names end in gliflozin, like empagliflozin, dapagliflozin or canagliflozin.",
    icon: "droplet",
    color: "#0f8f80",
    does: "Makes your kidneys pass extra sugar and salt out in your urine. That lowers the pressure inside the kidney filters, slows kidney disease and protects the heart. It helps even if you do not have diabetes.",
    expect: "Your eGFR often dips a little in the first weeks and then steadies. That dip is expected and is a sign the medicine is working, not a sign of harm.",
    steps: [
      { icon: "sugar", text: "Extra sugar and salt leave in your urine" },
      { icon: "filter", text: "Pressure in the filters drops" },
      { icon: "shield", text: "Kidney and heart are protected" },
    ],
    sideEffects: [
      { icon: "fungus", label: "Genital thrush", freq: "common", note: "Keep the area clean and dry. It is easily treated, so tell your team or pharmacist rather than stopping." },
      { icon: "droplet", label: "Passing more urine", freq: "common", note: "Usually settles after the first weeks. Keep drinking normally." },
      { icon: "dizzy", label: "Lightheaded or dry mouth", freq: "less", note: "More likely if you also take a water tablet. Mention it at your next visit." },
      { icon: "alert", label: "Ketoacidosis", freq: "rare", note: "Uncommon but serious. Feeling sick, vomiting, tummy pain or fast breathing needs urgent care, even if your sugar reading is normal." },
    ],
  },
  {
    id: "nsmra",
    key: "onFinerenone",
    name: "Finerenone",
    short: "Calms kidney scarring",
    alsoCalled: "A non steroidal MRA. Brand name Kerendia.",
    icon: "leaf",
    color: "#c2831a",
    does: "Blocks a hormone signal that drives inflammation and scarring in the kidneys and the heart. It lowers the protein in your urine and protects both organs.",
    expect: "Your potassium is checked before you start and again about two to four weeks later, because this medicine can raise it. The dose depends on your eGFR.",
    steps: [
      { icon: "bolt", text: "Blocks the scarring signal" },
      { icon: "leaf", text: "Less inflammation in kidney and heart" },
      { icon: "droplet", text: "Less protein in your urine" },
    ],
    sideEffects: [
      { icon: "potassium", label: "Potassium rising", freq: "common", note: "The reason for the blood test two to four weeks after starting or after any dose change. It usually causes no symptoms at all." },
      { icon: "dizzy", label: "Blood pressure dipping", freq: "less", note: "Feeling faint or dizzy is worth reporting rather than living with." },
    ],
  },
  {
    id: "glp1",
    key: "onGlp",
    name: "GLP-1 medicine",
    short: "Sugar, weight and vessels",
    alsoCalled: "Names end in tide, like semaglutide or dulaglutide. Usually a weekly injection.",
    icon: "syringe",
    color: "#6355d8",
    does: "Helps control blood sugar, reduces appetite and supports weight loss, and lowers the risk of heart and kidney problems.",
    expect: "The dose is increased in steps over a few months. Nausea is common early on and usually settles. Smaller meals help.",
    steps: [
      { icon: "stomach", text: "Appetite and blood sugar settle" },
      { icon: "scale", text: "Weight and sugar control improve" },
      { icon: "heart", text: "Heart and kidney risk falls" },
    ],
    sideEffects: [
      { icon: "stomach", label: "Nausea", freq: "common", note: "Worst in the first weeks and after each dose increase. Smaller meals and less fatty food help." },
      { icon: "glass", label: "Vomiting or diarrhoea", freq: "common", note: "Keep drinking. If it lasts more than a day, call your team, because some other medicines may need pausing." },
      { icon: "alert", label: "Gallstones or pancreas trouble", freq: "rare", note: "Severe tummy pain that goes through to your back needs urgent care." },
    ],
  },
];

export const medicinesTogether =
  "These medicines work in different ways, so they are used together rather than instead of each other. Your team adds them one at a time and checks your blood in between, which is why starting all of them can take several months.";

export const questionsToAsk = [
  "What are my eGFR and ACR today, and how have they changed since last time?",
  "Am I on all of the kidney protective medicines that are right for me, or is there one still to add?",
  "What should I do about my medicines on days when I am unwell, vomiting or not drinking?",
  "Which blood tests do I need next, and when?",
  "What blood pressure number should I be aiming for at home?",
  "Are there any over the counter medicines I should avoid, such as anti inflammatories like ibuprofen?",
  "Should I be seen by a kidney specialist, and how often?",
];

export const disclaimer =
  "These numbers are estimates from research studies of large groups of people. They are not a diagnosis and not a prediction of what will happen to you. Your own situation depends on much more than the few numbers on this page. Do not start, stop or change any medicine because of what you read here. Bring it to your kidney team instead.";

export const treatedCaveat =
  "The with medicines figure is a calculation, not a measurement. It applies the average benefit seen in clinical trials to your starting risk. It gives a sense of the size of the benefit, not a promise for one person.";

/** Plain wording for what the kidney actually does, used in the flow diagram. */
export const filterFlow = [
  { icon: "heart", title: "Blood arrives", text: "About a bathtub of blood passes through your kidneys every day." },
  { icon: "filter", title: "Filters clean it", text: "A million tiny filters take out waste and extra water." },
  { icon: "droplet", title: "Urine leaves", text: "The waste and water leave as urine." },
  { icon: "shield", title: "The rest is kept", text: "Salts, protein and water your body needs stay in your blood." },
];

/** What the two key numbers mean, as a pair of picture cards. */
export const numberMeanings = [
  {
    id: "egfr",
    icon: "filter",
    title: "eGFR",
    sub: "How much your filters clean",
    plain: "Think of it as the speed of the filters. Higher is better. It falls slowly with age in everyone.",
  },
  {
    id: "acr",
    icon: "droplet",
    title: "Urine ACR",
    sub: "How much is leaking out",
    plain: "Healthy filters keep protein in the blood. A higher ACR means more is escaping, which is an early warning sign.",
  },
];

/** Sick day guidance, phrased as a prompt to ask rather than as instruction. */
export const sickDayCard = {
  icon: "thermometer",
  title: "Days when you are unwell",
  text: "If you cannot keep fluids down, or you have bad vomiting or diarrhoea, some of these medicines are usually paused for a day or two and then restarted. This is called a sick day plan. Ask your team to write yours down before you need it.",
};
