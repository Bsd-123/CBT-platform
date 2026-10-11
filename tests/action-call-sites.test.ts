import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const read = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");

/** Server actions that return ActionResult (their body is wrapped in runAction). */
function wrappedActionNames(): string[] {
  const names: string[] = [];
  for (const file of walk("src/lib/actions").filter((f) => f.endsWith(".ts"))) {
    const source = read(file);
    for (const part of source.split(/^export async function /m).slice(1)) {
      const name = part.slice(0, part.indexOf("("));
      const header = part.slice(0, 400);
      if (/return runAction\(/.test(header)) names.push(name);
    }
  }
  return names;
}

describe("ActionResult call sites", () => {
  const names = wrappedActionNames();
  const clientFiles = [...walk("src/components"), ...walk("src/app")].filter((f) =>
    f.endsWith(".tsx"),
  );

  it("finds the wrapped actions", () => {
    expect(names).toContain("submitEvent");
    expect(names).toContain("adminDeleteTag");
    expect(names.length).toBeGreaterThan(25);
  });

  it("every awaited call is passed through unwrap() so failures are not ignored", () => {
    const offenders: string[] = [];
    for (const file of clientFiles) {
      const source = read(file);
      for (const name of names) {
        const pattern = new RegExp(`(?<!unwrap\\()await ${name}\\(`, "g");
        for (const match of source.matchAll(pattern)) {
          const line = source.slice(0, match.index).split("\n").length;
          offenders.push(`${file}:${line} ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no wrapped action is called without await (result would be dropped)", () => {
    const offenders: string[] = [];
    for (const file of clientFiles) {
      const source = read(file);
      for (const name of names) {
        const pattern = new RegExp(`(?<!await )(?<![\\w.])${name}\\(`, "g");
        for (const match of source.matchAll(pattern)) {
          const before = source.slice(Math.max(0, match.index - 40), match.index);
          // thunks handed to AdminReportsList.run() are unwrapped there
          if (file.endsWith("AdminReportsList.tsx") && /=>\s*$/.test(before)) continue;
          // withTimeout(action(...)) is awaited and unwrapped by the caller
          if (/withTimeout\(\s*$/.test(before)) continue;
          // import lines / type positions are not calls
          if (/import|from/.test(source.slice(source.lastIndexOf("\n", match.index), match.index))) continue;
          const line = source.slice(0, match.index).split("\n").length;
          offenders.push(`${file}:${line} ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
