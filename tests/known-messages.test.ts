import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("KNOWN_MESSAGES", () => {
  it("only lists messages that some source file still throws", () => {
    const resultSource = readFileSync("src/lib/actions/result.ts", "utf8");
    const block = resultSource.slice(
      resultSource.indexOf("KNOWN_MESSAGES"),
      resultSource.indexOf("};", resultSource.indexOf("KNOWN_MESSAGES")),
    );
    const keys = [...block.matchAll(/^\s*(?:"([^"]+)"|(\w+)):\s*"/gm)].map((m) => m[1] ?? m[2]);
    expect(keys.length).toBeGreaterThan(5);

    const others = sourceFiles("src")
      .filter((file) => !file.endsWith("result.ts"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    const stale = keys.filter((key) => !others.includes(key));
    expect(stale).toEqual([]);
  });
});
