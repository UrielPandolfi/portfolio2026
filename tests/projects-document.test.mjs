import assert from "node:assert/strict";
import test from "node:test";
import { parseProjectDocument, plateFor } from "../scripts/lib/project-document.mjs";

test("a document becomes book entries", () => {
  const projects = parseProjectDocument(`
<!-- ignore this # not a project -->
# Lantern

Year: 2024
Category: Web
Technologies: React, TypeScript
Link: https://lantern.example
Image: book

A small light for the desk.

# Notes

Demo: yes

Only a paragraph.
`);
  assert.equal(projects.length, 2);
  assert.deepEqual(projects[0], {
    id: "lantern",
    title: "Lantern",
    description: "A small light for the desk.",
    image: "book",
    year: "2024",
    technologies: ["React", "TypeScript"],
    category: "Web",
    url: "https://lantern.example",
    demo: false,
  });
  assert.equal(projects[1].demo, true);
  assert.equal(projects[1].url, null);
  assert.equal(projects[1].description, "Only a paragraph.");
  assert.equal(
    parseProjectDocument("# Notes\n\nA line with a period\\.")[0].description,
    "A line with a period.",
  );
  assert.equal(plateFor("hourglass"), "/assets/project-hourglass.webp");
  assert.equal(plateFor("missing"), null);
});
