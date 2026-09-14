/**
 * Shared warm palette for the patient-facing and interactive views.
 *
 * Applied as CSS custom properties on a wrapper element, so it is scoped to the
 * views that opt in and leaves the Chart and Calculator tabs untouched.
 *
 * Checked with the data-viz palette validator against a white card surface:
 *   - the three add-on agents (#0f8f80, #c2831a, #6355d8) pass all six checks;
 *   - RASi is deliberately neutral graphite, since it is the foundation rather
 *     than one of the three pillars, and always carries its name and icon;
 *   - the four status colours are a reserved status palette, always shipped with
 *     a written label and an icon, never colour alone.
 */
export const WARM_THEME = {
  "--p-bg": "#faf6f0",
  "--p-card": "#ffffff",
  "--p-cream": "#fdfaf5",
  "--p-sand": "#f3ece1",
  "--p-line": "#e7ded1",
  "--p-ink": "#2d2a26",
  "--p-muted": "#6b645c",
  "--p-kidney": "#0f8f80",
  "--p-heart": "#d1495b",
  "--p-mace": "#4b53c9",
  "--p-death": "#b5811c",
  "--p-clay": "#c98b3f",
  "--p-sage": "#4f8a5b",
  "--p-sage-soft": "#a8cfb4",
  "--p-neutral": "#e2dbd0",
};

/** K⁺ band and directive severity. Status palette: always with a label and icon. */
export const BAND_COLOR = {
  proceed: "#4f8a5b",
  continue: "#b07c1e",
  reduce: "#c2691f",
  pause: "#b3332e",
};

/** The four agents, in sequence order. */
export const AGENT_COLOR = {
  rasi: "#5f574c",
  sglt2i: "#0f8f80",
  nsmra: "#c2831a",
  glp1: "#6355d8",
};

export const AGENT_ICON = {
  rasi: "pill",
  sglt2i: "droplet",
  nsmra: "leaf",
  glp1: "syringe",
};
