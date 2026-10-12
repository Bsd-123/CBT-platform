import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

const SPACE_LINKS = [
  { href: "/materials", icon: "library_books", label: "ספריית חומרים" },
  { href: "/forum", icon: "forum", label: "פורום שאלות ותשובות" },
  { href: "/recommendations", icon: "recommend", label: "המלצות" },
  { href: "/events", icon: "event", label: "אירועים וסדנאות" },
  { href: "/professional-requests", icon: "contact_support", label: "פניות מקצועיות" },
] as const;

const SHARE_LINKS = [
  { href: "/materials/upload", icon: "upload", label: "העלאת חומר" },
  { href: "/materials/request", icon: "help", label: "בקשת חומר" },
  { href: "/recommendations/new", icon: "add_comment", label: "המלצה חדשה" },
  { href: "/profile", icon: "person", label: "הפרופיל שלי" },
] as const;

/** Site-wide footer: brand, the five spaces, quick contribution links. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="site-footer-logo" aria-label="CBTeam – לדף הבית">
            <Image src="/brand/logo-mark.png" alt="" width={52} height={48} />
            <span className="brand-word" dir="ltr" aria-hidden="true">
              <span className="brand-c">C</span>
              <span className="brand-b">B</span>
              <span className="brand-team">Team</span>
            </span>
          </Link>
          <p>
            קהילה מקצועית למטפלי CBT: חומרים קליניים, התייעצות עם עמיתים, המלצות ואירועים, במקום
            אחד.
          </p>
        </div>

        <nav className="site-footer-col" aria-labelledby="footer-spaces">
          <h2 id="footer-spaces">מרחבים</h2>
          <ul>
            {SPACE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <MaterialIcon name={link.icon} />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer-col" aria-labelledby="footer-share">
          <h2 id="footer-share">שיתוף ותרומה</h2>
          <ul>
            {SHARE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <MaterialIcon name={link.icon} />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-footer-bottom">
        <div className="site-footer-bottom-inner">
          <span>© {year} CBTeam · קהילת מטפלי CBT</span>
          <span className="site-footer-dots" aria-hidden="true">
            <i className="dot-gold" />
            <i className="dot-peach" />
            <i className="dot-coral" />
          </span>
        </div>
      </div>
    </footer>
  );
}
