const plates = {
  book: "/assets/project-book.webp",
  hourglass: "/assets/project-hourglass.webp",
  ink: "/assets/project-ink.webp",
};

const fieldPattern =
  /^(year|category|technologies|technology|link|url|image|demo)\s*:\s*(.*)$/i;

const unescapeMarkdown = (value) =>
  value.replace(/\\([\\`*_{}[\]()#+.!-])/g, "$1");

export function parseProjectDocument(text) {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  const chunks = cleaned.split(/^#\s+/m).slice(1);
  const seen = new Map();
  return chunks.flatMap((chunk) => {
    const lines = chunk.split("\n");
    const title = unescapeMarkdown(lines.shift()?.trim() ?? "");
    if (!title) return [];
    const fields = {};
    const body = [];
    let embeddedImage = "";
    for (const line of lines) {
      const image = line.match(/^!\[[^\]]*]\(([^)]+)\)/);
      if (image) {
        if (!embeddedImage) embeddedImage = image[1].trim();
        continue;
      }
      const field = line.match(fieldPattern);
      if (field) {
        fields[field[1].toLowerCase()] = unescapeMarkdown(field[2].trim());
        continue;
      }
      body.push(line);
    }
    const year = fields.year ?? "";
    const demoValue = (fields.demo ?? "").toLowerCase();
    const demo =
      ["yes", "true", "si", "sí", "1"].includes(demoValue) ||
      year.toLowerCase() === "demo";
    const link = fields.link ?? fields.url ?? "";
    const imageField = fields.image || embeddedImage;
    let id = slug(title);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count) id = `${id}-${count + 1}`;
    return [
      {
        id,
        title,
        description: unescapeMarkdown(
          body.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
        ),
        image: imageField,
        year: year || (demo ? "Demo" : ""),
        technologies: (fields.technologies ?? fields.technology ?? "")
          .split(/[,·|]/)
          .map((item) => item.trim())
          .filter(Boolean),
        category: fields.category || "Project",
        url: /^https?:\/\//i.test(link) ? link : null,
        demo,
      },
    ];
  });
}

export function plateFor(name) {
  return plates[name.trim().toLowerCase()] ?? null;
}

function slug(value) {
  const id = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return id || "project";
}
