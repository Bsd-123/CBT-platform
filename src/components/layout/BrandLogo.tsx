import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  /** "inline" sits in the header; "stacked" is the larger centered version on auth pages. */
  variant?: "inline" | "stacked";
};

/** CBTeam mark + wordmark. Fixed size so the header never shifts between pages. */
export function BrandLogo({ variant = "inline" }: BrandLogoProps) {
  const markSize = variant === "stacked" ? 64 : 40;

  return (
    <Link href="/" className={`brand brand-${variant}`} aria-label="CBTeam – קהילת מטפלי CBT, לדף הבית">
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={Math.round(markSize * 1.08)}
        height={markSize}
        priority
        className="brand-mark"
      />
      <span className="brand-text" aria-hidden="true">
        <span className="brand-word" dir="ltr">
          <span className="brand-c">C</span>
          <span className="brand-b">B</span>
          <span className="brand-team">Team</span>
        </span>
        <span className="brand-tagline">קהילת מטפלי CBT</span>
      </span>
    </Link>
  );
}
