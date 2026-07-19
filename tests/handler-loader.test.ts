import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { buildBot } from "../src/bot.js";
import { runSpecs, parseBotSpec } from "../src/toolkit/index.js";

describe("buildBot handler loader", () => {
  it("loads src/handlers/start.ts so /start replies via the harness", async () => {
    const raw = JSON.parse(
      readFileSync(new URL("./specs/start.json", import.meta.url), "utf8"),
    ) as unknown[];
    const specs = raw.map(parseBotSpec);
    const suite = await runSpecs(() => buildBot("test-token"), specs);
    expect(suite.failed).toBe(0);
    expect(suite.passed).toBeGreaterThan(0);
  });

  it("question solver handles free text input", async () => {
    const suite = await runSpecs(() => buildBot("test-token"), [
      parseBotSpec({
        name: "free text generates a solution",
        steps: [
          { send: { text: "Solve this algebra equation" },
            expect: [{ method: "sendMessage", payload: { text: "📚 Solution — Algebra\n\nStep 1: Identify the variable and what you're solving for.\nStep 2: Isolate the variable using inverse operations.\nStep 3: Perform the same operation on both sides.\nStep 4: Verify by substituting back into the original equation.\n\n📝 Teaching note: Always check your answer — plug it back in to verify." } }] },
        ],
      }),
    ]);
    expect(suite.failed).toBe(0);
  });
});
