import { initialsOf } from "@/lib/forum/thread";

type UserAvatarProps = {
  name: string | null | undefined;
  size?: "sm" | "md" | "lg";
};

/** Round initials badge; decorative, the name is always written next to it. */
export function UserAvatar({ name, size = "md" }: UserAvatarProps) {
  return (
    <span className={`ui-avatar ui-avatar--${size}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}
