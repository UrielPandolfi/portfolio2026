export function Icon({
  name,
  size = 20,
}: {
  name:
    | "book"
    | "letter"
    | "bust"
    | "hourglass"
    | "arrow"
    | "close"
    | "spark"
    | "volume"
    | "mute"
    | "headphones"
    | "sun"
    | "hand";
  size?: number;
}) {
  const paths = {
    book: (
      <>
        <path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z" />
        <path d="M12 5v15" />
      </>
    ),
    letter: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="m3 6 9 7 9-7" />
        <circle cx="12" cy="13" r="1.6" />
      </>
    ),
    bust: (
      <>
        <path d="M9 13c-2-2-3-4-2-7 1-4 9-4 10 0 1 3 0 5-2 7v2l5 3v3H4v-3l5-3Z" />
        <path d="M8 21v-3m8 3v-3" />
      </>
    ),
    hourglass: (
      <>
        <path d="M6 3h12M6 21h12M7 3v4c0 2 3 4 5 5-2 1-5 3-5 5v4m10-18v4c0 2-3 4-5 5 2 1 5 3 5 5v4" />
        <path d="m9 18 3-3 3 3Z" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h15m-6-6 6 6-6 6" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    spark: (
      <>
        <path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3Z" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    volume: (
      <>
        <path d="M4 9h4l5-4v14l-5-4H4Z" />
        <path d="M17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="M4 9h4l5-4v14l-5-4H4Z" />
        <path d="m16 9 5 6m0-6-5 6" />
      </>
    ),
    headphones: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v4a2 2 0 0 0 2 2h1v-8H6a2 2 0 0 0-2 2Z" />
        <path d="M20 13v4a2 2 0 0 1-2 2h-1v-8h1a2 2 0 0 1 2 2Z" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
      </>
    ),
    hand: (
      <>
        <path d="M4.5 6.5h3.2M5.6 4.8 4.5 6.5l1.1 1.7M19.5 6.5h-3.2M18.4 4.8 19.5 6.5l-1.1 1.7" />
        <path d="M9.2 16.2V11a1.35 1.35 0 0 1 2.7 0" />
        <path d="M11.9 14.4V10.2a1.25 1.25 0 0 1 2.5 0V16c0 2.5-1.6 4.5-4.2 4.5h-.7c-1.7 0-3-.8-3.8-2.3L4.2 15a1.15 1.15 0 0 1 2-1.1l2.2 2.6" />
        <path d="M8 21.5h8" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
