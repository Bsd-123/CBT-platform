import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, enforceRateLimit } from "@/lib/security/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to max then blocks within the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("t1", 3, 60, now + i)).toBe(true);
    }
    expect(checkRateLimit("t1", 3, 60, now + 10)).toBe(false);
  });

  it("allows again after the window passes", () => {
    const now = 2_000_000;
    expect(checkRateLimit("t2", 1, 10, now)).toBe(true);
    expect(checkRateLimit("t2", 1, 10, now + 1000)).toBe(false);
    expect(checkRateLimit("t2", 1, 10, now + 11_000)).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(checkRateLimit("a", 1, 60, 5)).toBe(true);
    expect(checkRateLimit("b", 1, 60, 5)).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("falls back to the in-memory limiter when Upstash is not configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    const id = `mem-${Math.random()}`;
    for (let i = 0; i < 5; i++) await enforceRateLimit("register", id);
    await expect(enforceRateLimit("register", id)).rejects.toThrow();
  });

  it("uses the shared counter when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ result: 6 }, { result: 1 }])),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(enforceRateLimit("register", "u1")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("falls back to memory when Upstash is unreachable", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(enforceRateLimit("write", `down-${Math.random()}`)).resolves.toBeUndefined();
  });
});
