"use client";

import { useEffect, useRef, useState } from "react";
import { PDF_CMAP_URL, PDF_FONT_URL, PDF_URL, PDF_WORKER } from "@/lib/pdfView";

type PdfDocument = {
  numPages: number;
  getPage: (number: number) => Promise<PdfPage>;
  getDestination: (name: string) => Promise<unknown>;
  getPageIndex: (ref: unknown) => Promise<number>;
  destroy: () => Promise<void>;
};

type PdfPage = {
  getViewport: (params: { scale: number }) => PdfViewport;
  render: (params: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => { promise: Promise<void>; cancel: () => void };
  getAnnotations: () => Promise<unknown[]>;
  cleanup: () => void;
};

type PdfViewport = {
  width: number;
  height: number;
  rotation: number;
};

type Pdfjs = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (params: {
    url: string;
    isEvalSupported: boolean;
    standardFontDataUrl: string;
    cMapUrl: string;
    cMapPacked: boolean;
  }) => { promise: Promise<PdfDocument> };
  AnnotationLayer: new (params: {
    div: HTMLDivElement;
    page: PdfPage;
    viewport: PdfViewport;
    linkService: LinkService;
  }) => { render: (params: { annotations: unknown[]; renderForms: boolean }) => Promise<void> };
};

type LinkService = {
  externalLinkEnabled: boolean;
  addLinkAttributes: (link: HTMLAnchorElement, url: string, newWindow?: boolean) => void;
  getDestinationHash: (destination: unknown) => string;
  getAnchorUrl: (hash: string) => string;
  goToDestination: (destination: unknown) => Promise<void>;
  executeNamedAction: (action: string) => void;
};

let libraryPromise: Promise<Pdfjs> | null = null;
let documentPromise: Promise<PdfDocument> | null = null;

function library() {
  libraryPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((loaded) => {
    const pdfjs = loaded as unknown as Pdfjs;
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    return pdfjs;
  });
  return libraryPromise;
}

function document() {
  documentPromise ??= library().then((pdfjs) =>
    pdfjs.getDocument({
      url: PDF_URL,
      isEvalSupported: false,
      standardFontDataUrl: PDF_FONT_URL,
      cMapUrl: PDF_CMAP_URL,
      cMapPacked: true,
    }).promise,
  );
  return documentPromise;
}

export function PdfReader({
  page,
  cssWidth,
  reducedMotion,
  onGoto,
}: {
  page: number;
  cssWidth: number;
  reducedMotion: boolean;
  onGoto: (page: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const gotoRef = useRef(onGoto);
  gotoRef.current = onGoto;

  useEffect(() => {
    const canvas = canvasRef.current;
    const notes = notesRef.current;
    const sheet = sheetRef.current;
    if (!canvas || !notes || !sheet || cssWidth < 40) return;
    let cancelled = false;
    let task: { promise: Promise<void>; cancel: () => void } | null = null;
    setReady(false);
    const context = canvas.getContext("2d");
    if (!context) return;

    const run = async () => {
      const pdfjs = await library();
      const pdf = await document();
      if (cancelled) return;
      const pdfPage = await pdf.getPage(page + 1);
      if (cancelled) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5);
      let scale = (cssWidth / base.width) * pixelRatio;
      let viewport = pdfPage.getViewport({ scale });
      if (viewport.width > 4600) {
        scale *= 4600 / viewport.width;
        viewport = pdfPage.getViewport({ scale });
      }
      const cssHeight = cssWidth * (base.height / base.width);
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      sheet.style.width = `${cssWidth}px`;
      const cssScale = cssWidth / base.width;
      sheet.style.setProperty("--total-scale-factor", String(cssScale));
      sheet.style.setProperty("--scale-round-x", "1px");
      sheet.style.setProperty("--scale-round-y", "1px");
      task = pdfPage.render({ canvas, canvasContext: context, viewport });
      await task.promise;
      if (cancelled) return;
      notes.replaceChildren();
      const annotations = await pdfPage.getAnnotations();
      if (cancelled) return;
      const linkService: LinkService = {
        externalLinkEnabled: true,
        addLinkAttributes(link, url, newWindow) {
          link.href = url;
          link.target = newWindow === false ? "_self" : "_blank";
          link.rel = "noopener noreferrer";
        },
        getDestinationHash() {
          return "#";
        },
        getAnchorUrl() {
          return "#";
        },
        async goToDestination(destination) {
          let explicit = destination;
          if (typeof destination === "string") {
            explicit = await pdf.getDestination(destination);
          }
          const ref = Array.isArray(explicit) ? explicit[0] : null;
          if (!ref) return;
          const index = await pdf.getPageIndex(ref);
          gotoRef.current(index);
        },
        executeNamedAction(action) {
          const last = pdf.numPages - 1;
          if (action === "NextPage") gotoRef.current(Math.min(last, page + 1));
          else if (action === "PrevPage") gotoRef.current(Math.max(0, page - 1));
          else if (action === "FirstPage") gotoRef.current(0);
          else if (action === "LastPage") gotoRef.current(last);
        },
      };
      const layer = new pdfjs.AnnotationLayer({
        div: notes,
        page: pdfPage,
        viewport: pdfPage.getViewport({ scale: cssScale }),
        linkService,
      });
      await layer.render({ annotations, renderForms: false });
      if (!cancelled) setReady(true);
      pdfPage.cleanup();
    };

    run().catch((error: { name?: string }) => {
      if (cancelled || error?.name === "RenderingCancelledException") return;
      console.error("The manuscript page could not be drawn", error);
      setFailed(true);
    });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [page, cssWidth]);

  return (
    <div
      className={`pdf-sheet ${ready ? "is-ready" : ""} ${reducedMotion ? "is-reduced" : ""}`}
      data-pdf-page={page}
      ref={sheetRef}
    >
      <canvas ref={canvasRef} aria-label={`Collected works, page ${page + 1}`} />
      <div className="annotationLayer" ref={notesRef} />
      {failed && <p className="pdf-error">The manuscript could not be opened.</p>}
    </div>
  );
}

export { PDF_URL };
