import { useId } from "react";
import { rangeError, rangeText } from "./inputRanges.js";

/** The accepted range appears as the placeholder; units and errors remain below. */
export default function RangeInput({ range, className = "", style, ...props }) {
  const id = useId();
  const error = rangeError(props.value, range);
  return (
    <>
      <input
        {...props}
        type="number"
        step="any"
        min={range.min}
        max={range.max}
        placeholder={rangeText(range)}
        aria-label={range.label}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-unit${error ? ` ${id}-error` : ""}`}
        className={`${className} placeholder:text-slate-400 placeholder:opacity-100`}
        style={style}
      />
      <span id={`${id}-unit`} className="block text-[10px] leading-tight text-slate-500">
        {range.unit}
      </span>
      {error ? <span id={`${id}-error`} role="alert" className="block text-[11px] font-semibold leading-tight text-red-700">{error}</span> : null}
    </>
  );
}
