import { describe, expect, it } from "vitest";
import { getNotificationHref } from "@/lib/utils/notification-links";

const id = "0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f";

describe("getNotificationHref", () => {
  it.each([
    ["forum", `/forum/${id}`],
    ["recommendation", `/recommendations#rec-${id}`],
    ["event", `/events/${id}`],
    ["professional_request", `/professional-requests/${id}`],
    ["material_request", `/materials/requests/${id}#responses`],
  ])("maps %s", (type, href) => {
    expect(getNotificationHref(type, id)).toBe(href);
  });

  it("returns null for unknown types, missing or malformed ids", () => {
    expect(getNotificationHref("user", id)).toBeNull();
    expect(getNotificationHref("forum", null)).toBeNull();
    expect(getNotificationHref(null, id)).toBeNull();
    expect(getNotificationHref("forum", "../../admin")).toBeNull();
  });
});
