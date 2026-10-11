"use client";

import { useState, type ReactNode } from "react";

type DisclosureProps = {
  label: string;
  children: ReactNode;
};

/** Collapsed-by-default region, used to keep reply forms out of the way in threads. */
export function Disclosure({ label, children }: DisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ui-disclosure">
      <button
        type="button"
        className="ui-link-btn"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? "ביטול" : label}
      </button>
      {open && <div className="ui-disclosure-body">{children}</div>}
    </div>
  );
}
