import Link from "next/link";

type EventsViewNavProps = {
  active: "list" | "calendar";
};

export function EventsViewNav({ active }: EventsViewNavProps) {
  return (
    <nav className="nav-links" aria-label="תצוגות אירועים" style={{ marginTop: "0.75rem" }}>
      <Link href="/events" data-active={active === "list"}>
        רשימה
      </Link>
      <Link href="/events/calendar" data-active={active === "calendar"}>
        לוח שנה
      </Link>
    </nav>
  );
}
