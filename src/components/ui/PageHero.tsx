import type { ReactNode } from "react";

type PageHeroProps = {
  title: string;
  subtitle?: string;
  /** Primary and secondary action buttons, rendered at the end of the header. */
  actions?: ReactNode;
};

/** Page header used by every space; mirrors the Materials Library hero. */
export function PageHero({ title, subtitle, actions }: PageHeroProps) {
  return (
    <div className="ui-hero">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="ui-hero-actions">{actions}</div>}
    </div>
  );
}
