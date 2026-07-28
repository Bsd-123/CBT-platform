import { fetchAuthenticatedProfile } from "@/lib/actions/auth";
import { fetchMyEvents, fetchMyProfileActivity } from "@/lib/actions/profile";
import { ProfilePageView } from "@/components/profile/ProfilePageView";
import "@/app/profile.css";

export default async function ProfilePage() {
  const [auth, activity, myEvents] = await Promise.all([
    fetchAuthenticatedProfile(),
    fetchMyProfileActivity(),
    fetchMyEvents(),
  ]);

  if (!auth) {
    return null;
  }

  return (
    <div className="profile-page-shell">
      <ProfilePageView
        profile={auth.profile}
        materials={activity.materials}
        recommendations={activity.recommendations}
        forumQuestions={activity.forum_questions}
        forumAnswers={activity.forum_answers}
        events={myEvents}
        focusTags={activity.focus_tags}
      />
    </div>
  );
}
