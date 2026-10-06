"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@prisma/client";
import type { PublicEvent } from "@/lib/models/event";
import type { PublicMaterial } from "@/lib/models/material";
import type { PublicRecommendation } from "@/lib/models/recommendation";
import type { PublicTag } from "@/lib/models/tag";
import type { PublicUser } from "@/lib/models/user";
import type { ProfileForumAnswer, ProfileForumQuestion } from "@/lib/repositories/profile.repository";
import { updateMyProfile } from "@/lib/actions/profile";
import { getInitials } from "@/lib/utils/expert-approval-ui";
import {
  EditEventForm,
  buildEditEventInitial,
} from "@/components/events/EditEventForm";
import { unwrap } from "@/lib/actions/result";

type ProfileTab = "materials" | "recommendations" | "forum" | "events";

type ProfilePageViewProps = {
  profile: PublicUser;
  materials: PublicMaterial[];
  recommendations: PublicRecommendation[];
  forumQuestions: ProfileForumQuestion[];
  forumAnswers: ProfileForumAnswer[];
  events: PublicEvent[];
  focusTags: PublicTag[];
};

const ROLE_LABELS: Record<UserRole, string> = {
  user: "מטפל/ת CBT",
  expert: "מומחה/ית",
  admin: "מנהל/ת מערכת",
};

const TAB_LABELS: Record<ProfileTab, string> = {
  materials: "חומרים שהעליתי",
  recommendations: "המלצות",
  forum: "פעילות בפורום",
  events: "אירועים וסדנאות",
};

const RECOMMENDATION_TYPE_LABELS: Record<string, string> = {
  book: "המלצת ספר",
  game: "המלצת משחק",
  workshop: "המלצת סדנה",
};

const MATERIAL_ICONS: Record<string, string> = {
  worksheet: "description",
  presentation: "slideshow",
  video: "videocam",
  game: "sports_esports",
  reading: "menu_book",
  treatment_plan: "psychology",
};

const FAB_LINKS: Record<ProfileTab, string> = {
  materials: "/materials/upload",
  recommendations: "/recommendations/new",
  forum: "/forum",
  events: "/events",
};

function formatJoinedDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("he-IL", {
    month: "short",
    year: "numeric",
  });
}

function formatDaysAgo(value: Date | string): string {
  const created = new Date(value);
  const diffMs = Date.now() - created.getTime();
  const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (days === 1) return "פורסם לפני יום";
  if (days < 30) return `פורסם לפני ${days} ימים`;
  return `פורסם ב-${created.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}`;
}

function getMaterialIcon(material: PublicMaterial): string {
  const key = material.material_type?.key;
  return (key && MATERIAL_ICONS[key]) || "description";
}

function getMaterialMeta(material: PublicMaterial): string {
  const extension = material.file_url.split("?")[0]?.split(".").pop()?.toUpperCase();
  const typeLabel = material.material_type?.label;

  if (extension && extension.length <= 5 && typeLabel) {
    return `${extension} • ${typeLabel}`;
  }

  return typeLabel ?? extension ?? "קובץ";
}

function getRecommendationTitle(content: string): string {
  const firstLine = content.split("\n")[0]?.trim() ?? content;
  if (firstLine.length <= 72) return firstLine;
  return `${firstLine.slice(0, 72)}…`;
}

export function ProfilePageView({
  profile,
  materials,
  recommendations,
  forumQuestions,
  forumAnswers,
  events,
  focusTags,
}: ProfilePageViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("materials");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [title, setTitle] = useState(profile.title ?? "");
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const displayTitle = profile.title || ROLE_LABELS[profile.role];

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setEditError(null);
    setEditLoading(true);

    try {
      unwrap(await updateMyProfile({ full_name: fullName, title }));
      setShowEditProfile(false);
      router.refresh();
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : "השמירה נכשלה");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <>
      <div className="profile-page">
        <aside className="profile-sidebar">
          <div className="profile-clinical-card profile-identity-card">
            <div className="profile-avatar" aria-hidden="true">
              {getInitials(profile.full_name)}
            </div>
            <h1 className="profile-identity-name">{profile.full_name}</h1>
            <p className="profile-identity-title">{displayTitle}</p>

            <div className="profile-identity-meta">
              <div className="profile-identity-meta-row">
                <span className="material-symbols-outlined" aria-hidden="true">
                  verified
                </span>
                <span>{ROLE_LABELS[profile.role]}</span>
              </div>
              <div className="profile-identity-meta-row">
                <span className="material-symbols-outlined" aria-hidden="true">
                  calendar_today
                </span>
                <span>הצטרפ/ה ב-{formatJoinedDate(profile.created_at)}</span>
              </div>
            </div>

            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => {
                setFullName(profile.full_name);
                setTitle(profile.title ?? "");
                setEditError(null);
                setShowEditProfile(true);
              }}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                edit
              </span>
              עריכת פרופיל
            </button>
          </div>

          <div className="profile-clinical-card profile-side-card">
            <h3>תחומי התמחות</h3>
            {focusTags.length === 0 ? (
              <p className="profile-focus-empty">אין תגיות מקושרות לתוכן שפרסמתם.</p>
            ) : (
              <div className="profile-focus-chips">
                {focusTags.map((tag) => (
                  <span key={tag.id} className="profile-focus-chip">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

        </aside>

        <section className="profile-main">
          <div className="profile-tabs" role="tablist" aria-label="היסטוריית פעילות">
            {(Object.keys(TAB_LABELS) as ProfileTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                className="profile-tab"
                data-active={activeTab === tab}
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {activeTab === "materials" && (
            <div className="profile-materials-grid" role="tabpanel">
              {materials.map((material) => (
                <Link
                  key={material.id}
                  href={`/materials/${material.id}`}
                  className="profile-clinical-card profile-material-card"
                >
                  <div className="profile-material-icon">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {getMaterialIcon(material)}
                    </span>
                  </div>
                  <div>
                    <h4 className="profile-material-title">{material.title}</h4>
                    <p className="profile-material-desc">{material.description}</p>
                    <div className="profile-material-meta">
                      <span>{getMaterialMeta(material)}</span>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/materials/upload" className="profile-clinical-card profile-upload-card">
                <span className="material-symbols-outlined" aria-hidden="true">
                  add_circle
                </span>
                העלאת חומר חדש
              </Link>
            </div>
          )}

          {activeTab === "recommendations" && (
            <div className="profile-stack" role="tabpanel">
              {recommendations.length === 0 ? (
                <p className="profile-empty profile-clinical-card">עדיין לא פרסמתם המלצות.</p>
              ) : (
                recommendations.map((item) => (
                  <article
                    key={item.id}
                    className="profile-clinical-card profile-recommendation-card"
                  >
                    <div className="profile-recommendation-label">
                      <span className="material-symbols-outlined" aria-hidden="true">
                        star
                      </span>
                      {(item.type && RECOMMENDATION_TYPE_LABELS[item.type]) || "המלצה"}
                    </div>
                    <h4 className="profile-recommendation-title">
                      {getRecommendationTitle(item.content)}
                    </h4>
                    <p className="profile-recommendation-content">
                      &ldquo;{item.content}&rdquo;
                    </p>
                    <div className="profile-recommendation-footer">
                      <span className="profile-recommendation-date">
                        {formatDaysAgo(item.created_at)}
                      </span>
                      <Link href={`/recommendations#rec-${item.id}`} className="profile-link-btn">
                        צפייה בדיון
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === "forum" && (
            <div className="profile-stack" role="tabpanel">
              {forumQuestions.length === 0 && forumAnswers.length === 0 ? (
                <p className="profile-empty profile-clinical-card">אין פעילות בפורום.</p>
              ) : (
                <>
                  {forumQuestions.map((question) => (
                    <article key={question.id} className="profile-clinical-card profile-forum-card">
                      <div className="profile-forum-card-header">שאלה שפורסמה</div>
                      <div className="profile-forum-card-body">
                        <Link href={`/forum/${question.id}`}>
                          <h4>{question.title}</h4>
                          <p>&ldquo;{question.content}&rdquo;</p>
                        </Link>
                        <div className="profile-forum-meta">
                          <span className="profile-forum-meta-item">
                            <span className="material-symbols-outlined" aria-hidden="true">
                              thumb_up
                            </span>
                            {question.like_count} הצבעות
                          </span>
                          <span className="profile-forum-meta-item">
                            <span className="material-symbols-outlined" aria-hidden="true">
                              forum
                            </span>
                            {question.answer_count} תשובות
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                  {forumAnswers.map((answer) => (
                    <article key={answer.id} className="profile-clinical-card profile-forum-card">
                      <div className="profile-forum-card-header">תשובה שפורסמה</div>
                      <div className="profile-forum-card-body">
                        <Link href={`/forum/${answer.question_id}`}>
                          <h4>תשובה בשאלת פורום</h4>
                          <p>&ldquo;{answer.content}&rdquo;</p>
                        </Link>
                        <div className="profile-forum-meta">
                          <span className="profile-forum-meta-item">
                            <span className="material-symbols-outlined" aria-hidden="true">
                              thumb_up
                            </span>
                            {answer.like_count} הצבעות
                          </span>
                          <span className="profile-forum-meta-item">
                            <span className="material-symbols-outlined" aria-hidden="true">
                              forum
                            </span>
                            {answer.reply_count} מענים
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="profile-stack" role="tabpanel">
              {events.length === 0 ? (
                <p className="profile-empty profile-clinical-card">לא פרסמתם אירועים.</p>
              ) : (
                events.map((event) => {
                  const eventDate = event.event_date ? new Date(event.event_date) : null;
                  const monthLabel = eventDate
                    ? eventDate.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase()
                    : "—";
                  const dayLabel = eventDate ? String(eventDate.getUTCDate()) : "—";
                  const participantCount = event.comments?.length ?? 0;

                  return (
                    <article key={event.id} className="profile-clinical-card profile-event-card">
                      <div className="profile-event-date-panel">
                        <div style={{ textAlign: "center" }}>
                          <p className="profile-event-date-month">{monthLabel}</p>
                          <p className="profile-event-date-day">{dayLabel}</p>
                        </div>
                      </div>
                      <div className="profile-event-body">
                        <div>
                          <span className="profile-event-badge">סדנה / אירוע</span>
                          <h4 className="profile-event-title">
                            {event.title}
                            {event.is_cancelled && (
                              <span className="profile-cancelled-badge">בוטל</span>
                            )}
                          </h4>
                          <p className="profile-event-desc">{event.description}</p>
                        </div>
                        <div className="profile-event-footer">
                          <div className="profile-event-participants">
                            <span className="material-symbols-outlined" aria-hidden="true">
                              group
                            </span>
                            <span>{participantCount} מטפלים השתתפו</span>
                          </div>
                          <Link href={`/events/${event.id}`} className="profile-event-view-btn">
                            צפייה באירוע
                          </Link>
                        </div>
                        <button
                          type="button"
                          className="profile-event-edit-toggle"
                          onClick={() =>
                            setEditingEventId((current) =>
                              current === event.id ? null : event.id,
                            )
                          }
                        >
                          {editingEventId === event.id ? "סגירת עריכה" : "עריכת אירוע"}
                        </button>
                        {editingEventId === event.id && (
                          <div className="profile-event-edit-wrap">
                            <EditEventForm
                              eventId={event.id}
                              initial={buildEditEventInitial(event)}
                              canCancel
                            />
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>

      <Link
        href={FAB_LINKS[activeTab]}
        className="profile-fab"
        aria-label={
          activeTab === "materials"
            ? "העלאת חומר"
            : activeTab === "recommendations"
              ? "פרסום המלצה"
              : activeTab === "forum"
                ? "שאלה חדשה בפורום"
                : "יצירת אירוע"
        }
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          add
        </span>
      </Link>

      {showEditProfile && (
        <div
          className="profile-edit-overlay"
          role="presentation"
          onClick={() => setShowEditProfile(false)}
        >
          <div
            className="profile-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="profile-edit-title">עריכת פרופיל</h2>
            <form onSubmit={(event) => void handleSaveProfile(event)}>
              <div className="form-field">
                <label htmlFor="profile-full-name">שם מלא</label>
                <input
                  id="profile-full-name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="profile-title">תפקיד מקצועי (אופציונלי)</label>
                <input
                  id="profile-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              {editError && <p className="error">{editError}</p>}
              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowEditProfile(false)}
                >
                  ביטול
                </button>
                <button type="submit" className="button" disabled={editLoading}>
                  {editLoading ? "שומר..." : "שמירה"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
