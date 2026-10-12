import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import { getAuthenticatedProfile } from "@/lib/auth";
import {
  fetchEventCount,
  fetchEvents,
  fetchForumQuestionCount,
  fetchMaterialCount,
  fetchMaterials,
  fetchProfessionalRequestCount,
  fetchRecommendationCount,
  searchForum,
} from "@/lib/data";
import { formatEventDate, formatEventTimeValue, getTodayKey } from "@/lib/utils/calendar";
import { countLabel, formatDate } from "@/lib/utils/format";
import { getMaterialTypeIcon } from "@/lib/utils/material-type-ui";

/** The materials library is the featured space; the other four form a 2×2 grid beside it. */
const FEATURED_SPACE = {
  href: "/materials",
  icon: "library_books",
  title: "ספריית חומרים",
  description: "פרוטוקולים, דפי עבודה, משחקים ומדריכים קליניים, עם דירוגים ותגיות שמקלים למצוא בדיוק מה שצריך לפגישה הבאה.",
  cta: "לספריית החומרים",
};

const SPACES = [
  {
    href: "/forum",
    icon: "forum",
    tone: "success",
    title: "פורום",
    description: "התייעצות עם עמיתים על מקרים ודילמות.",
    unit: ["שאלה", "שאלות"],
  },
  {
    href: "/recommendations",
    icon: "recommend",
    tone: "warning",
    title: "המלצות",
    description: "ספרים, משחקים וסדנאות שעמיתים ממליצים עליהם.",
    unit: ["המלצה", "המלצות"],
  },
  {
    href: "/events",
    icon: "event",
    tone: "info",
    title: "אירועים וסדנאות",
    description: "וובינרים, סדנאות וכנסים מקצועיים.",
    unit: ["אירוע", "אירועים"],
  },
  {
    href: "/professional-requests",
    icon: "contact_support",
    tone: "neutral",
    title: "פניות מקצועיות",
    description: "בקשות הפניה ושיתוף ידע בין מטפלים.",
    unit: ["פנייה", "פניות"],
  },
] as const;

type FeedItem = { href: string; icon: string; title: string; meta: string };

export default async function HomePage() {
  const [auth, materials, questions, events, ...counts] = await Promise.all([
    getAuthenticatedProfile(),
    fetchMaterials({ take: 1 }),
    searchForum({ take: 1 }),
    fetchEvents({ calendar_only: true, from_date: getTodayKey(), take: 1 }),
    fetchMaterialCount(),
    fetchForumQuestionCount(),
    fetchRecommendationCount(),
    fetchEventCount(),
    fetchProfessionalRequestCount(),
  ]);
  const [materialCount, ...spaceCounts] = counts;

  const firstName = auth?.profile.full_name?.split(" ")[0];
  const material = materials[0];
  const question = questions[0];
  const event = events[0];

  const feed: FeedItem[] = [
    material && {
      href: `/materials/${material.id}`,
      icon: getMaterialTypeIcon(material.material_type?.key, material.material_type?.icon),
      title: material.title,
      meta: `חומר חדש בספרייה · ${formatDate(material.created_at)}`,
    },
    question && {
      href: `/forum/${question.id}`,
      icon: "forum",
      title: question.title,
      meta: `שאלה בפורום · ${countLabel(question.answer_count ?? 0, "תשובה", "תשובות")}`,
    },
    event?.event_date && {
      href: `/events/${event.id}`,
      icon: "event",
      title: event.title,
      meta: `אירוע קרוב · ${formatEventDate(event.event_date)}${
        event.event_time ? ` · ${formatEventTimeValue(event.event_time)}` : ""
      }`,
    },
  ].filter((item): item is FeedItem => Boolean(item));

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            {firstName && <span className="home-hero-greeting">שלום {firstName} 👋</span>}
            <h1 className="home-hero-title">
              הבית המקצועי של <span className="home-hero-title-accent">מטפלי CBT</span>
            </h1>
            <p className="home-hero-desc">
              חומרים, התייעצויות ואירועים במקום אחד, מעמיתים שעובדים באותו תחום.
            </p>
            <div className="home-hero-actions">
              <Link href="/materials" className="btn btn-primary btn-lg">
                <MaterialIcon name="library_books" />
                לספריית החומרים
              </Link>
              <Link href="/forum" className="btn btn-secondary btn-lg">
                <MaterialIcon name="forum" />
                שאלה בפורום
              </Link>
            </div>
          </div>

          <section className="home-feed" aria-labelledby="home-feed-title">
            <h2 id="home-feed-title" className="home-feed-title">
              מה חדש בקהילה
            </h2>
            {feed.length === 0 ? (
              <p className="home-feed-empty">עדיין אין פעילות. היו הראשונים לשתף!</p>
            ) : (
              <ul className="home-feed-list">
                {feed.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="home-feed-item">
                      <span className="stat-icon tone-primary">
                        <MaterialIcon name={item.icon} />
                      </span>
                      <span className="home-feed-text">
                        <strong>{item.title}</strong>
                        <small>{item.meta}</small>
                      </span>
                      <MaterialIcon name="arrow_back" className="home-feed-go" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-inner">
          <header className="home-section-header">
            <h2 className="home-section-title">המרחבים של הקהילה</h2>
            <p className="home-section-subtitle">
              חמישה מרחבים שמארגנים את הידע, הדיון והכלים היומיומיים שלכם.
            </p>
          </header>

          <div className="home-spaces">
            <Link href={FEATURED_SPACE.href} className="home-space-featured">
              <span className="stat-icon tone-primary home-space-featured-icon">
                <MaterialIcon name={FEATURED_SPACE.icon} />
              </span>
              <span className="home-space-count">{countLabel(materialCount, "חומר", "חומרים")}</span>
              <h3 className="home-space-title">{FEATURED_SPACE.title}</h3>
              <p className="home-space-desc">{FEATURED_SPACE.description}</p>
              <span className="home-space-cta">
                {FEATURED_SPACE.cta}
                <MaterialIcon name="arrow_back" />
              </span>
            </Link>

            {SPACES.map((space, index) => (
              <Link key={space.href} href={space.href} className="home-space-card">
                <span className={`stat-icon tone-${space.tone}`}>
                  <MaterialIcon name={space.icon} />
                </span>
                <div className="home-space-text">
                  <div className="home-space-head">
                    <h3 className="home-space-title">{space.title}</h3>
                    <span className="home-space-count">
                      {countLabel(spaceCounts[index], space.unit[0], space.unit[1])}
                    </span>
                  </div>
                  <p className="home-space-desc">{space.description}</p>
                </div>
                <MaterialIcon name="arrow_back" className="home-space-go" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
