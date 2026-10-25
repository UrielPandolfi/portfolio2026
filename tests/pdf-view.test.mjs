import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import ts from "typescript";

async function load(filename) {
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

test("the reading width fits the space without forcing a short page", async () => {
  const { fitPageWidth, spreadStart, stepZoom } = await load("src/lib/pdfView.ts");
  assert.equal(fitPageWidth(1200, false), 850);
  assert.equal(fitPageWidth(700, false), 668);
  assert.equal(fitPageWidth(390, true), 358);
  assert.equal(spreadStart(0), 0);
  assert.equal(spreadStart(3), 2);
  assert.equal(stepZoom(1, "out"), 1);
  assert.equal(stepZoom(1, "in"), 1.25);
  assert.equal(stepZoom(2.5, "in"), 2.5);
});
