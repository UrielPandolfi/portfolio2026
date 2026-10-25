import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { parseProjectDocument, plateFor } from "./lib/project-document.mjs";

const root = process.cwd();
const contentDir = path.join(root, "content");
const outDir = path.join(root, "public", "assets", "projects");
const manifestPath = path.join(root, "src", "data", "project-book.json");
const plates = [
  "/assets/project-book.webp",
  "/assets/project-hourglass.webp",
  "/assets/project-ink.webp",
];

const exists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const writeManifest = async (manifest) => {
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `Projects: ${manifest.source}${manifest.file ? ` from ${manifest.file}` : ""}.`,
  );
};

const copyImage = async (source) => {
  const value = source.trim();
  if (!value) return "";
  const plate = plateFor(value);
  if (plate) return plate;
  if (value.startsWith("/assets/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  let buffer;
  let baseName;
  if (value.startsWith("data:")) {
    const match = value.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) throw new Error("A project image data URI could not be read.");
    buffer = Buffer.from(match[1], "base64");
    baseName = "embedded";
  } else {
    const file = path.resolve(contentDir, value);
    const allowed = path.resolve(contentDir);
    if (file !== allowed && !file.startsWith(`${allowed}${path.sep}`)) {
      throw new Error(`Image path escapes the content folder: ${value}`);
    }
    buffer = await fs.readFile(file);
    baseName = path.basename(file, path.extname(file));
  }
  const name = `${baseName.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") || "image"}.webp`;
  await sharp(buffer).webp({ quality: 84 }).toFile(path.join(outDir, name));
  return `/assets/projects/${name}`;
};

const finishDocument = async (text, file) => {
  const projects = parseProjectDocument(text);
  if (projects.length === 0) {
    throw new Error(`${file} has no projects. Start each one with a heading.`);
  }
  for (const [index, project] of projects.entries()) {
    project.image = project.image
      ? await copyImage(project.image)
      : plates[index % plates.length];
  }
  return {
    source: "document",
    file: path.posix.join("content", path.basename(file)),
    pages: [],
    projects,
  };
};

const fromPdf = async (file) => {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsRoot = path.dirname(
    fileURLToPath(import.meta.resolve("pdfjs-dist/package.json")),
  );
  const assetDir = (folder) =>
    `${path.join(pdfjsRoot, folder).replace(/\\/g, "/")}/`;
  const data = new Uint8Array(await fs.readFile(file));
  const doc = await getDocument({
    data,
    isEvalSupported: false,
    standardFontDataUrl: assetDir("standard_fonts"),
    cMapUrl: assetDir("cmaps"),
    cMapPacked: true,
  }).promise;
  const pages = [];
  try {
    for (let number = 1; number <= doc.numPages; number += 1) {
      const page = await doc.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 1100 / base.width });
      const canvasAndContext = doc.canvasFactory.create(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      await page.render({
        canvasContext: canvasAndContext.context,
        canvas: canvasAndContext.canvas,
        viewport,
      }).promise;
      const name = `page-${String(number).padStart(2, "0")}.webp`;
      await sharp(canvasAndContext.canvas.toBuffer("image/png"))
        .webp({ quality: 84 })
        .toFile(path.join(outDir, name));
      pages.push(`/assets/projects/${name}`);
      page.cleanup();
    }
  } finally {
    if (typeof doc.cleanup === "function") await doc.cleanup();
  }
  if (pages.length === 0) throw new Error("The PDF has no pages.");
  await fs.copyFile(file, path.join(outDir, "source.pdf"));
  await fs.copyFile(
    path.join(pdfjsRoot, "legacy", "build", "pdf.worker.min.mjs"),
    path.join(outDir, "pdf.worker.min.mjs"),
  );
  await fs.cp(path.join(pdfjsRoot, "standard_fonts"), path.join(outDir, "standard_fonts"), {
    recursive: true,
  });
  await fs.cp(path.join(pdfjsRoot, "cmaps"), path.join(outDir, "cmaps"), {
    recursive: true,
  });
  return { source: "pdf", file: "content/projects.pdf", pages, projects: [] };
};

const fromDocx = async (file) => {
  const mammoth = (await import("mammoth")).default;
  let imageIndex = 0;
  const result = await mammoth.convertToMarkdown(
    { path: file },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        imageIndex += 1;
        const buffer = Buffer.from(await image.readAsArrayBuffer());
        const name = `embedded-${String(imageIndex).padStart(2, "0")}.webp`;
        await sharp(buffer).webp({ quality: 84 }).toFile(path.join(outDir, name));
        return { src: `/assets/projects/${name}` };
      }),
    },
  );
  for (const message of result.messages) {
    if (message.type === "error") console.error(message.message);
  }
  return finishDocument(result.value, file);
};

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const pdf = path.join(contentDir, "projects.pdf");
const docx = path.join(contentDir, "projects.docx");
const markdown = path.join(contentDir, "projects.md");
let manifest;
if (await exists(pdf)) {
  if ((await exists(docx)) || (await exists(markdown))) {
    console.log("Projects: the PDF replaces the Word and Markdown files.");
  }
  manifest = await fromPdf(pdf);
} else if (await exists(docx)) manifest = await fromDocx(docx);
else if (await exists(markdown)) manifest = await finishDocument(await fs.readFile(markdown, "utf8"), markdown);
else {
  manifest = { source: "demo", file: null, pages: [], projects: [] };
}
await writeManifest(manifest);
