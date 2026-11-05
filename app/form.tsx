"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { submitAction } from "./actions";
export function Form({
  path,
  children,
  className = "",
}: {
  path: string;
  children: ReactNode;
  className?: string;
}) {
  const [state, action] = useActionState(submitAction.bind(null, path), {
    error: "",
    values: {},
  });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.error) {
      const frame = requestAnimationFrame(() => {
        for (const [name, value] of Object.entries(state.values)) {
          const input = ref.current?.elements.namedItem(name);
          if (
            input instanceof HTMLInputElement ||
            input instanceof HTMLTextAreaElement ||
            input instanceof HTMLSelectElement
          )
            input.value = value;
        }
        ref.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [state]);
  return (
    <form ref={ref} action={action} className={className}>
      {children}
      {state.error && (
        <div className="form-error" role="alert" tabIndex={-1}>
          <strong>Could not save</strong>
          <p>{state.error}</p>
          {/changed|stale|token/i.test(state.error) && (
            <p>
              Your draft is retained.{" "}
              <a href={path}>Reload the current version</a> before trying again.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
export function Submit({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Saving…" : children}
    </button>
  );
}
