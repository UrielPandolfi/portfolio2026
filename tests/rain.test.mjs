import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

async function dataModule(filename) {
  const source = await fs.readFile(filename, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  await fs.mkdir(".qa", { recursive: true });
  const dest = path.resolve(".qa", `${path.basename(filename, ".ts")}.mjs`);
  await fs.writeFile(dest, js);
  return import(pathToFileURL(dest).href);
}

test("rain bed is the uploaded recording", async () => {
  const { audioConfig } = await dataModule("src/data/audioConfig.ts");
  assert.equal(audioConfig.rain.file, "gentle-rain-on-window.mp3");
  assert.ok(audioConfig.rain.volume > 0 && audioConfig.rain.volume < 1);
  const file = path.resolve("Assets/audio", audioConfig.rain.file);
  const stat = await fs.stat(file);
  assert.ok(stat.size > 100_000, `rain file is only ${stat.size} bytes`);
});
