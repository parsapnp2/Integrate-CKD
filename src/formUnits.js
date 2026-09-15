/** Change display units without changing the entered measurement. */
export function updateFormField(form, key, value) {
  const next = { ...form, [key]: value };
  const conversions = {
    uacrUnit: { fields: ["uacr"], units: { mgmmol: 8.84, mgg: 1 } },
    cholUnit: { fields: ["tc", "hdl"], units: { mmol: 38.67, mgdl: 1 } },
  };
  const conversion = conversions[key];
  if (!conversion || value === form[key]) return next;
  const factor = conversion.units[form[key]] / conversion.units[value];
  if (!Number.isFinite(factor)) return next;
  for (const field of conversion.fields) {
    const raw = form[field];
    if (raw == null || String(raw).trim() === "") continue;
    const number = Number(raw);
    // Keep useful precision through round trips without long floating-point tails.
    next[field] = Number.isFinite(number) ? String(Number((number * factor).toPrecision(15))) : "";
  }
  return next;
}
