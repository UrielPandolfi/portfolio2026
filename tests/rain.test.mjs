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

test("rain loop is audible, bounded and seamless", async () => {
  const { renderRain } = await dataModule("src/lib/rainAudio.ts");
  const { left, right } = renderRain(8000, 2);
  assert.equal(left.length, right.length);
  assert.ok(left.length > 8000);
  let energy = 0;
  let peak = 0;
  for (let index = 0; index < left.length; index += 1) {
    assert.ok(Number.isFinite(left[index]) && Number.isFinite(right[index]));
    energy += left[index] * left[index] + right[index] * right[index];
    peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
  }
  const rms = Math.sqrt(energy / (left.length * 2));
  assert.ok(rms > 0.05 && rms < 0.45, `rms ${rms}`);
  assert.ok(peak <= 0.85, `peak ${peak}`);
  assert.ok(Math.abs(left[0] - left[left.length - 1]) < 0.35);
});
