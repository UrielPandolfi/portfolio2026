import bookFile from "./project-book.json";

export type Project = {
  id: string;
  title: string;
  description: string;
  image: string;
  year: string;
  technologies: string[];
  category: string;
  url: string | null;
  demo: boolean;
};

export type ProjectBook = {
  source: "demo" | "document" | "pdf";
  file: string | null;
  pages: string[];
  projects: Project[];
};

// Used only when content/projects.md, .docx, and .pdf are all absent.
const demoProjects: Project[] = [
  {
    id: "digital-craft",
    title: "Digital craft",
    description:
      "An illustrative space for a thoughtfully built web experience. Add the story, screenshots, and link to your own project here.",
    image: "/assets/project-book.webp",
    year: "Demo",
    technologies: ["React", "TypeScript", "APIs"],
    category: "Web development",
    url: null,
    demo: true,
  },
  {
    id: "worlds-in-motion",
    title: "Worlds in motion",
    description:
      "A place for an interactive world, a playful mechanic, or an experiment in real-time storytelling. This entry is demonstration content.",
    image: "/assets/project-hourglass.webp",
    year: "Demo",
    technologies: ["Unity", "C#", "Interaction"],
    category: "Interactive experiences",
    url: null,
    demo: true,
  },
  {
    id: "curiosity-lab",
    title: "The curiosity lab",
    description:
      "An illustrative entry for an exploration at the intersection of software and artificial intelligence. Replace it with your own experiment.",
    image: "/assets/project-ink.webp",
    year: "Demo",
    technologies: ["AI", "APIs", "Docker"],
    category: "Experimental work",
    url: null,
    demo: true,
  },
];

const book = bookFile as ProjectBook;
export const projectBook: ProjectBook =
  book.source === "demo" || book.source === "document" || book.source === "pdf"
    ? book
    : { source: "demo", file: null, pages: [], projects: [] };

export const projects: Project[] =
  projectBook.source === "document" && projectBook.projects.length > 0
    ? projectBook.projects
    : demoProjects;
