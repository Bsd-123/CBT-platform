import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/lib/site";

type LegalDocumentProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/** Shared frame for the terms, privacy, accessibility and contact pages. */
export function LegalDocument({ title, subtitle, children }: LegalDocumentProps) {
  return (
    <article className="legal-doc">
      <header className="legal-doc-header">
        <h1>{title}</h1>
        {subtitle && <p className="legal-doc-subtitle">{subtitle}</p>}
        <p className="legal-doc-meta">עודכן לאחרונה: {LEGAL_UPDATED}</p>
      </header>
      <div className="legal-doc-body">{children}</div>
    </article>
  );
}
