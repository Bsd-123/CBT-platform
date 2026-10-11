"use client";

import { DomainBadge } from "@/components/shared/DomainBadge";
import type { PublicTag } from "@/lib/models/tag";

type DomainSelectProps = {
  id?: string;
  /** The existing tag list; the asker picks exactly one as the question's domain. */
  domains: PublicTag[];
  value: string;
  onChange: (value: string) => void;
};

/** Required single choice, built like the material-type select in the add-materials form. */
export function DomainSelect({ id = "question-domain", domains, value, onChange }: DomainSelectProps) {
  const selected = domains.find((domain) => domain.id === value);

  return (
    <div className="form-field">
      <label htmlFor={id}>תחום (חובה)</label>
      {domains.length === 0 ? (
        <p className="muted">אין תחומים זמינים. פנו למנהל המערכת.</p>
      ) : (
        <>
          <select id={id} required value={value} onChange={(event) => onChange(event.target.value)}>
            <option value="" disabled>
              בחרו תחום...
            </option>
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
          </select>
          <div className="domain-select-preview" aria-live="polite">
            {selected ? (
              <DomainBadge domain={selected} />
            ) : (
              <span className="muted">בחרו את התחום המרכזי של השאלה.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
