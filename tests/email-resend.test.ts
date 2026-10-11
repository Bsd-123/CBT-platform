import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FROM, getEmailConfig, missingEmailSettings } from "@/lib/email/config";
import { sendEmail, sendEmails } from "@/lib/email/resend";

const config = {
  apiKey: "re_test_key",
  from: "CBT <no-reply@cbt.example.com>",
  siteUrl: "https://cbt.example.com",
  supabaseUrl: "https://x.supabase.co",
  serviceRoleKey: "service",
};

const message = (to: string) => ({ to, subject: "נושא\r\nBcc: attacker@x.test", html: "<p>hi</p>", text: "hi" });

afterEach(() => vi.restoreAllMocks());

describe("email config", () => {
  const full = {
    RESEND_API_KEY: "re_1",
    SUPABASE_SERVICE_ROLE_KEY: "svc",
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
    NEXT_PUBLIC_SITE_URL: "https://cbt.example.com/",
  } as unknown as NodeJS.ProcessEnv;

  it("is on only when every required variable is set, and trims the site url", () => {
    expect(getEmailConfig(full)?.siteUrl).toBe("https://cbt.example.com");
    expect(getEmailConfig({ ...full, RESEND_API_KEY: "" })).toBeNull();
    expect(getEmailConfig({ ...full, SUPABASE_SERVICE_ROLE_KEY: undefined })).toBeNull();
    expect(getEmailConfig({ ...full, NEXT_PUBLIC_SITE_URL: undefined })).toBeNull();
  });

  it("falls back to the default sender and reports what is missing", () => {
    expect(getEmailConfig(full)?.from).toBe(DEFAULT_FROM);
    expect(getEmailConfig({ ...full, EMAIL_FROM: "A <a@b.co>" })?.from).toBe("A <a@b.co>");
    expect(missingEmailSettings({} as NodeJS.ProcessEnv)).toEqual([
      "RESEND_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL",
    ]);
  });
});

describe("resend client", () => {
  it("posts one email with the bearer key and a single-line subject", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendEmail(config, message("a@x.test"))).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ from: config.from, to: ["a@x.test"], html: "<p>hi</p>", text: "hi" });
    expect(body.subject).not.toMatch(/[\r\n]/);
  });

  it("uses the batch endpoint for several recipients, one message each", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendEmails(config, [message("a@x.test"), message("b@x.test")])).toBe(2);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails/batch");
    const body = JSON.parse(init.body as string);
    expect(body.map((item: { to: string[] }) => item.to)).toEqual([["a@x.test"], ["b@x.test"]]);
  });

  it("splits more than 100 recipients into several batches", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const many = Array.from({ length: 205 }, (_, index) => message(`u${index}@x.test`));
    expect(await sendEmails(config, many)).toBe(205);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("never throws: a rejected request is reported as not sent, without retrying client errors", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(config, message("a@x.test"))).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once after a rate limit, then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 429 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(config, message("a@x.test"))).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("survives a network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await sendEmail(config, message("a@x.test"))).toBe(false);
  });
});
