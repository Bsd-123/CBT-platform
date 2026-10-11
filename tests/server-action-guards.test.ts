import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk("src").filter((f) => /\.(ts|tsx)$/.test(f));
const serverActionFiles = files.filter((f) =>
  /^["']use server["']/.test(readFileSync(f, "utf8").trimStart()),
);

/** Actions that are intentionally callable without a session. */
const PUBLIC_ACTIONS = new Set([
  "fetchAuthSession",
  "fetchAuthenticatedProfile",
  "fetchPostLoginPath",
  "logout",
]);

describe("server actions", () => {
  it("finds the server action files", () => {
    expect(serverActionFiles.length).toBeGreaterThan(0);
  });

  it("every exported action authenticates before doing work", () => {
    const offenders: string[] = [];
    for (const file of serverActionFiles) {
      const source = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      const parts = source.split(/export async function /).slice(1);
      for (const part of parts) {
        const name = part.slice(0, part.indexOf("("));
        if (PUBLIC_ACTIONS.has(name)) continue;
        const end = part.indexOf("\nexport ");
        const body = end === -1 ? part : part.slice(0, end);
        if (!/\b(require\w+|authorizeWrite)\(/.test(body)) {
          offenders.push(`${file}:${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the unguarded data layer is server-only and not a server-action file", () => {
    const source = readFileSync("src/lib/data/index.ts", "utf8");
    expect(source).toContain('import "server-only"');
    expect(source).not.toContain('"use server"');
  });
});
