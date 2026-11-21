"use client";

import { createContext, useActionState, useContext, useId } from "react";

import type { FormState } from "@/lib/forms/server";

import { Turnstile } from "./Turnstile";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

const StateContext = createContext<FormState>({ ok: false });

/**
 * Form shell: server action with useActionState, honeypot, Turnstile, status
 * message (announced to screen readers) and field errors via context.
 */
export function Form({
  action,
  submitLabel,
  children,
  className = "",
  encType,
}: {
  action: Action;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  encType?: "multipart/form-data";
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false });
  if (state.ok && state.message) {
    return (
      <div role="status" className="rounded-card bg-teal-50 p-6">
        <p className="font-heading text-h4">{state.message}</p>
      </div>
    );
  }
  return (
    <StateContext.Provider value={state}>
      <form action={formAction} className={`grid gap-4 ${className}`} encType={encType} noValidate>
        {/* Honeypot: hidden from people, filled by bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {children}
        <Turnstile />
        {state.message && !state.ok && (
          <p role="alert" className="rounded-button bg-coral-500/15 px-4 py-3 text-small text-coral-700">
            {state.message}
          </p>
        )}
        <div>
          <button
            type="submit"
            disabled={pending}
            className="eyebrow rounded-button bg-teal-700 px-6 py-3 text-white hover:bg-teal-500 disabled:opacity-60"
          >
            {pending ? "Sending…" : submitLabel}
          </button>
        </div>
      </form>
    </StateContext.Provider>
  );
}

const inputClass =
  "mt-1 w-full rounded-button border border-teal-500/40 bg-white px-4 py-3 text-body aria-[invalid=true]:border-coral-700";

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  type?: "text" | "email" | "tel" | "url" | "date" | "time" | "number";
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
  min?: number;
  max?: number;
  step?: number;
};

function useField(name: string) {
  const state = useContext(StateContext);
  const id = useId();
  return { error: state.errors?.[name], value: state.values?.[name], id };
}

function Label({ id, label, required, hint }: { id: string; label: string; required?: boolean; hint?: string }) {
  return (
    <>
      <label htmlFor={id} className="font-bold">
        {label}
        {!required && <span className="font-normal text-ink-500"> (optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-small text-ink-500">
          {hint}
        </p>
      )}
    </>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-error`} className="mt-1 text-small text-coral-700">
      {error}
    </p>
  ) : null;
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

export function Field({ name, label, required, hint, type = "text", autoComplete, placeholder, inputMode, min, max, step }: FieldProps) {
  const { error, value, id } = useField(name);
  return (
    <div>
      <Label id={id} label={label} required={required} hint={hint} />
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        className={inputClass}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function TextArea({ name, label, required, hint, rows = 5 }: Omit<FieldProps, "type"> & { rows?: number }) {
  const { error, value, id } = useField(name);
  return (
    <div>
      <Label id={id} label={label} required={required} hint={hint} />
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        defaultValue={value}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        className={inputClass}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function Select({ name, label, required, hint, options }: Omit<FieldProps, "type"> & { options: [string, string][] }) {
  const { error, value, id } = useField(name);
  return (
    <div>
      <Label id={id} label={label} required={required} hint={hint} />
      <select id={id} name={name} defaultValue={value ?? options[0]?.[0]} aria-invalid={Boolean(error)} aria-describedby={describedBy(id, hint, error)} className={inputClass}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function FileField({ name, label, hint, accept }: { name: string; label: string; hint?: string; accept: string }) {
  const { error, id } = useField(name);
  return (
    <div>
      <Label id={id} label={label} required hint={hint} />
      <input id={id} name={name} type="file" accept={accept} required aria-invalid={Boolean(error)} aria-describedby={describedBy(id, hint, error)} className={inputClass} />
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function Checkbox({ name, label }: { name: string; label: React.ReactNode }) {
  const { error, id } = useField(name);
  return (
    <div>
      <div className="flex items-start gap-3">
        <input id={id} name={name} type="checkbox" className="mt-1 size-5 accent-teal-700" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <label htmlFor={id}>{label}</label>
      </div>
      <ErrorText id={id} error={error} />
    </div>
  );
}
