"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { projectBook, projects, type Project } from "@/data/projects";
import { fitPageWidth, spreadStart, stepZoom } from "@/lib/pdfView";
import { useMobile } from "@/hooks/usePreferences";
import { Icon } from "./Icon";
import { PdfReader } from "./PdfReader";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<"single" | "book">("single");
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(0);
  const sheets = projectBook.source === "pdf" ? projectBook.pages : null;
  const reading = Boolean(sheets);
  const spread = reading && mode === "book" && !mobile;
  const pageCount = sheets ? sheets.length : projects.length * 2;
  const shown = Math.min(page, Math.max(0, pageCount - 1));
  const navIndex = spread ? spreadStart(shown) : shown;
  const cssWidth = fitWidth * zoom;
  const goRef = useRef<(direction: "next" | "prev") => void>(() => {});

  const turnBook = (direction: "next" | "prev") => {
    const api = book.current?.pageFlip();
    if (!api) return;
    if (reducedMotion) {
      if (direction === "next") api.turnToNextPage();
      else api.turnToPrevPage();
    } else if (direction === "next") api.flipNext();
    else api.flipPrev();
  };
  const go = (direction: "next" | "prev") => {
    if (!sheets || spread) {
      turnBook(direction);
      return;
    }
    setPage((current) => {
      if (direction === "next") return Math.min(pageCount - 1, current + 1);
      return Math.max(0, current - 1);
    });
  };
  goRef.current = go;

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const measure = () => setFitWidth(fitPageWidth(scroller.clientWidth, mobile));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [mobile, spread, reading]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [shown, spread]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      event.preventDefault();
      goRef.current(event.key === "ArrowRight" ? "next" : "prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !reading || spread) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setZoom((current) => stepZoom(current, event.deltaY < 0 ? "in" : "out"));
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [reading, spread]);

  const leaves = sheets
    ? sheets.map((src, index) => (
        <SheetPage key={src} src={src} number={index + 1} total={sheets.length} />
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
      ]);

  return (
    <section
      className={`projects-experience ${reading ? "pdf-reader" : ""} ${spread ? "is-book" : "is-single"} ${reducedMotion ? "is-reduced" : ""}`}
      aria-label="Project book"
    >
      <div className="book-heading">
        <span className="paper-eyebrow">I — THE COLLECTED WORKS</span>
        <p>A few things made with curiosity.</p>
      </div>
      {reading && (
        <div className="reader-toolbar">
          <div className="reader-modes" role="group" aria-label="Page layout">
            <button
              type="button"
              aria-pressed={!spread}
              onClick={() => setMode("single")}
            >
              Single page
            </button>
            <button
              type="button"
              aria-pressed={spread}
              hidden={mobile}
              onClick={() => setMode("book")}
            >
              Book view
            </button>
          </div>
          {!spread && (
            <div className="reader-zoom" role="group" aria-label="Zoom">
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= 1}
                onClick={() => setZoom((current) => stepZoom(current, "out"))}
              >
                −
              </button>
              <button type="button" onClick={() => setZoom(1)}>
                Fit width
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= 2.5}
                onClick={() => setZoom((current) => stepZoom(current, "in"))}
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
      <div className="reader-scroll" ref={scrollRef}>
        {reading && !spread ? (
          cssWidth > 0 && (
            <div className="reader-stage">
              <PdfReader
                page={shown}
                cssWidth={cssWidth}
                reducedMotion={reducedMotion}
                onGoto={setPage}
              />
            </div>
          )
        ) : (
          <div className="book-leather">
            {!reducedMotion && (
              <div className="book-opening-cover" aria-hidden="true">
                <span>Collected Works</span>
                <small>URIEL PANDOLFI</small>
                <i>✧</i>
              </div>
            )}
            <HTMLFlipBook
              key={`${spread ? "spread" : mobile ? "portrait" : "document"}-${pageCount}`}
              ref={book}
              width={440}
              height={mobile ? 650 : 560}
              size="stretch"
              minWidth={270}
              maxWidth={480}
              minHeight={mobile ? 400 : 350}
              maxHeight={mobile ? 680 : 610}
              startPage={spread ? spreadStart(shown) : 0}
              drawShadow={!reducedMotion}
              flippingTime={reducedMotion ? 1 : 850}
              usePortrait={reading ? false : mobile}
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
              onFlip={(event) => {
                const next = event.data;
                setPage((current) => (spreadStart(current) === next ? current : next));
              }}
            >
              {leaves}
            </HTMLFlipBook>
          </div>
        )}
      </div>
      <div className="book-controls">
        <button
          type="button"
          onClick={() => go("prev")}
          disabled={navIndex === 0}
          aria-label="Previous page"
        >
          <span className="arrow-reverse">
            <Icon name="arrow" size={19} />
          </span>
        </button>
        <div aria-live="polite">
          <span>
            {sheets ? "PAGE" : "CHAPTER"}{" "}
            {String((sheets ? shown : Math.floor(shown / 2)) + 1).padStart(2, "0")}{" "}
            <i>/</i>{" "}
            {String(sheets ? sheets.length : projects.length).padStart(2, "0")}
          </span>
          <small>
            {spread
              ? "Drag a corner or use ← →"
              : mobile
                ? "Scroll to read, or use the arrows"
                : "Scroll to read, or use ← →"}
          </small>
        </div>
        <button
          type="button"
          onClick={() => go("next")}
          disabled={
            navIndex >=
            pageCount - (!sheets ? (mobile ? 1 : 2) : spread ? 2 : 1)
          }
          aria-label="Next page"
        >
          <Icon name="arrow" size={19} />
        </button>
      </div>
    </section>
  );
}
