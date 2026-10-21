"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { projectBook, projects, type Project } from "@/data/projects";
import { useMobile } from "@/hooks/usePreferences";
import { Icon } from "./Icon";

const PicturePage = forwardRef<
  HTMLDivElement,
  { project: Project; number: number }
>(({ project, number }, ref) => (
  <div className="book-page picture-page" ref={ref}>
    <div className="page-inner">
      <div className="page-running-head">
        THE COLLECTED WORKS <span>{project.year}</span>
      </div>
      <div className="project-plate">
        <img
          src={project.image}
          alt={
            project.demo
              ? `Atmospheric illustration for ${project.title}; demonstration project`
              : project.title
          }
        />
        <div className="plate-caption">
          <span>
            {project.demo
              ? `EXPERIMENT No. ${String(Math.ceil(number / 2)).padStart(2, "0")}`
              : project.year || "PLATE"}
          </span>
          <strong>{project.category}</strong>
        </div>
        <div className="plate-corner tl" />
        <div className="plate-corner br" />
      </div>
      <div className="page-bottom">
        <span>{project.demo ? "ILLUSTRATIVE DEMO" : project.category}</span>
        <span>{number}</span>
      </div>
    </div>
  </div>
));
PicturePage.displayName = "PicturePage";

const StoryPage = forwardRef<
  HTMLDivElement,
  { project: Project; number: number }
>(({ project, number }, ref) => (
  <div className="book-page story-page" ref={ref}>
    <div className="page-inner">
      <div className="page-running-head">
        A STUDY IN CREATION <span>UP</span>
      </div>
      <div className="project-story">
        <span className="paper-eyebrow">{project.category}</span>
        <h2>{project.title}</h2>
        <span className="story-ornament">✧</span>
        <p>{project.description}</p>
        {project.technologies.length > 0 && (
          <ul className="project-technologies">
            {project.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        )}
        {project.url ? (
          <a
            className="project-link"
            href={project.url}
            target="_blank"
            rel="noreferrer"
          >
            Explore Project <Icon name="arrow" size={18} />
          </a>
        ) : (
          project.demo && (
            <div className="demo-project-note">
              <span>DEMONSTRATION PROJECT</span>
              <small>A real project link will appear here.</small>
            </div>
          )
        )}
      </div>
      <div className="page-bottom">
        <span>{project.demo ? "DEMO ENTRY" : project.year}</span>
        <span>{number}</span>
      </div>
    </div>
  </div>
));
StoryPage.displayName = "StoryPage";

const SheetPage = forwardRef<
  HTMLDivElement,
  { src: string; number: number; total: number }
>(({ src, number, total }, ref) => (
  <div className="book-page sheet-page" ref={ref}>
    <div className="page-inner">
      <img src={src} alt={`Collected works, page ${number} of ${total}`} />
    </div>
  </div>
));
SheetPage.displayName = "SheetPage";

export function ProjectsBook({ reducedMotion }: { reducedMotion: boolean }) {
  const mobile = useMobile();
  const book = useRef<React.ComponentRef<typeof HTMLFlipBook>>(null);
  const [page, setPage] = useState(0);
  const sheets = projectBook.source === "pdf" ? projectBook.pages : null;
  const pageCount = sheets ? sheets.length : projects.length * 2;
  const go = (direction: "next" | "prev") => {
    const api = book.current?.pageFlip();
    if (!api) return;
    if (reducedMotion) {
      if (direction === "next") api.turnToNextPage();
      else api.turnToPrevPage();
    } else if (direction === "next") api.flipNext();
    else api.flipPrev();
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const api = book.current?.pageFlip();
      if (!api || (event.key !== "ArrowLeft" && event.key !== "ArrowRight"))
        return;
      event.preventDefault();
      if (reducedMotion) {
        if (event.key === "ArrowRight") api.turnToNextPage();
        else api.turnToPrevPage();
      } else if (event.key === "ArrowRight") api.flipNext();
      else api.flipPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reducedMotion]);
  return (
    <section className="projects-experience" aria-label="Project book">
      <div className="book-heading">
        <span className="paper-eyebrow">I — THE COLLECTED WORKS</span>
        <p>A few things made with curiosity.</p>
      </div>
      <div className="book-leather">
        {!reducedMotion && (
          <div className="book-opening-cover" aria-hidden="true">
            <span>Collected Works</span>
            <small>URIEL PANDOLFI</small>
            <i>✧</i>
          </div>
        )}
        <HTMLFlipBook
          key={`${mobile ? "portrait" : "spread"}-${pageCount}`}
          ref={book}
          width={440}
          height={mobile ? 650 : 560}
          size="stretch"
          minWidth={270}
          maxWidth={480}
          minHeight={mobile ? 400 : 350}
          maxHeight={mobile ? 680 : 610}
          startPage={0}
          drawShadow={!reducedMotion}
          flippingTime={reducedMotion ? 1 : 850}
          usePortrait={mobile}
          startZIndex={0}
          autoSize
          maxShadowOpacity={0.3}
          showCover={false}
          mobileScrollSupport
          clickEventForward
          useMouseEvents={!reducedMotion}
          swipeDistance={30}
          showPageCorners={!reducedMotion}
          disableFlipByClick={reducedMotion}
          className="project-flipbook"
          style={{}}
          onFlip={(event) => setPage(event.data)}
        >
          {sheets
            ? sheets.map((src, index) => (
                <SheetPage
                  key={src}
                  src={src}
                  number={index + 1}
                  total={sheets.length}
                />
              ))
            : projects.flatMap((project, index) => [
                <PicturePage
                  key={`${project.id}-image`}
                  project={project}
                  number={index * 2 + 1}
                />,
                <StoryPage
                  key={`${project.id}-story`}
                  project={project}
                  number={index * 2 + 2}
                />,
              ])}
        </HTMLFlipBook>
      </div>
      <div className="book-controls">
        <button
          onClick={() => go("prev")}
          disabled={page === 0}
          aria-label="Previous page"
        >
          <span className="arrow-reverse">
            <Icon name="arrow" size={19} />
          </span>
        </button>
        <div aria-live="polite">
          <span>
            {sheets ? "PAGE" : "CHAPTER"}{" "}
            {String((sheets ? page : Math.floor(page / 2)) + 1).padStart(2, "0")}{" "}
            <i>/</i> {String(sheets ? sheets.length : projects.length).padStart(2, "0")}
          </span>
          <small>
            {mobile
              ? "Swipe or use the arrows to turn a page"
              : "Drag a corner, click a page, or use ← →"}
          </small>
        </div>
        <button
          onClick={() => go("next")}
          disabled={page >= pageCount - (mobile ? 1 : 2)}
          aria-label="Next page"
        >
          <Icon name="arrow" size={19} />
        </button>
      </div>
    </section>
  );
}
