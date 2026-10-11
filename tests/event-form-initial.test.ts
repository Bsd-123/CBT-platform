import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildEditEventInitial } from "@/lib/utils/event-form";

describe("buildEditEventInitial", () => {
  it("lives outside the client component so server pages can call it", () => {
    const source = readFileSync("src/lib/utils/event-form.ts", "utf8");
    expect(source).not.toMatch(/^["']use client["']/);
    expect(readFileSync("src/components/events/EditEventForm.tsx", "utf8")).not.toContain("buildEditEventInitial");
  });

  it("maps an event to the form's string fields", () => {
    const initial = buildEditEventInitial({
      title: "T", description: "D", event_date: null, event_time: null, is_cancelled: true,
    });
    expect(initial).toEqual({ title: "T", description: "D", event_date: "", event_time: "", is_cancelled: true });
  });
});
