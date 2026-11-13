"use client";
import { useState } from "react";
import type { ActionResult } from "@/app/cms/actions";
export function MutationForm({
  action,
  children,
  className,
}: {
  action: (form: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setBusy(true);
        try {
          const r = await action(data);
          setError(!r.ok);
          setMessage(
            r.ok ? "Changes saved." : (r.error ?? "Unable to save changes."),
          );
        } catch {
          setError(true);
          setMessage("Unable to save. Check the details and try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="mutation-fields">
        {children}
      </fieldset>
      {message && (
        <div role="status" className={`notice ${error ? "error" : ""}`}>
          {message}
        </div>
      )}
    </form>
  );
}
