import { describe, expect, it, vi } from "vitest";
import { runAction, toUserMessage, unwrap } from "@/lib/actions/result";
import { AuthError, ForbiddenError } from "@/lib/auth/errors";
import { GENERIC_ERROR_MESSAGE, UserFacingError } from "@/lib/errors";

describe("runAction", () => {
  it("wraps successful results", async () => {
    expect(await runAction(async () => 42)).toEqual({ ok: true, data: 42 });
  });

  it("keeps user-facing messages", async () => {
    const result = await runAction(async () => {
      throw new UserFacingError("הערך אינו תקין");
    });
    expect(result).toEqual({ ok: false, error: "הערך אינו תקין" });
  });

  it("translates known repository messages", () => {
    expect(toUserMessage(new Error("Material not found."))).toBe("החומר לא נמצא.");
    expect(toUserMessage(new AuthError("Authentication required."))).toBe(
      "יש להתחבר מחדש כדי להמשיך.",
    );
    expect(toUserMessage(new ForbiddenError())).toBe("אין לך הרשאה לבצע פעולה זו.");
  });

  it("hides unexpected error details and logs them", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runAction(async () => {
      throw new Error("connect ECONNREFUSED 10.0.0.5:5432 password=secret");
    });
    expect(result).toEqual({ ok: false, error: GENERIC_ERROR_MESSAGE });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("rethrows Next.js control-flow errors such as redirect()", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/login;307;",
    });
    await expect(
      runAction(async () => {
        throw redirectError;
      }),
    ).rejects.toBe(redirectError);
  });
});

describe("unwrap", () => {
  it("returns data or throws the message", () => {
    expect(unwrap({ ok: true, data: "x" })).toBe("x");
    expect(() => unwrap({ ok: false, error: "שגיאה" })).toThrow("שגיאה");
  });
});
