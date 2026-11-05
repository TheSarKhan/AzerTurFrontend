"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  CalendarClock,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderOpen,
  Handshake,
  MapPinned,
  Maximize,
  MessagesSquare,
  Minimize,
  Printer,
  Route,
  Send,
  Tickets,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Editable content                                                    */
/* ------------------------------------------------------------------ */

const APP_URL = "https://app.aztrip.online";
const APP_LABEL = "app.aztrip.online";
const WEB_URL = "https://aztrip.online";
const WEB_LABEL = "aztrip.online";

type Member = { name: string; role: string; photo: string };
// Drop a square photo (about 600×600) at each `photo` path below, e.g.
// public/pitch/team/serxan.jpg. Until the file exists, the initial is shown.
const TEAM: Member[] = [
  { name: "Sarkhan Babayev", role: "Product Owner", photo: "/pitch/team/serxan.jpg" },
  { name: "Ulkar Aliyeva", role: "QA", photo: "/pitch/team/ulker.jpg" },
  { name: "Parvana Aliyeva", role: "Design", photo: "/pitch/team/pervane.jpg" },
  { name: "Bahruz Sultanov", role: "Tourism", photo: "/pitch/team/behruz.jpg" },
  { name: "Zamiq Quliyev", role: "Tourism", photo: "/pitch/team/zamiq.jpg" },
  { name: "Aykhan Hajiyev", role: "Business", photo: "/pitch/team/ayxan.jpg" },
];

const ROLES = [
  {
    title: "Product Owner",
    text: "Sets the product vision and priorities, and decides what the team builds next.",
  },
  {
    title: "QA",
    text: "Tests each release on web and mobile, so requests, offers and documents work as promised.",
  },
  {
    title: "Design",
    text: "Shapes the brand and the website and app screens, so planning a trip feels simple.",
  },
  {
    title: "Tourism",
    text: "Designs tours and itineraries, and works with local hotels, guides and drivers to confirm availability.",
  },
  {
    title: "Business",
    text: "Studies the market and customers, and shapes pricing, partnerships and the business model.",
  },
];
// Left edge and width of each role column on the team slide (stage px).
const ROLE_COLS = [
  [94, 440],
  [574, 283],
  [897, 283],
  [1220, 283],
  [1543, 283],
];

const PROBLEMS = [
  {
    icon: Tickets,
    title: "Bookings are scattered",
    lines: [
      "Travelers juggle separate bookings for tickets, stays,",
      "transfers and guides.",
    ],
  },
  {
    icon: CalendarClock,
    title: "Fixed tours limit choice",
    lines: [
      "Fixed dates and generic AI tips make it hard to find",
      "interesting local activities that fit the trip.",
    ],
  },
  {
    icon: MessagesSquare,
    title: "Prices and availability take follow-up",
    lines: [
      "Travelers and agencies chase several providers",
      "to confirm what is available and what it costs.",
    ],
  },
];

const SOLUTIONS = [
  {
    icon: Compass,
    title: "Travel on your terms",
    lines: ["Choose the pace, destinations and services", "that suit you."],
  },
  {
    icon: CalendarHeart,
    title: "Ideas tailored to your trip",
    lines: [
      "Our team suggests local places and activities",
      "based on your dates and interests.",
    ],
  },
  {
    icon: Handshake,
    title: "Local support for agencies",
    lines: [
      "International agencies arrange services in",
      "Azerbaijan through one local team.",
    ],
  },
];

const STEPS = [
  { icon: MapPinned, title: "Discover events nearby", text: "See what is on in your city or close to you." },
  { icon: Route, title: "Choose a route", text: "Pick a tour or build your own trip." },
  { icon: Send, title: "Send a request", text: "Add your dates and the services you need." },
  { icon: FolderOpen, title: "Find your travel documents", text: "Open them in the app when they are ready." },
];

const MARKET = [
  {
    key: "TAM",
    value: "AZN 2.10B",
    lines: ["Domestic and inbound spending", "across Azerbaijan"],
    sub: "AZN 1.40B domestic + AZN 695M inbound",
  },
  {
    key: "SAM",
    value: "AZN 1.32B",
    lines: [
      "Domestic trips to Baku, Quba, Gabala, Sheki",
      "plus visitors from the four target countries",
    ],
    sub: "AZN 1.00B domestic + AZN 313M inbound",
  },
  {
    key: "SOM",
    value: "AZN 252K",
    lines: ["Year 1 target for a 10-person team", "720 bookings × AZN 350 average"],
    sub: "4 operators × 1 booking/day × 20 days × 9 months",
  },
];

const LABELS = [
  "Cover",
  "Problem",
  "Solution",
  "Product",
  "Market size",
  "Team",
  "Thank you",
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Mark({ color = "#B54126", size = 48 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true">
      <path
        d="M7 38 23 8 40 38M14 27h17M26 38l7-13"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function Top({ label, dark = false, edge }: { label?: string; dark?: boolean; edge?: number }) {
  return (
    <>
      <div className="pd-brand">
        <Mark color={dark ? "#F6F5EF" : "#B54126"} />
        <span>AzTrip</span>
      </div>
      {label ? (
        <div className="pd-label" style={edge ? { right: 1920 - edge } : undefined}>
          {label}
        </div>
      ) : null}
    </>
  );
}

function Rise({
  n = 0,
  className = "",
  style,
  children,
}: {
  n?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`pd-in ${className}`}
      style={{ ...style, ["--i" as string]: n } as CSSProperties}
    >
      {children}
    </div>
  );
}

function Qr({
  src = "/pitch/qr.svg",
  alt = "QR code for app.aztrip.online",
  className = "",
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`pd-qr ${className}`} src={src} alt={alt} />;
}

function SiteLink({
  href = APP_URL,
  label = APP_LABEL,
  className = "",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Slides                                                              */
/* ------------------------------------------------------------------ */

function Cover() {
  return (
    <>
      <div className="pd-cover-left">
        <Rise n={0} className="pd-cover-mark">
          <Mark size={78} />
        </Rise>
        <Rise n={1}>
          <h1 className="pd-cover-title">AzTrip</h1>
        </Rise>
        <Rise n={2}>
          <p className="pd-cover-sub">
            A digital travel experience
            <br />
            for Azerbaijan
          </p>
        </Rise>
        <Rise n={3} className="pd-cover-qrs">
          <div>
            <Qr src="/pitch/qr-web.svg" alt="QR code for aztrip.online" />
            <strong>Live website</strong>
            <SiteLink href={WEB_URL} label={WEB_LABEL} />
          </div>
          <div>
            <Qr />
            <strong>Live app demo</strong>
            <SiteLink />
          </div>
        </Rise>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pd-photo pd-photo-wide" src="/pitch/cover.jpg" alt="A traveler using a travel app on their phone above a mountain village in Azerbaijan" />
    </>
  );
}

function Issues({
  items,
  title,
  lead,
  label,
  dark,
  photo,
  alt,
}: {
  items: typeof PROBLEMS;
  title: [string, string];
  lead: string;
  label: string;
  dark?: boolean;
  photo: string;
  alt: string;
}) {
  return (
    <>
      <Top label={label} dark={dark} edge={1066} />
      <Rise n={0} className="pd-h2">
        {title[0]}
        <br />
        {title[1]}
      </Rise>
      <Rise n={1} className="pd-lead">
        {lead}
      </Rise>
      {items.map(({ icon: Icon, title: t, lines }, i) => (
        <Rise n={2 + i} key={t} className="pd-issue" style={{ top: 438 + 177 * i }}>
          <Icon size={41} strokeWidth={1.8} className="pd-issue-icon" aria-hidden="true" />
          <h3>{t}</h3>
          <p>
            {lines[0]}
            <br />
            {lines[1]}
          </p>
        </Rise>
      ))}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pd-photo pd-photo-narrow" src={photo} alt={alt} />
    </>
  );
}

function Product() {
  return (
    <>
      <Top label="Product" edge={1826} />
      <Rise n={0} className="pd-h2 pd-h2-product">
        From trip idea to
        <br />
        travel documents
      </Rise>
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <Rise n={1 + i} key={title} className="pd-step" style={{ top: 350 + 112 * i }}>
          <Icon size={38} strokeWidth={1.8} className="pd-issue-icon" aria-hidden="true" />
          <h3>{title}</h3>
          <p>{text}</p>
        </Rise>
      ))}
      <div className="pd-rule" />
      <Rise n={5} className="pd-operator">
        <strong>Operator dashboard</strong>
        <span>One workspace for requests, offers and updates.</span>
      </Rise>

      <div className="pd-cap" style={{ left: 862, top: 157 }}>
        Website
      </div>
      <Rise n={2} className="pd-laptop">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pitch/web-live.jpg" alt="AzTrip website home page" />
      </Rise>
      <Rise n={3} className="pd-phone">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pitch/mobile-app-live.jpg" alt="AzTrip mobile app home screen" />
      </Rise>
      <div className="pd-cap" style={{ left: 1601, top: 716 }}>
        Mobile app
      </div>

      <Rise n={6} className="pd-demo" style={{ left: 863 }}>
        <Qr src="/pitch/qr-web.svg" alt="QR code for aztrip.online" />
        <div>
          <strong>Live website</strong>
          <SiteLink href={WEB_URL} label={WEB_LABEL} />
        </div>
      </Rise>
      <Rise n={7} className="pd-demo" style={{ left: 1350 }}>
        <Qr />
        <div>
          <strong>Live app demo</strong>
          <SiteLink />
        </div>
      </Rise>
    </>
  );
}

function Market() {
  return (
    <>
      <Top label="Market Size" edge={1826} />
      <Rise n={0} className="pd-h2 pd-h2-market">
        The travel market in Azerbaijan
      </Rise>
      <div className="pd-market-sub">Official figures for 2025</div>

      <Rise n={1} className="pd-stat" style={{ left: 94 }}>
        <small>INBOUND TOURISM</small>
        <b>2.57M</b>
        <strong>International arrivals across all travel purposes</strong>
        <span>1.28M from Russia, Türkiye, Georgia and Kazakhstan</span>
      </Rise>
      <div className="pd-stat-rule" />
      <Rise n={2} className="pd-stat" style={{ left: 1000 }}>
        <small>DOMESTIC TOURISM</small>
        <b>10.14M</b>
        <strong>Domestic trips for leisure and entertainment</strong>
        <span>AZN 237.4M on sports and entertainment, plus AZN 84.2M on culture</span>
      </Rise>

      <div className="pd-band">
        <Rise n={3} className="pd-ring pd-ring-tam">
          <small>TAM</small>
          <b>{MARKET[0].value}</b>
        </Rise>
        <Rise n={4} className="pd-ring pd-ring-sam">
          <small>SAM</small>
          <b>{MARKET[1].value}</b>
        </Rise>
        <Rise n={5} className="pd-ring pd-ring-som">
          <small>SOM</small>
          <b>{MARKET[2].value}</b>
        </Rise>

        <p className="pd-band-intro">Annual spending on stays, tour packages, culture, sports and entertainment</p>
        {MARKET.map((m, i) => (
          <Rise n={4 + i} key={m.key} className={`pd-tier pd-tier-${m.key.toLowerCase()}`} style={{ top: 82 + 125 * i }}>
            <i aria-hidden="true" />
            <header>
              <strong>{m.key}</strong>
              <em>{m.sub}</em>
            </header>
            <span>
              {m.lines[0]}
              <br />
              {m.lines[1]}
            </span>
          </Rise>
        ))}

        <div className="pd-band-note">
          SOM is a capacity scenario. AZN 252K is gross booking value. Circles are schematic, not to scale.
        </div>
        <div className="pd-source">
          Source: State Statistical Committee of Azerbaijan, Domestic Tourism 2025 (tables 1, 22) and Inbound Tourism
          2025 (tables 1, 12).
        </div>
      </div>
    </>
  );
}

function Avatar({ member }: { member: Member }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // The server-rendered <img> can fail before React attaches onError, so check once on mount too.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <div className="pd-avatar">
      {failed ? (
        <b aria-hidden="true">{member.name.charAt(0)}</b>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} src={member.photo} alt={member.name} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

function Team() {
  return (
    <>
      <Top label="Team" edge={1826} />
      <Rise n={0} className="pd-h2 pd-h2-market">
        The team behind AzTrip
      </Rise>
      <Rise n={1} className="pd-market-sub">
        Six people building a digital travel experience for Azerbaijan.
      </Rise>
      <div className="pd-team">
        {TEAM.map((m, i) => (
          <Rise n={2 + i} key={m.name} className="pd-member">
            <Avatar member={m} />
            <strong>
              {m.name.split(" ")[0]}
              <br />
              {m.name.split(" ").slice(1).join(" ")}
            </strong>
            <span>{m.role}</span>
          </Rise>
        ))}
      </div>
      <div className="pd-roles">
        <small>WHAT EACH ROLE DOES</small>
        {ROLES.map((r, i) => (
          <Rise n={8 + i} key={r.title} className="pd-role" style={{ left: ROLE_COLS[i][0], width: ROLE_COLS[i][1] }}>
            <strong>{r.title}</strong>
            <span>{r.text}</span>
          </Rise>
        ))}
      </div>
    </>
  );
}

function Thanks() {
  return (
    <>
      <div className="pd-thanks-left">
        <Rise n={0} className="pd-cover-mark">
          <Mark size={78} color="#F6F5EF" />
        </Rise>
        <Rise n={1}>
          <h1 className="pd-cover-title pd-thanks-title">Thank you</h1>
        </Rise>
        <Rise n={2}>
          <p className="pd-cover-sub">
            Azerbaijan.
            <br />
            Your kind of journey.
          </p>
        </Rise>
        <Rise n={3} className="pd-cover-qrs">
          <div>
            <Qr src="/pitch/qr-web.svg" alt="QR code for aztrip.online" />
            <strong>Live website</strong>
            <SiteLink href={WEB_URL} label={WEB_LABEL} />
          </div>
          <div>
            <Qr />
            <strong>Live app demo</strong>
            <SiteLink />
          </div>
        </Rise>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pd-photo pd-photo-wide" src="/pitch/thanks.jpg" alt="Hikers on a mountain trail in Azerbaijan" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Deck                                                                */
/* ------------------------------------------------------------------ */

const SLIDES: { node: ReactNode; theme: "paper" | "forest" }[] = [
  { node: <Cover />, theme: "paper" },
  {
    node: (
      <Issues
        items={PROBLEMS}
        title={["Planning a trip", "takes too much work"]}
        lead="For local and international travelers and the agencies that help them."
        label="Problem"
        photo="/pitch/problem.jpg"
        alt="A traveler planning a trip with a map, laptop and phone"
      />
    ),
    theme: "paper",
  },
  {
    node: (
      <Issues
        items={SOLUTIONS}
        title={["Your trip,", "your choices"]}
        lead="AzTrip takes care of the planning and bookings."
        label="Solution"
        dark
        photo="/pitch/solution.jpg"
        alt="A local potter teaching a traveler to shape clay"
      />
    ),
    theme: "forest",
  },
  { node: <Product />, theme: "paper" },
  { node: <Market />, theme: "paper" },
  { node: <Team />, theme: "paper" },
  { node: <Thanks />, theme: "forest" },
];

const W = 1920;
const H = 1080;

export default function PitchDeck() {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const last = SLIDES.length - 1;

  const go = useCallback(
    (n: number) => setIndex(Math.max(0, Math.min(last, n))),
    [last],
  );

  // Read #n on load and follow back/forward.
  useEffect(() => {
    const read = () => {
      const n = parseInt(location.hash.slice(1), 10);
      if (n >= 1 && n <= SLIDES.length) setIndex(n - 1);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const synced = useRef(false);
  useEffect(() => {
    // Skip the first run so a deep link like /pitch#6 is read before it is rewritten.
    if (!synced.current) {
      synced.current = true;
      return;
    }
    const target = "#" + (index + 1);
    if (location.hash !== target) history.replaceState(null, "", target);
  }, [index]);

  // Fit the 1920×1080 stage inside the viewport.
  useEffect(() => {
    const fit = () => setScale(Math.min(innerWidth / W, innerHeight / H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const onButton = t?.tagName === "BUTTON" || t?.tagName === "A";
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          go(index + 1);
          break;
        case " ":
          if (onButton) return;
          go(index + (e.shiftKey ? -1 : 1));
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          go(index - 1);
          break;
        case "Home":
          go(0);
          break;
        case "End":
          go(last);
          break;
        case "f":
        case "F":
          toggleFull();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, last, toggleFull]);

  // Hide the control bar when the pointer rests.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 2800);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  const stageStyle = { transform: `translate(-50%, -50%) scale(${scale})` };

  return (
    <div
      ref={root}
      className="pd"
      onTouchStart={(e) => {
        const p = e.touches[0];
        touch.current = { x: p.clientX, y: p.clientY };
      }}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const p = e.changedTouches[0];
        const dx = p.clientX - s.x;
        const dy = p.clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="pd-stage" style={stageStyle}>
        {SLIDES.map((s, i) => (
          <section
            key={i}
            className={`pd-slide pd-${s.theme}${i === index ? " is-active" : ""}`}
            aria-hidden={i !== index}
            aria-label={`${i + 1} of ${SLIDES.length}: ${LABELS[i]}`}
            inert={i !== index}
          >
            {s.node}
          </section>
        ))}
      </div>

      <p className="pd-rotate">Rotate your phone for the best view</p>

      <nav className={`pd-controls${idle ? " is-idle" : ""}`} aria-label="Presentation controls">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide">
          <ChevronLeft size={20} />
        </button>
        <ol>
          {LABELS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                className={i === index ? "is-current" : ""}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}: ${label}`}
                aria-current={i === index ? "step" : undefined}
                title={label}
              />
            </li>
          ))}
        </ol>
        <span className="pd-count" aria-live="polite">
          {index + 1} / {SLIDES.length}
        </span>
        <button type="button" onClick={() => go(index + 1)} disabled={index === last} aria-label="Next slide">
          <ChevronRight size={20} />
        </button>
        <i aria-hidden="true" />
        <button type="button" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"}>
          {full ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button type="button" onClick={() => window.print()} aria-label="Print or save as PDF">
          <Printer size={18} />
        </button>
      </nav>
    </div>
  );
}
