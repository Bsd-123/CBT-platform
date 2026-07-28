import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

const SPACES = [
  {
    href: "/materials",
    icon: "library_books",
    iconVariant: "primary" as const,
    title: "ספריית חומרים",
    description: "פרוטוקולים, דפי עבודה ומדריכים קליניים מסודרים.",
  },
  {
    href: "/forum",
    icon: "forum",
    iconVariant: "secondary" as const,
    title: "פורום שאלות ותשובות",
    description: "התייעצות עם עמיתים על מקרים ודילמות מקצועיות.",
  },
  {
    href: "/recommendations",
    icon: "verified",
    iconVariant: "tertiary" as const,
    title: "המלצות",
    description: "ספרים, משחקים וסדנאות מומלצים על ידי הקהילה.",
  },
  {
    href: "/events",
    icon: "event",
    iconVariant: "primary" as const,
    title: "אירועים וסדנאות",
    description: "עדכונים על סדנאות, וובינרים וכנסים מקצועיים.",
  },
  {
    href: "/professional-requests",
    icon: "contact_support",
    iconVariant: "secondary" as const,
    title: "פניות מקצועיות",
    description: "דיון פתוח בנושאים מטפליים ובקשות לשיתוף ידע.",
  },
] as const;

const TRUST_POINTS = [
  {
    title: "מאגר מבוסס ראיות",
    description: "חומרים שמסייעים לעבודה הקלינית — עם דירוגים ותגיות ברורות.",
  },
  {
    title: "קהילה מקצועית",
    description: "מרחב ייעודי למטפלי CBT לשיתוף ידע וכלים בצורה מסודרת.",
  },
  {
    title: "התייעצות עם עמיתים",
    description: "פורום ופניות מקצועיות לתמיכה מהירה בדילמות קליניות.",
  },
] as const;

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1573497019940-598c8125889b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
] as const;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <span className="home-hero-badge">רשת מקצועית ל-CBT</span>
            <h1 className="home-hero-title">
              הבית המקצועי של{" "}
              <span className="home-hero-title-accent">מטפלי CBT</span>
            </h1>
            <p className="home-hero-desc">
              שיתוף ידע, חומרים והתייעצויות מקצועיות בקהילה ייעודית לצורך מצוינות
              קלינית ואמפתיה.
            </p>
            <div className="home-hero-actions">
              <Link href="/materials" className="home-btn-primary">
                כניסה לקהילה
                <MaterialIcon name="arrow_back" />
              </Link>
              <Link href="/materials" className="home-btn-secondary">
                גלו את ספריית החומרים
              </Link>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="home-hero-glow" aria-hidden="true" />
            <div className="home-hero-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMAGE}
                alt="מטפלים משתפים ידע מקצועי"
                className="home-hero-image"
              />
              <div className="home-hero-image-overlay" aria-hidden="true" />
              <div className="home-hero-glass">
                <div className="home-hero-avatars" aria-hidden="true">
                  <span className="home-hero-avatar" />
                  <span className="home-hero-avatar" />
                  <span className="home-hero-avatar" />
                </div>
                <p className="home-hero-glass-text">קהילה פעילה של מטפלים</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section-muted">
        <div className="home-section-inner">
          <div className="home-section-header">
            <h2 className="home-section-title">מרחבים ייעודיים לעבודה המקצועית שלכם</h2>
            <p className="home-section-subtitle">
              חמישה מרחבים מרכזיים שמארגנים את הידע, הדיון והכלים היומיומיים שלכם.
            </p>
          </div>

          <div className="home-spaces-grid">
            {SPACES.map((space) => (
              <Link key={space.href} href={space.href} className="home-space-card">
                <div className={`home-space-icon ${space.iconVariant}`}>
                  <MaterialIcon name={space.icon} />
                </div>
                <h3 className="home-space-title">{space.title}</h3>
                <p className="home-space-desc">{space.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-inner home-trust">
          <div className="home-trust-copy">
            <h2 className="home-section-title">דיוק קליני, חוכמה משותפת</h2>
            <div className="home-trust-list">
              {TRUST_POINTS.map((point) => (
                <div key={point.title} className="home-trust-item">
                  <MaterialIcon name="check_circle" />
                  <div>
                    <h4 className="home-trust-item-title">{point.title}</h4>
                    <p className="home-trust-item-desc">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="home-trust-gallery">
            {GALLERY_IMAGES.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div>
            <span className="home-footer-brand">קהילת מטפלי CBT</span>
            <span className="home-footer-meta"> · פלטפורמה מקצועית לשיתוף ידע</span>
          </div>
        </div>
      </footer>

      <Link href="/materials/upload" className="home-fab" aria-label="העלאת חומר">
        <MaterialIcon name="add" />
      </Link>
    </div>
  );
}
