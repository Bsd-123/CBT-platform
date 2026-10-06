import { describe, expect, it } from "vitest";
import { formatLog } from "@/lib/logger";

const at = new Date("2026-10-06T10:00:00Z");

describe("formatLog", () => {
  it("emits one JSON line with level, time and message", () => {
    const line = formatLog("info", "started", undefined, { port: 3000 }, at);
    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toMatchObject({
      level: "info",
      time: "2026-10-06T10:00:00.000Z",
      message: "started",
      port: 3000,
    });
  });

  it("serializes Error name, message and stack", () => {
    const parsed = JSON.parse(formatLog("error", "boom", new TypeError("bad"), {}, at));
    expect(parsed.error.name).toBe("TypeError");
    expect(parsed.error.message).toBe("bad");
    expect(typeof parsed.error.stack).toBe("string");
  });

  it("does not throw on circular context or BigInt", () => {
    const circular: Record<string, unknown> = { n: BigInt(10) };
    circular.self = circular;
    expect(() => formatLog("warn", "x", undefined, circular, at)).not.toThrow();
    expect(formatLog("warn", "x", undefined, circular, at)).toContain("[Circular]");
  });

  it("handles non-Error throwables", () => {
    const parsed = JSON.parse(formatLog("error", "weird", "just a string", {}, at));
    expect(parsed.error).toEqual({ message: "just a string" });
  });
});
