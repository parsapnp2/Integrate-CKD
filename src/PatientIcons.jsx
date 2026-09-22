/**
 * Pictogram set for the Patients tab.
 * Stroke-based, 24x24, currentColor, so one icon works at any size or colour.
 */

const paths = {
  kidney: "M14.5 2.6c4 0 5.7 4 5.3 9.4-.5 5.4-2.7 10.3-7.2 10.8-4.5.5-7.3-3.6-6.4-9 .4-2.7 2.2-3.6 2.2-5.8 0-3.1 2.3-5.4 6.1-5.4ZM10.9 9.5c2.6 1.5 3.9 4.2 3.9 6.6 0 2.1-1 3.9-2.8 5",
  heart: "M12 20.5S3.8 15.2 3.8 9.9C3.8 6.5 6.7 4.4 9.6 5.3c1.2.4 2.4 2.3 2.4 2.3s1.2-1.9 2.4-2.3c2.9-.9 5.8 1.2 5.8 4.6 0 5.3-8.2 10.6-8.2 10.6Z",
  droplet: "M12 2.8c3.4 4.2 5.6 7.1 5.6 9.8a5.6 5.6 0 1 1-11.2 0c0-2.7 2.2-5.6 5.6-9.8Z",
  pill: "M8.4 15.6 15.6 8.4M6.3 17.7a5 5 0 0 1 0-7.1l4.3-4.3a5 5 0 1 1 7.1 7.1l-4.3 4.3a5 5 0 0 1-7.1 0Z",
  syringe: "M14 3.5 20.5 10M18 6 8.5 15.5 6 21l5.5-2.5L21 9M12 8l4 4M9.5 10.5l4 4",
  stethoscope: "M6 3.5v5a4 4 0 0 0 8 0v-5M4.5 3.5h3M12.5 3.5h3M10 13v1.5a5 5 0 0 0 10 0v-1m-2.5-2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
  shield: "M12 2.8 20 6v5.5c0 4.7-3.3 8.2-8 9.7-4.7-1.5-8-5-8-9.7V6l8-3.2Zm-3.3 9.6 2.3 2.3 4.4-4.4",
  alert: "M12 3.6 22 20.4H2L12 3.6Zm0 5.4v5m0 3h.01",
  check: "m4.5 12.8 5 5 10-11",
  question: "M9.2 9.2a2.9 2.9 0 1 1 3.9 2.7c-.7.3-1.1 1-1.1 1.8v.6m0 3h.01M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4Z",
  calendar: "M7 2.8v3m10-3v3M3.5 8.5h17M5.5 5.3h13a2 2 0 0 1 2 2v11.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.3a2 2 0 0 1 2-2Z",
  scale: "M12 4.5v15m-6-15h12M6 4.5 3 12h6L6 4.5Zm12 0L15 12h6l-3-7.5ZM8 20.5h8",
  stomach: "M9 3.5v4.8c0 3.5 2.6 3.4 5 4.2 2.1.7 3.6 2.2 3.6 4.4a4 4 0 0 1-8 0M9 3.5H6.6M9 3.5h2.4",
  dizzy: "M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4Zm-3.6 6 2.4 2.4m0-2.4-2.4 2.4m7.2-2.4 2.4 2.4m0-2.4-2.4 2.4M8.5 16.5c1.4-1.3 5.6-1.3 7 0",
  cough: "M12 2.8a9.2 9.2 0 0 0-2.8 17.9M14 6.5c1.6.8 2.6 2.3 2.6 4M15.5 12.8c1.8.9 3 2.5 3 4.4M17 19.6c2 .4 3.4 1 4 1.6",
  fungus: "M12 3.2c3.6 0 6.5 2.4 6.5 5.4 0 1.1-.9 1.9-2 1.9h-9c-1.1 0-2-.8-2-1.9 0-3 2.9-5.4 6.5-5.4Zm-1.8 7.3v7.2a1.8 1.8 0 0 0 3.6 0v-7.2",
  thermometer: "M14.5 14.6V5.3a2.5 2.5 0 0 0-5 0v9.3a4.5 4.5 0 1 0 5 0Zm-2.5 1.1a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  glass: "M6.5 3.5h11l-1.3 16a1.5 1.5 0 0 1-1.5 1.4h-5.4a1.5 1.5 0 0 1-1.5-1.4L6.5 3.5Zm.6 7.4h9.8",
  filter: "M3.5 4.5h17l-6.6 7.8v6.4L10.1 21v-8.7L3.5 4.5Z",
  sugar: "M7 4.5h10l1.5 4.5-6.5 4-6.5-4L7 4.5Zm5 8.5v7.5m-4-3.5 4 3.5 4-3.5",
  artery: "M4 6.5c4 0 4 5 8 5s4-5 8-5M4 17.5c4 0 4-5 8-5",
  clipboard: "M9 4.5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2m-6 0V3.2h6v1.3m-6 0h6M8.5 11h7m-7 4h4",
  plus: "M12 5.5v13m-6.5-6.5h13",
  minus: "M5.5 12h13",
  chevron: "m6.5 9.5 5.5 5.5 5.5-5.5",
  printer: "M7 8.5V3.5h10v5M7 18.5H5.5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H17M7 14.5h10v6H7v-6Z",
  person: "M12 3.2a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Zm-6.5 17.6v-1.9a5.5 5.5 0 0 1 5.5-5.5h2a5.5 5.5 0 0 1 5.5 5.5v1.9",
  bolt: "M13.5 2.8 5 13.5h6l-.5 7.7L19 10.5h-6l.5-7.7Z",
  leaf: "M4.5 19.5c0-8 4.5-14 15-14.5.5 9.5-4.5 15-11 15-1.5 0-2.5-.2-4-.5Zm3-2.5c2-4 5-6.5 8.5-8",
  sun: "M12 5.5v-2m0 17v-2m6.5-6.5h2m-17 0h2m11.1-4.6 1.4-1.4M6 18l1.4-1.4m9.2 0L18 18M6 6l1.4 1.4M12 7.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Z",
  clock: "M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4Zm0 4.4V12l3.5 2.2",
  trend: "M3.5 17.5 9 11l4 3.5 7.5-8M20.5 6.5h-5m5 0v5",
  people: "M9 3.6a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Zm-5.5 16.8v-1.6A4.9 4.9 0 0 1 8.4 14h1.2a4.9 4.9 0 0 1 4.9 4.8v1.6M16.5 5a3.2 3.2 0 0 1 0 6m2 3.2a4.9 4.9 0 0 1 2 4v1.6",
  block: "M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4Zm-6 3.2 12 12",
  pause: "M9.5 5.5v13m5-13v13",
  arrow: "M4.5 12h15m-6-6.5 6.5 6.5-6.5 6.5",
  target: "M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4Zm0 4.6a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 3.6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  trash: "M4.5 6.5h15m-9.5 4v6m4-6v6M6.5 6.5 7.5 20a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-13.5M9 6.5V4a1.5 1.5 0 0 1 1.5-1.4h3A1.5 1.5 0 0 1 15 4v2.5",
};

/** K is a letter, not a shape, so potassium is drawn as a badge. */
function Potassium({ size, className }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <text x="12" y="16.3" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="currentColor">
        K
      </text>
    </svg>
  );
}

export default function Icon({ name, size = 22, className = "", strokeWidth = 1.7 }) {
  if (name === "potassium") return <Potassium size={size} className={className} />;
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const iconNames = Object.keys(paths).concat("potassium");
