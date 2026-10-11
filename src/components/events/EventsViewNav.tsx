import { TabNav } from "@/components/ui/TabNav";

type EventsViewNavProps = {
  active: "list" | "calendar";
};

export function EventsViewNav({ active }: EventsViewNavProps) {
  return (
    <TabNav
      ariaLabel="תצוגות אירועים"
      items={[
        { href: "/events", label: "רשימה", icon: "list", active: active === "list" },
        {
          href: "/events/calendar",
          label: "לוח שנה",
          icon: "calendar_month",
          active: active === "calendar",
        },
      ]}
    />
  );
}
