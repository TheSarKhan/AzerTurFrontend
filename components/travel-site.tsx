"use client";
import Homepage from "./homepage";
import { homeCategories, homeText, homeCopy } from "@/lib/homepage-content";
import { translate } from "@/lib/i18n";
import {
  CustomerAuth,
  BookingCheckout,
  CustomerTrips,
} from "./customer-portal";
import {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
  useId,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Menu,
  X,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Mountain,
  Car,
  BedDouble,
  Compass,
  Globe,
  MessageCircle,
  ShieldCheck,
  LoaderCircle,
  CalendarDays,
  MoveUpRight,
} from "lucide-react";
import {
  tours,
  places,
  faqs,
  money,
  dateLimit,
  type Locale,
  type Currency,
  type Quote,
  type QuoteInput,
  type Tour,
  rates,
  transitions,
} from "@/lib/travel";
type Env = {
  l: Locale;
  c: Currency;
  go: (p: string) => void;
  tr: (a: string, b: string) => string;
  fmt: (n: number) => string;
  modal: (m: ReactNode) => void;
  book: (q: Quote) => void;
};
const Context = createContext<Env>(null!);
const useEnv = () => useContext(Context);
function Mark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M7 38 23 8 40 38M14 27h17M26 38l7-13"
        stroke="currentColor"
        strokeWidth="3.5"
      />
    </svg>
  );
}
function Logo() {
  return (
    <span className="logo">
      <Mark />
      <span>azərtur</span>
    </span>
  );
}
function Link({
  to,
  children,
  className = "",
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  target?: string;
}) {
  const { l, go } = useEnv();
  return (
    <a
      href={"/" + l + to}
      className={className}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey) {
          if (!e.currentTarget.target) {
            e.preventDefault();
            go(to);
          }
        }
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
function Btn({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={"button " + (secondary ? "secondary " : "") + className}
    >
      {children}
    </button>
  );
}
function Heading({
  children,
  side,
  level = 1,
}: {
  children: ReactNode;
  side?: ReactNode;
  level?: 1 | 2;
}) {
  const Tag = level === 1 ? "h1" : "h2";
  return (
    <div className="section-heading">
      <Tag>{children}</Tag>
      {side && <div className="heading-side">{side}</div>}
    </div>
  );
}
function Photo({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={"/images/" + src + ".webp"}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      width="1600"
      height="1000"
    />
  );
}
function Card({
  tour,
  index = 0,
  query = "",
}: {
  tour: Tour;
  index?: number;
  query?: string;
}) {
  const { l, c, tr } = useEnv();
  return (
    <article className="tour-card">
      <Link
        to={"/tours/" + tour.slug + query}
        className="card-image"
        aria-label={tour.name[l === "az" ? 2 : l === "en" ? 0 : 1]}
      >
        <Photo src={tour.image} alt={tour.region} />
        <span className="image-arrow">
          <ArrowUpRight size={25} />
        </span>
      </Link>
      <div className="card-meta">
        <span>
          {String(index + 1).padStart(2, "0")} / {tour.region}
        </span>
        <span>
          {tour.days} {tr(tour.days === 1 ? "day" : "days", "дн.")}
        </span>
      </div>
      <Link to={"/tours/" + tour.slug + query}>
        <h3>{tour.name[l === "az" ? 2 : l === "en" ? 0 : 1]}</h3>
      </Link>
      <div className="card-bottom">
        <span>
          {tr("From", "От")}{" "}
          <strong>{money(tour.base * rates[c], c, l)}</strong>
          <small> / {tr("person", "чел.")}</small>
        </span>
        <span>
          {tour.difficulty[l === "az" ? 2 : l === "en" ? 0 : 1]}{" "}
          <Mountain size={15} />
        </span>
      </div>
    </article>
  );
}
function Home() {
  const { l, go } = useEnv();
  return <Homepage locale={l} go={go} />;
}
function FinalCTA() {
  const { tr } = useEnv();
  return (
    <section className="final-cta container reveal">
      <p>{tr("The best part?", "Самое интересное?")}</p>
      <Link to="/plan" className="cta-title">
        {tr("You haven’t", "Всё ещё")}
        <br />
        {tr("been there yet.", "впереди.")}
        <ArrowUpRight strokeWidth={1} />
      </Link>
      <div>
        <span>{tr("Let’s change that.", "Давайте это изменим.")}</span>
        <Link to="/plan" className="text-link">
          {tr("Plan your journey", "Спланировать поездку")}
          <ArrowRight />
        </Link>
      </div>
    </section>
  );
}
function FAQ({ compact = false }: { compact?: boolean }) {
  const { l, tr } = useEnv();
  const [query, setQuery] = useState("");
  const list = (compact ? faqs.slice(0, 4) : faqs).filter((f) =>
    f.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section
      className={
        "faq-section container " + (!compact ? "page-content" : "reveal")
      }
    >
      <Heading
        level={compact ? 2 : 1}
        side={
          compact ? (
            <Link to="/faq" className="text-link">
              {tr("All questions", "Все вопросы")}
              <ArrowUpRight />
            </Link>
          ) : (
            <p>
              {tr(
                "A few things worth knowing before you go.",
                "Несколько полезных вещей перед поездкой.",
              )}
            </p>
          )
        }
      >
        {tr("Good questions.", "Хорошие вопросы.")}
        <br />
        {tr("Clear answers.", "Понятные ответы.")}
      </Heading>
      {!compact && (
        <label className="faq-search">
          <span>{tr("Find an answer", "Найти ответ")}</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr(
              "Try “deposit” or “visa”",
              "Например, «депозит» или «виза»",
            )}
          />
        </label>
      )}
      <div className="faq-list">
        {list.map((f, i) => (
          <details key={f[0]}>
            <summary>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{f[l === "az" ? 4 : l === "en" ? 0 : 1]}</h3>
              <Plus />
            </summary>
            <p>
              {f[l === "az" ? 5 : l === "en" ? 2 : 3]}
              {i === 4 && !compact && (
                <>
                  {" "}
                  <a
                    href="https://evisa.gov.az/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    evisa.gov.az ↗
                  </a>
                </>
              )}
            </p>
          </details>
        ))}
        {list.length === 0 && (
          <p>
            {tr(
              "No matching answers. Try another word or contact us.",
              "Ответ не найден. Попробуйте другое слово или свяжитесь с нами.",
            )}
          </p>
        )}
      </div>
    </section>
  );
}
function TourList() {
  const { tr, l } = useEnv();
  const [duration, setDuration] = useState("all");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setDuration(p.get("duration") || "all");
    setRegion(p.get("region") || "all");
    setCategory(p.get("category") || "all");
    const bookingParams = new URLSearchParams();
    for (const k of ["date", "pax"])
      if (p.has(k)) bookingParams.set(k, p.get(k)!);
    setQuery(bookingParams.size ? "?" + bookingParams : "");
  }, []);
  function filter(k: string, v: string) {
    const p = new URLSearchParams(location.search);
    v === "all" ? p.delete(k) : p.set(k, v);
    history.replaceState(
      {},
      "",
      location.pathname + (p.size ? "?" + p.toString() : ""),
    );
    k === "duration"
      ? setDuration(v)
      : k === "category"
        ? setCategory(v)
        : setRegion(v);
  }
  const list = tours.filter(
    (t) =>
      (duration === "all" ||
        (duration === "short" ? t.days <= 2 : t.days >= 3)) &&
      (region === "all" ||
        t.image === region ||
        (region === "gabala" && t.image === "sheki")) &&
      (category === "all" ||
        ((category === "history" || category === "culture") &&
          ["baku", "sheki"].includes(t.image)) ||
        (category === "nature" && ["mountains", "sheki"].includes(t.image)) ||
        (category === "entertainment" && t.image === "baku")),
  );
  return (
    <section className="container page-content">
      <Heading
        side={
          <p>
            {tr(
              "Start with a route that speaks to you. Make the details your own.",
              "Выберите маршрут по душе. Детали настройте под себя.",
            )}
          </p>
        }
      >
        {tr("Go somewhere", "Отправляйтесь туда,")}
        <br />
        <span className="serif">
          {tr("that stays with you.", "где запомнится.")}
        </span>
      </Heading>
      <div className="list-filters">
        <label>
          {tr("Duration", "Длительность")}
          <select
            value={duration}
            onChange={(e) => filter("duration", e.target.value)}
          >
            <option value="all">{tr("All durations", "Любая")}</option>
            <option value="short">1–2 {tr("days", "дня")}</option>
            <option value="long">3+ {tr("days", "дня")}</option>
          </select>
        </label>
        <label>
          {tr("Region", "Регион")}
          <select
            value={region}
            onChange={(e) => filter("region", e.target.value)}
          >
            <option value="all">{tr("All regions", "Все регионы")}</option>
            <option value="mountains">Quba · Khinalug</option>
            <option value="sheki">Sheki · Gabala</option>
            <option value="baku">Baku</option>
            <option value="gabala">Gabala</option>
          </select>
        </label>
        <label>
          {homeText(["Tour type", "Тип тура", "Tur növü"], l)}
          <select
            value={category}
            onChange={(e) => filter("category", e.target.value)}
          >
            <option value="all">
              {homeText(["All types", "Все типы", "Bütün növlər"], l)}
            </option>
            {homeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {homeText(cat.label, l)}
              </option>
            ))}
          </select>
        </label>
        <span>
          {list.length} {tr("journeys", "маршрута")}
        </span>
      </div>
      <div className="tour-grid">
        {list.map((t, i) => (
          <Card key={t.slug} tour={t} index={i} query={query} />
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <Mountain />
          <h3>
            {tr("A different route, perhaps?", "Может быть, другой маршрут?")}
          </h3>
          <p>
            {tr(
              "No trips match these filters.",
              "Нет туров с такими фильтрами.",
            )}
          </p>
          <Btn
            secondary
            onClick={() => {
              filter("duration", "all");
              filter("region", "all");
              filter("category", "all");
            }}
          >
            {tr("Reset filters", "Сбросить фильтры")}
          </Btn>
          <Link
            to={
              category === "medical" || category === "business"
                ? "/request?route=" +
                  encodeURIComponent(
                    homeText(
                      homeCategories.find((c) => c.id === category)!.label,
                      l,
                    ),
                  )
                : "/plan"
            }
            className="text-link"
          >
            {category === "medical" || category === "business"
              ? homeText(
                  [
                    "Ask our team",
                    "Обратиться к команде",
                    "Komandaya müraciət et",
                  ],
                  l,
                )
              : tr("Build your own", "Создать свой")}
            <ArrowUpRight />
          </Link>
        </div>
      )}
    </section>
  );
}
function Builder({
  tour,
  customDays,
  cities,
  defaults,
}: {
  tour: Tour;
  customDays?: number;
  cities?: string[];
  defaults?: Partial<QuoteInput>;
}) {
  const { l, c, tr, fmt, book, go } = useEnv();
  const id = useId();
  const [input, setInput] = useState<QuoteInput>({
    slug: tour.slug,
    date: "",
    pax: 2,
    hotel: "comfort",
    driver: true,
    stay: true,
    guideLanguage: l,
    guide: true,
    transfer: false,
    activity: false,
    currency: c,
    ...defaults,
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setInput((s) => ({
      ...s,
      date: p.get("date") || defaults?.date || "",
      pax: Math.min(
        12,
        Math.max(1, Number(p.get("pax")) || defaults?.pax || 2),
      ),
      hotel: ["standard", "comfort", "premium"].includes(p.get("hotel") || "")
        ? (p.get("hotel") as QuoteInput["hotel"])
        : s.hotel,
      driver: p.has("driver")
        ? p.get("driver") !== "false"
        : (defaults?.driver ?? true),
      stay: p.has("stay")
        ? p.get("stay") !== "false"
        : (defaults?.stay ?? true),
      activity: p.has("activity")
        ? p.get("activity") === "true"
        : (defaults?.activity ?? false),
      guideLanguage:
        p.get("guideLanguage") === "ru"
          ? "ru"
          : p.get("guideLanguage") === "az"
            ? "az"
            : p.get("guideLanguage") === "en"
              ? "en"
              : l,
      transfer: p.has("transfer")
        ? p.get("transfer") === "true"
        : !!defaults?.transfer,
      guide: p.has("guide")
        ? p.get("guide") !== "false"
        : (defaults?.guide ?? true),
    }));
  }, [tour.slug]);
  useEffect(() => {
    if (!input.date) {
      setQuote(null);
      setBusy(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setQuote(null);
    setError("");
    const timer = setTimeout(() => {
      fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, currency: c, customDays, cities }),
        signal: controller.signal,
      })
        .then(async (r) => {
          if (!r.ok) {
            const d = (await r.json()) as { error: string };
            throw Error(d.error);
          }
          return r.json();
        })
        .then((q) => {
          setQuote(q as Quote);
          setBusy(false);
        })
        .catch((e) => {
          if (e.name !== "AbortError") {
            setError(
              e.message === "NO_SERVICES"
                ? tr(
                    "Choose at least one service to calculate your trip.",
                    "Выберите хотя бы одну услугу для расчёта.",
                  )
                : e.message === "INVALID_ROUTE"
                  ? tr(
                      "Check the connections between your stops.",
                      "Проверьте связь между остановками.",
                    )
                  : e.message === "DATE_NOT_AVAILABLE"
                    ? tr(
                        "Choose a date 3–365 days ahead.",
                        "Выберите дату через 3–365 дней.",
                      )
                    : tr(
                        "Could not load a price. Try again.",
                        "Не удалось получить цену. Попробуйте снова.",
                      ),
            );
            setQuote(null);
            setBusy(false);
          }
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, c, customDays, JSON.stringify(cities), l, retry]);
  function change<K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) {
    setInput((s) => ({ ...s, [key]: value }));
    setQuote(null);
    const p = new URLSearchParams(location.search);
    p.set(key, String(value));
    history.replaceState({}, "", location.pathname + "?" + p.toString());
    try {
      sessionStorage.setItem(
        "azertur-draft-url",
        location.pathname + "?" + p.toString(),
      );
    } catch {}
  }
  return (
    <div className="builder">
      <div className="builder-heading">
        <h3>{tr("Make it your trip.", "Сделайте поездку своей.")}</h3>
        <span>{tr("Demo quote", "Демо-расчёт")}</span>
      </div>
      <div className="builder-fields">
        <label htmlFor={id + "date"}>{tr("Start date", "Дата начала")}</label>
        <input
          id={id + "date"}
          type="date"
          min={dateLimit(3)}
          max={dateLimit(365)}
          value={input.date}
          onInput={(e) => change("date", e.currentTarget.value)}
          onChange={(e) => change("date", e.target.value)}
        />
        <div className="travellers">
          <span>
            {tr("Travellers", "Путешественники")}
            <small>
              {tr("1–12 people · all ages", "1–12 человек · любой возраст")}
            </small>
          </span>
          <div className="stepper">
            <button
              aria-label={tr("Remove traveller", "Убрать человека")}
              disabled={input.pax <= 1}
              onClick={() => change("pax", input.pax - 1)}
            >
              <Minus size={16} />
            </button>
            <output aria-live="polite">{input.pax}</output>
            <button
              aria-label={tr("Add traveller", "Добавить человека")}
              disabled={input.pax >= 12}
              onClick={() => change("pax", input.pax + 1)}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <label className="checkline">
          <input
            type="checkbox"
            checked={input.driver !== false}
            onChange={(e) => change("driver", e.target.checked)}
          />
          {tr("Private driver", "Личный водитель")}
        </label>
        {(customDays ?? tour.days) > 1 && (
          <label className="checkline">
            <input
              type="checkbox"
              checked={input.stay !== false}
              onChange={(e) => change("stay", e.target.checked)}
            />
            {tr("Include hotel stays", "Добавить проживание")}
          </label>
        )}
        {input.driver === false && (
          <p className="field-help">
            {tr(
              "You arrange transport between stops.",
              "Переезды между остановками вы организуете сами.",
            )}
          </p>
        )}
        {(customDays ?? tour.days) > 1 && input.stay !== false && (
          <label>
            {tr("Your stay", "Ваш отель")}
            <select
              value={input.hotel}
              onChange={(e) =>
                change("hotel", e.target.value as QuoteInput["hotel"])
              }
            >
              <option value="standard">{tr("Standard", "Стандарт")}</option>
              <option value="comfort">{tr("Comfort", "Комфорт")}</option>
              <option value="premium">{tr("Premium", "Премиум")}</option>
            </select>
          </label>
        )}
        <label className="checkline">
          <input
            type="checkbox"
            checked={input.guide}
            onChange={(e) => change("guide", e.target.checked)}
          />
          {tr("Local guide", "Местный гид")}
        </label>
        {input.guide && (
          <label>
            {tr("Guide language", "Язык гида")}
            <select
              value={input.guideLanguage || l}
              onChange={(e) =>
                change("guideLanguage", e.target.value as Locale)
              }
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="az">Azərbaycanca</option>
            </select>
          </label>
        )}
        <label className="checkline">
          <input
            type="checkbox"
            checked={input.transfer}
            onChange={(e) => change("transfer", e.target.checked)}
          />
          {tr("Airport transfer", "Трансфер из аэропорта")}
        </label>
        <label className="checkline">
          <input
            type="checkbox"
            checked={input.activity}
            onChange={(e) => change("activity", e.target.checked)}
          />
          {tr("Local craft experience", "Мастер-класс местного ремесла")}
        </label>
      </div>
      <div
        className={"builder-price " + (busy ? "pending" : "")}
        aria-live="polite"
      >
        {busy && (
          <div className="quote-loading">
            <LoaderCircle className="spin" size={16} />
            {tr("Finding your price…", "Рассчитываем цену…")}
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {quote ? (
          <>
            <span>
              {tr("Total for", "Всего за")} {input.pax}{" "}
              {tr("travellers", "чел.")}
            </span>
            <div className="big-price">
              {fmt(quote.total)}
              <small>{c}</small>
            </div>
            <p>
              {fmt(quote.perPerson)} / {tr("person", "чел.")}
            </p>
            <details className="price-breakdown">
              <summary>
                {tr("Price breakdown", "Подробный расчёт")}
                <ChevronDown size={16} />
              </summary>
              {quote.lines.map((line) => (
                <div key={line.label}>
                  <span>{lineLabel(line.label, l)}</span>
                  <strong>{fmt(line.amount)}</strong>
                </div>
              ))}
            </details>
            <div className="deposit-lines">
              <div>
                <span>30% {tr("deposit today", "депозит сегодня")}</span>
                <strong>{fmt(quote.deposit)}</strong>
              </div>
              <div>
                <span>
                  {tr("Balance by", "Остаток до")} {quote.due}
                </span>
                <strong>{fmt(quote.balance)}</strong>
              </div>
            </div>
            <Btn disabled={busy} onClick={() => book(quote)}>
              {tr("Request review · deposit", "На проверку · депозит")}{" "}
              {fmt(quote.deposit)}
              <ArrowUpRight />
            </Btn>
            <p className="price-note">
              <ShieldCheck size={14} />
              {tr(
                "Fixed for 72 hours. No hidden fees.",
                "Фиксируется на 72 часа. Без скрытых сборов.",
              )}
            </p>
          </>
        ) : !busy && !error ? (
          <>
            <CalendarDays size={28} />
            <h4>
              {tr(
                "Your adventure starts with a date.",
                "Ваше приключение начинается с даты.",
              )}
            </h4>
            <p>
              {tr(
                "Choose when you’d like to go to see an itemised price.",
                "Выберите дату и получите подробный расчёт.",
              )}
            </p>
          </>
        ) : null}
        <p className="demo-label">
          {tr(
            "Sample prices · operator review required · demo payments only.",
            "Примерные цены · проверка оператором · только демо-оплата.",
          )}
        </p>
        {error && (
          <Btn secondary onClick={() => setRetry((x) => x + 1)}>
            {tr("Try again", "Повторить")}
            <ArrowRight />
          </Btn>
        )}
        {error && (
          <Btn secondary onClick={() => go("/request" + location.search)}>
            {tr("Request an offer", "Запросить предложение")}
            <ArrowRight />
          </Btn>
        )}
      </div>
    </div>
  );
}
function lineLabel(key: string, l: Locale) {
  const labels: Record<string, string[]> = {
    transport: ["Private driver", "Личный водитель", "Şəxsi sürücü"],
    hotel: ["Hotel stay", "Проживание", "Oteldə qalma"],
    guide: ["Local guide", "Местный гид", "Yerli gid"],
    transfer: ["Airport transfer", "Трансфер", "Transfer"],
    activity: ["Local experience", "Местный мастер-класс", "Yerli təcrübə"],
  };
  return labels[key]?.[l === "az" ? 2 : l === "en" ? 0 : 1] || key;
}
function TourPage({ slug }: { slug: string }) {
  const { l, c, tr, modal } = useEnv();
  const tour = tours.find((t) => t.slug === slug);
  const [gallery, setGallery] = useState(false);
  const [photo, setPhoto] = useState(0);
  const galleryRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (gallery) galleryRef.current?.showModal();
    else galleryRef.current?.close();
  }, [gallery]);
  if (!tour) return <NotFound />;
  const images = [tour.image, "village", "mountains", "baku"];
  return (
    <>
      <section className="container tour-page">
        <div className="breadcrumb">
          <Link to="/tours">{tr("Journeys", "Маршруты")}</Link>
          <span>/ {tour.region}</span>
        </div>
        <div className="tour-title">
          <h1>
            {tour.name[l === "az" ? 2 : l === "en" ? 0 : 1]}
            <span>.</span>
          </h1>
          <div className="tour-facts">
            <span>
              <Clock />
              {tour.days} {tr(tour.days === 1 ? "day" : "days", "дн.")}
            </span>
            <span>
              <MapPin />
              {tour.region}
            </span>
            <span>
              <Mountain />
              {tour.difficulty[l === "az" ? 2 : l === "en" ? 0 : 1]}
            </span>
          </div>
        </div>
        <div className="tour-gallery">
          <button
            onClick={() => {
              setPhoto(0);
              setGallery(true);
            }}
            aria-label={tr("Open photo gallery", "Открыть галерею")}
          >
            <Photo src={tour.image} alt={tour.region} eager />
            <span>
              {tr("Explore the views", "Посмотреть фотографии")}
              <Plus />
            </span>
          </button>
          <button
            onClick={() => {
              setPhoto(1);
              setGallery(true);
            }}
            aria-label={tr("Open second photo", "Открыть второе фото")}
          >
            <Photo src="village" alt="Khinalug village" />
          </button>
        </div>
        <div className="tour-detail-grid">
          <div className="tour-main">
            <h2>
              {tr(
                "A little out of the ordinary.",
                "Немного за пределами обычного.",
              )}
            </h2>
            <p className="lead">
              {tour.description[l === "az" ? 2 : l === "en" ? 0 : 1]}
            </p>
            <div className="route-strip">
              {tour.stops.map((s, i) => (
                <span key={s}>
                  {i > 0 && <ArrowRight size={16} />}
                  <MapPin size={16} />
                  {s}
                </span>
              ))}
            </div>
            <h2>{tr("The days ahead.", "Дни впереди.")}</h2>
            <div className="itinerary">
              {tour.plans.map((p, i) => (
                <details key={p[0]} open={i === 0}>
                  <summary>
                    <span className="day-num">0{i + 1}</span>
                    <div>
                      <small>
                        {tr("Day", "День")} {i + 1}
                      </small>
                      <h3>{p[l === "az" ? 2 : l === "en" ? 0 : 1]}</h3>
                    </div>
                    <Plus />
                  </summary>
                  <div className="itinerary-body">
                    <p>
                      <time>09:00</time>
                      {tr(
                        "Meet your driver and start the day.",
                        "Встреча с водителем и начало дня.",
                      )}
                    </p>
                    <p>
                      <time>12:30</time>
                      {tr(
                        "A local lunch stop and time to explore.",
                        "Обед и свободное время для прогулки.",
                      )}
                    </p>
                    <p>
                      <time>16:00</time>
                      {tr(
                        "A scenic walk, then settle into the evening.",
                        "Живописная прогулка и спокойный вечер.",
                      )}
                    </p>
                    <small>
                      {tr(
                        "Illustrative itinerary. Final timing is confirmed with your booking.",
                        "Примерная программа. Расписание уточняется при подтверждении.",
                      )}
                    </small>
                  </div>
                </details>
              ))}
            </div>
            <div className="included">
              <div>
                <h3>{tr("The essentials", "Главное")}</h3>
                {[
                  tr(
                    "Private driver for the route",
                    "Личный водитель по маршруту",
                  ),
                  tr("Flexible service choices", "Гибкий выбор услуг"),
                  tr("A detailed trip summary", "Подробный план поездки"),
                ].map((x) => (
                  <p key={x}>
                    <Check size={16} />
                    {x}
                  </p>
                ))}
              </div>
              <div>
                <h3>{tr("Good to know", "Полезно знать")}</h3>
                <p>
                  {tr(
                    "Flights and visas are not included.",
                    "Перелёты и визы не включены.",
                  )}
                </p>
                <p>
                  {tr(
                    "Your hotel and extras follow your selections.",
                    "Отель и дополнения зависят от вашего выбора.",
                  )}
                </p>
                <p>
                  {tr(
                    "Comfortable shoes and seasonal layers recommended.",
                    "Рекомендуем удобную обувь и одежду по сезону.",
                  )}
                </p>
              </div>
            </div>
            <div className="customise">
              <Compass size={32} />
              <h3>
                {tr(
                  "Like the route. Want to change the rhythm?",
                  "Нравится маршрут, но хотите свой ритм?",
                )}
              </h3>
              <p>
                {tr(
                  "Use this trip as the starting point for your own journey.",
                  "Возьмите этот тур за основу своего путешествия.",
                )}
              </p>
              <Link to={"/plan?template=" + tour.slug} className="text-link">
                {tr("Make this trip yours", "Изменить этот тур")}
                <ArrowUpRight />
              </Link>
            </div>
            <h3>{tr("Plans can change.", "Планы могут измениться.")}</h3>
            <p className="muted">
              {tr(
                "Contact the team to request changes or cancellation. Review the policy before booking.",
                "Для изменения или отмены обратитесь в команду. Изучите условия перед бронированием.",
              )}
            </p>
            <Link to="/legal/cancellation" className="text-link">
              {tr("Cancellation policy", "Условия отмены")}
              <ArrowUpRight />
            </Link>
          </div>
          <aside className="builder-aside">
            <Builder key={tour.slug} tour={tour} />
          </aside>
        </div>
      </section>
      <div className="mobile-booking-bar">
        <span>
          <small>{tr("From / person", "От / чел.")}</small>
          <strong>{money(tour.base * rates[c], c, l)}</strong>
        </span>
        <Btn onClick={() => modal(<Builder tour={tour} />)}>
          {tr("Choose my options", "Выбрать опции")}
          <ArrowUpRight />
        </Btn>
      </div>
      <dialog
        ref={galleryRef}
        onCancel={() => setGallery(false)}
        className="gallery-overlay"
        aria-label={tr("Photo gallery", "Фотогалерея")}
      >
        <button
          className="gallery-close icon-button"
          onClick={() => setGallery(false)}
          aria-label={tr("Close gallery", "Закрыть галерею")}
        >
          <X />
        </button>
        <button
          className="icon-button"
          onClick={() => setPhoto((photo + images.length - 1) % images.length)}
          aria-label={tr("Previous photo", "Предыдущее фото")}
        >
          <ChevronLeft />
        </button>
        <Photo
          src={images[photo]}
          alt={
            [tour.region, "Khinalug village", "Khinalug valley", "Baku"][photo]
          }
          eager
        />
        <button
          className="icon-button"
          onClick={() => setPhoto((photo + 1) % images.length)}
          aria-label={tr("Next photo", "Следующее фото")}
        >
          <ChevronRight />
        </button>
        <p>
          {photo + 1} / {images.length} ·{" "}
          {tr(
            "Destination photography, illustrative gallery",
            "Фотографии направлений, примерная галерея",
          )}
        </p>
      </dialog>
    </>
  );
}
function Planner() {
  const { tr } = useEnv();
  const [shared, setShared] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const [cities, setCities] = useState(["Baku", "Gabala", "Sheki"]);
  const [days, setDays] = useState(3);
  const [active, setActive] = useState(0);
  const [defaults, setDefaults] = useState<Partial<QuoteInput>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) {
      const p = new URLSearchParams(location.search);
      p.set("route", cities.join(","));
      history.replaceState({}, "", location.pathname + "?" + p.toString());
      try {
        sessionStorage.setItem(
          "azertur-draft-url",
          location.pathname + "?" + p.toString(),
        );
      } catch {}
    }
  }, [ready, days, JSON.stringify(cities)]);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const template = tours.find((t) => t.slug === p.get("template"));
    if (template) {
      const route =
        template.slug === "quba-khinalug"
          ? ["Quba", "Khinalug"]
          : template.slug === "baku-discovery"
            ? ["Baku"]
            : ["Baku", "Gabala", "Sheki"];
      setCities(route);
      setDays(route.length);
    }
    setDefaults({
      date: p.get("date") || "",
      pax: Math.min(12, Math.max(1, Number(p.get("pax")) || 2)),
      driver:
        !p.has("services") || (p.get("services") || "").includes("driver"),
      stay: !p.has("services") || (p.get("services") || "").includes("hotel"),
      activity: (p.get("services") || "").includes("activity"),
      transfer: (p.get("services") || "").includes("transfer"),
      guide: !p.has("services") || (p.get("services") || "").includes("guide"),
    });
    setReady(true);
  }, []);
  function count(n: number) {
    n = Math.min(14, Math.max(1, n));
    setDays(n);
    setCities((s) => {
      const next = Array.from(
        { length: n },
        (_, i) => s[i] || s[s.length - 1] || "Baku",
      );
      const p = new URLSearchParams(location.search);
      p.set("route", next.join(","));
      history.replaceState({}, "", location.pathname + "?" + p);
      return next;
    });
    setActive((a) => Math.min(a, n - 1));
  }
  async function share() {
    const p = new URLSearchParams(location.search);
    p.set("route", cities.join(","));
    const url = location.origin + location.pathname + "?" + p.toString();
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
    } catch {
      setShareFallback(url);
    }
  }
  function city(value: string) {
    setCities((s) => {
      const next = [...s];
      next[active] = value;
      for (let i = active + 1; i < next.length; i++)
        if (!transitions[next[i - 1]].includes(next[i])) next[i] = next[i - 1];
      const p = new URLSearchParams(location.search);
      p.set("route", next.join(","));
      history.replaceState({}, "", location.pathname + "?" + p);
      return next;
    });
  }
  useEffect(() => {
    const route = new URLSearchParams(location.search).get("route");
    if (route) {
      const values = route.split(",");
      if (
        values.length <= 14 &&
        values.every(
          (x, i) =>
            Object.hasOwn(transitions, x) &&
            (i === 0 || transitions[values[i - 1]].includes(x)),
        )
      ) {
        setCities(values);
        setDays(values.length);
      }
    }
  }, []);
  return (
    <section className="container page-content planner-page">
      <Heading
        side={
          <p>
            {tr(
              "Choose the days, shape the route, add the details. We’ll bring the price together.",
              "Выбирайте дни, создавайте маршрут, добавляйте детали. Мы рассчитаем стоимость.",
            )}
          </p>
        }
      >
        {tr("Go your", "Путешествуйте")}
        <br />
        <span className="serif">{tr("own way.", "по-своему.")}</span>
      </Heading>
      <div className="planner-grid">
        <div>
          <div className="planner-actions">
            <Btn secondary onClick={share}>
              {shared
                ? tr("Link copied", "Ссылка скопирована")
                : tr("Share this plan", "Поделиться маршрутом")}
              <ArrowUpRight size={16} />
            </Btn>
            <p>
              {tr(
                "Only your route and service choices are shared.",
                "Передаются только маршрут и выбранные услуги.",
              )}
            </p>
          </div>
          {shareFallback && (
            <label className="share-fallback">
              {tr("Copy this link", "Скопируйте ссылку")}
              <input
                readOnly
                value={shareFallback}
                onFocus={(e) => e.target.select()}
              />
            </label>
          )}
          <div className="planner-top">
            <div>
              <h3>{tr("Your route", "Ваш маршрут")}</h3>
              <p>
                {tr(
                  "Up to 14 days. A different pace every day.",
                  "До 14 дней. Каждый день в своём ритме.",
                )}
              </p>
            </div>
            <div className="stepper">
              <button
                aria-label="Remove day"
                onClick={() => count(days - 1)}
                disabled={days <= 1}
              >
                <Minus size={16} />
              </button>
              <output>
                {days} {tr("days", "дн.")}
              </output>
              <button
                aria-label="Add day"
                onClick={() => count(days + 1)}
                disabled={days >= 14}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="planner-days" role="tablist" aria-label="Trip days">
            {cities.map((city, i) => (
              <button
                role="tab"
                key={i}
                aria-selected={active === i}
                tabIndex={active === i ? 0 : -1}
                onKeyDown={(e) => {
                  let next = active;
                  if (e.key === "ArrowRight") next = (active + 1) % days;
                  else if (e.key === "ArrowLeft")
                    next = (active + days - 1) % days;
                  else if (e.key === "Home") next = 0;
                  else if (e.key === "End") next = days - 1;
                  else return;
                  e.preventDefault();
                  setActive(next);
                  e.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
                    [next]?.focus();
                }}
                onClick={() => setActive(i)}
              >
                <small>
                  {tr("Day", "День")} {i + 1}
                </small>
                <span>{city}</span>
                {active === i ? <ArrowDown size={16} /> : <MapPin size={16} />}
              </button>
            ))}
          </div>
          <div className="day-editor">
            <span className="day-big">
              {String(active + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>
                {tr("Where will the day take you?", "Куда приведёт этот день?")}
              </h3>
              <p>
                {tr(
                  "Stay a while or take the next road.",
                  "Задержитесь на месте или отправьтесь дальше.",
                )}
              </p>
            </div>
          </div>
          <label className="city-field">
            {tr("City / overnight stop", "Город / место ночёвки")}
            <select
              value={cities[active]}
              onChange={(e) => city(e.target.value)}
            >
              {Object.keys(transitions).map((name) => (
                <option
                  key={name}
                  disabled={
                    active > 0 &&
                    !transitions[cities[active - 1]].includes(name)
                  }
                >
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p className="field-help">
            {tr(
              "Only connected cities can follow one another. Changing a stop also keeps later days connected.",
              "Можно выбирать только связанные города. Изменение остановки сохраняет связность следующих дней.",
            )}
          </p>
          <div className="planner-route">
            {cities.map((city, i) => (
              <span key={i}>
                {i > 0 && <ArrowRight size={16} />}
                <span>{city}</span>
              </span>
            ))}
          </div>
          <Photo
            src={
              cities[active] === "Sheki" || cities[active] === "Gabala"
                ? "sheki"
                : cities[active] === "Baku"
                  ? "baku"
                  : "mountains"
            }
            alt={cities[active]}
            className="planner-photo"
          />
          <div className="planner-note">
            <ShieldCheck />
            <p>
              {tr(
                "The office team checks your route and availability before payment. Changes and cancellations are handled by an employee. Demo payments become available only after approval.",
                "Сотрудник проверяет маршрут и доступность до оплаты. Изменения и отмены обрабатывает офис. Демо-оплата доступна только после одобрения.",
              )}
            </p>
          </div>
        </div>
        <aside className="builder-aside">
          {ready && (
            <Builder
              tour={tours[1]}
              customDays={days}
              cities={cities}
              defaults={defaults}
            />
          )}
        </aside>
      </div>
    </section>
  );
}
function Contact({ request = false }: { request?: boolean }) {
  const { tr } = useEnv();
  const [sent, setSent] = useState(false);
  const [context, setContext] = useState("");
  useEffect(() => {
    if (request) {
      const p = new URLSearchParams(location.search);
      setContext(
        [
          p.get("date"),
          p.get("pax") ? p.get("pax") + " travellers" : "",
          p.get("route"),
        ]
          .filter(Boolean)
          .join(" · "),
      );
    }
  }, [request]);
  return (
    <section className="container page-content contact-page">
      <Heading
        side={
          <p>
            {tr(
              "A question, a group trip or a route you can’t stop thinking about?",
              "Вопрос, групповая поездка или маршрут, о котором мечтаете?",
            )}
          </p>
        }
      >
        {request
          ? tr("Let’s find", "Найдём")
          : tr("A real conversation.", "Живой разговор.")}
        <br />
        {request
          ? tr("your way.", "ваш путь.")
          : tr("A good beginning.", "Хорошее начало.")}
      </Heading>
      <div className="contact-grid">
        <div>
          <MessageCircle size={36} />
          <h3>{tr("Ask a local.", "Спросите местных.")}</h3>
          {context && <p className="request-context">{context}</p>}
          <p>
            {tr(
              "Tell us what you have in mind. The contact details and live enquiry service will be connected before launch.",
              "Расскажите, что вы задумали. Контакты и отправка запросов будут подключены перед запуском.",
            )}
          </p>
          <p className="muted">
            {tr(
              "Preview mode: this form stays in your browser and sends no messages.",
              "Демо-режим: форма остаётся в браузере и не отправляет сообщений.",
            )}
          </p>
          <Link to="/faq" className="text-link">
            {tr("You might find the answer here", "Возможно, ответ уже здесь")}
            <ArrowUpRight />
          </Link>
        </div>
        {sent ? (
          <div className="contact-success">
            <Check size={40} />
            <h3>{tr("That’s how it will feel.", "Вот как это будет.")}</h3>
            <p>
              {tr(
                "Demo form complete. Nothing was sent. In the live version, the team will respond within 24 hours.",
                "Демо-форма заполнена. Ничего не отправлено. После запуска команда ответит в течение 24 часов.",
              )}
            </p>
            <Btn secondary onClick={() => setSent(false)}>
              {tr("Back to form", "Вернуться к форме")}
            </Btn>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="form-grid">
              <label>
                {tr("Your name", "Ваше имя")}
                <input required minLength={2} maxLength={80} />
              </label>
              <label>
                {tr("Email address", "Электронная почта")}
                <input type="email" required />
              </label>
              <label className="full-width">
                {tr("What’s on your mind?", "О чём хотите спросить?")}
                <select defaultValue={request ? "custom" : "general"}>
                  <option value="general">
                    {tr("A general question", "Общий вопрос")}
                  </option>
                  <option value="custom">
                    {tr("A custom journey", "Индивидуальный маршрут")}
                  </option>
                  <option value="group">
                    {tr(
                      "Group or corporate trip",
                      "Групповая / корпоративная поездка",
                    )}
                  </option>
                  <option value="partner">
                    {tr("Partnership", "Партнёрство")}
                  </option>
                </select>
              </label>
              <label className="full-width">
                {tr("Your message", "Ваше сообщение")}
                <textarea rows={5} required maxLength={1000} />
              </label>
            </div>
            <Btn type="submit">
              {tr("Preview enquiry", "Проверить запрос")}
              <ArrowUpRight />
            </Btn>
          </form>
        )}
      </div>
    </section>
  );
}
function Services() {
  const { l, c, tr } = useEnv();
  const data = [
    [
      "transfer",
      Car,
      tr("Airport transfer", "Трансфер из аэропорта"),
      35,
      tr("per trip", "за поездку"),
    ],
    [
      "driver",
      Car,
      tr("Private driver", "Личный водитель"),
      90,
      tr("per day", "за день"),
    ],
    [
      "guide",
      Globe,
      tr("Local guide", "Местный гид"),
      65,
      tr("per day", "за день"),
    ],
    [
      "hotel",
      BedDouble,
      tr("A place to stay", "Проживание"),
      65,
      tr("per room / night", "за номер / ночь"),
    ],
    [
      "activity",
      Mountain,
      tr("Local craft experience", "Местный мастер-класс"),
      20,
      tr("per person", "за человека"),
    ],
  ];
  return (
    <section className="container page-content">
      <Heading
        side={
          <p>
            {tr(
              "Pick the pieces. Make them yours. Sample starting prices for planning.",
              "Выбирайте детали. Создавайте своё. Примерные стартовые цены.",
            )}
          </p>
        }
      >
        {tr("The details", "Детали, которые")}
        <br />
        {tr("make the journey.", "создают поездку.")}
      </Heading>
      <div className="services-list">
        {data.map(([id, Icon, title, price, unit]) => {
          const I = Icon as typeof Car;
          return (
            <div className="service-list-row" key={id as string}>
              <I size={30} />
              <div>
                <h3>{title as string}</h3>
                <p>{unit as string}</p>
              </div>
              <strong>
                {tr("From", "От")} {money((price as number) * rates[c], c, l)}
              </strong>
              <Link to={"/plan?services=" + id} className="text-link">
                {tr("Add to my trip", "В мой маршрут")}
                <Plus />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function Info({ type }: { type: string }) {
  const { tr } = useEnv();
  const legal = type.startsWith("legal/");
  const title =
    type === "about"
      ? tr("A local perspective.", "Местный взгляд.")
      : type === "how-it-works"
        ? tr("Less friction. More journey.", "Меньше забот. Больше поездок.")
        : type === "legal/cancellation"
          ? tr("Cancellation policy", "Условия отмены")
          : type === "legal/privacy"
            ? tr("Privacy, plainly.", "Просто о приватности.")
            : tr("Terms of use", "Условия использования");
  return (
    <section className="container page-content info-page">
      <h1>{title}</h1>
      {legal ? (
        <div className="prose">
          <p>
            <strong>
              {tr(
                "Draft for design review · updated 25 October 2026",
                "Черновик для просмотра дизайна · обновлено 25 октября 2026",
              )}
            </strong>
          </p>
          <p>
            {tr(
              "Development release: customer accounts and reservation requests are stored in the backend and reviewed by the office team. Prices and payments are demonstrations. No card details or real money are collected.",
              "Версия в разработке: аккаунты и запросы сохраняются на сервере и проверяются офисом. Цены и платежи демонстрационные. Карты и реальные деньги не принимаются.",
            )}
          </p>
          <h2>{tr("Before live bookings", "Перед запуском бронирований")}</h2>
          <p>
            {tr(
              "The operator’s legal identity, cancellation and refund schedule, contact details, payment terms and data retention policy must be finalised and displayed here. No unapproved refund percentages or business details are presented as final.",
              "Здесь будут опубликованы юридические данные оператора, правила отмены и возврата, контакты, условия оплаты и хранения данных. Неутверждённые условия не выдаются за окончательные.",
            )}
          </p>
          <h2>{tr("Your demo data", "Ваши демо-данные")}</h2>
          <p>
            {tr(
              "Account details, reservation notes and service choices are sent to the backend. Website sessions use an HttpOnly cookie; mobile sessions use secure device storage. Preferences stay locally. General contact forms are previews and do not send messages.",
              "Данные аккаунта, пожелания и услуги отправляются на сервер. На сайте используется HttpOnly cookie, на мобильном устройстве — защищённое хранилище. Настройки сохраняются локально. Общая контактная форма не отправляет сообщения.",
            )}
          </p>
          <Link to="/contact" className="text-link">
            {tr("Contact", "Контакты")}
            <ArrowUpRight />
          </Link>
        </div>
      ) : (
        <>
          <Photo
            src={type === "about" ? "village" : "mountains"}
            alt="Azerbaijan landscape"
            className="info-photo"
          />
          <div className="prose">
            <h2>
              {type === "about"
                ? tr(
                    "Azerbaijan, at your own pace.",
                    "Азербайджан в вашем ритме.",
                  )
                : tr("Choose. Shape. Go.", "Выбирайте. Создавайте. Поехали.")}
            </h2>
            <p>
              {type === "about"
                ? tr(
                    "Azertur is built around a simple idea: a journey should feel personal, and planning it should feel clear. We connect routes, stays, drivers, guides and experiences in one place, so you can decide what your Azerbaijan looks like.",
                    "Azertur строится на простой идее: путешествие должно быть личным, а планирование — понятным. Маршруты, отели, водители, гиды и впечатления собраны в одном месте.",
                  )
                : tr(
                    "Start with one of our sample itineraries or build a route day by day. Choose a date, travellers, hotel category, guide and extras. The quote shows each service, the total, a 30% deposit and the remaining balance.",
                    "Начните с готового маршрута или составьте программу по дням. Выберите дату, путешественников, отель, гида и дополнения. В расчёте видны услуги, общая сумма, депозит 30% и остаток.",
                  )}
            </p>
            <p>
              {tr(
                "Customer accounts and operator review are connected. Partner availability, final legal terms and live payments will be added before commercial launch.",
                "Аккаунты и проверка оператором подключены. Доступность партнёров, утверждённые условия и реальные платежи будут добавлены перед запуском.",
              )}
            </p>
            <Link to="/tours" className="button">
              {tr("Find your journey", "Найти маршрут")}
              <ArrowUpRight />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
function Credits() {
  const { tr } = useEnv();
  return (
    <section className="container page-content info-page">
      <h1>{tr("Photography credits", "Авторы фотографий")}</h1>
      <div className="prose">
        {[
          [
            "Tea_in_Azerbaijani_national_Armudu_glass.jpg",
            "Tea in Baku — Interfase",
            "by-sa/3.0",
            "CC BY-SA 3.0",
          ],
          [
            "Nohur_Lake,_Gabala.jpg",
            "Nohur Lake, Gabala — Nigar O.Mammadova",
            "by-sa/4.0",
            "CC BY-SA 4.0",
          ],
          [
            "Azerbajiani_landscape_-_Another_version.jpg",
            "Khinalug valley — Matthew Hadley / Ximonic, Simo Räsänen",
            "by/1.0",
            "CC BY 1.0",
          ],
          [
            "Azərbaycan,_Xınalıq._Azerbaijan,_Khinalug.jpg",
            "Khinalug village — Musa Abdulragimli",
            "by-sa/4.0",
            "CC BY-SA 4.0",
          ],
          [
            "Baku_Skyline.JPG",
            "Baku — Nenad Bumbić",
            "by-sa/4.0",
            "CC BY-SA 4.0",
          ],
          [
            "Sheki_Khan_Palace_-_panoramio.jpg",
            "Sheki — Michael Karavanov",
            "by-sa/3.0",
            "CC BY-SA 3.0",
          ],
        ].map(([file, name, license, label]) => (
          <p key={file}>
            <a href={"https://commons.wikimedia.org/wiki/File:" + file}>
              {name}
            </a>
            <br />
            <a href={"https://creativecommons.org/licenses/" + license + "/"}>
              {label}
            </a>{" "}
            · Resized, converted to WebP, and cropped for display.
          </p>
        ))}
      </div>
    </section>
  );
}
function NotFound() {
  const { tr } = useEnv();
  return (
    <section className="container page-content empty">
      <h1>{tr("A little off the map.", "Немного за пределами карты.")}</h1>
      <p>
        {tr(
          "We couldn’t find that page. Let’s find your next journey instead.",
          "Страница не найдена. Давайте найдём ваш следующий маршрут.",
        )}
      </p>
      <Link to="/tours" className="button">
        {tr("Explore journeys", "Посмотреть туры")}
        <ArrowUpRight />
      </Link>
    </section>
  );
}
export default function Site({ initialPath }: { initialPath: string }) {
  const [path, setPath] = useState(initialPath);
  const l: Locale =
    path.split("/")[1] === "ru"
      ? "ru"
      : path.split("/")[1] === "az"
        ? "az"
        : "en";
  const [c, setC] = useState<Currency>(l === "ru" ? "USD" : "EUR");
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<ReactNode>(null);
  const [cookie, setCookie] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const focusRef = useRef<HTMLElement | null>(null);
  const tr = (a: string, b: string) => translate(l, a, b);
  function go(p: string) {
    const next =
      p.startsWith("/en") || p.startsWith("/ru") || p.startsWith("/az")
        ? p
        : "/" + l + (p === "/" ? "" : p);
    history.pushState({}, "", next);
    setPath(next.split("?")[0]);
    setMenu(false);
    setModal(null);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    requestAnimationFrame(() =>
      document.getElementById("main")?.focus({ preventScroll: true }),
    );
  }
  useEffect(() => {
    setPath(location.pathname === "/" ? "/en" : location.pathname);
    try {
      const currency = localStorage.getItem("azertur-currency");
      if (currency && ["EUR", "USD", "AZN"].includes(currency))
        setC(currency as Currency);
      setCookie(!localStorage.getItem("azertur-consent"));
    } catch {}
    const pop = () => {
      setPath(location.pathname);
      setMenu(false);
      setModal(null);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    document.documentElement.lang = l;
    document.cookie = `NEXT_LOCALE=${l};path=/;max-age=31536000;SameSite=Lax`;
  }, [l]);
  useEffect(() => {
    if (modal) {
      focusRef.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      focusRef.current?.focus();
    }
  }, [modal]);
  useEffect(() => {
    if (menu) {
      focusRef.current = document.activeElement as HTMLElement;
      menuRef.current?.showModal();
    } else if (menuRef.current?.open) {
      menuRef.current.close();
      focusRef.current?.focus();
    }
  }, [menu]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [path]);
  const route = path.split("/").slice(2).join("/");
  useEffect(() => {
    const title = route.startsWith("tours/")
      ? tours.find((t) => t.slug === route.split("/")[1])?.name[
          l === "az" ? 2 : l === "en" ? 0 : 1
        ]
      : {
          tours: tr("Journeys", "Маршруты"),
          plan: tr("Build your journey", "Создать маршрут"),
          trips: tr("My trips", "Мои поездки"),
          contact: tr("Contact", "Контакты"),
          services: tr("Services", "Услуги"),
          faq: "FAQ",
          about: tr("Our story", "О нас"),
        }[route];
    document.title =
      (title ||
        (route === ""
          ? homeText(homeCopy.headline, l)
          : tr("Take the scenic route", "Выбирайте свой маршрут"))) +
      " — Azertur";
  }, [path, l]);
  const env: Env = {
    l,
    c,
    go,
    tr,
    fmt: (n) => money(n, c, l),
    modal: setModal,
    book: (q) => {
      try {
        sessionStorage.setItem("azertur-quote-" + q.id, JSON.stringify(q));
        go("/checkout/" + q.id);
      } catch {
        setModal(
          <p>
            {tr(
              "Allow session storage to preview checkout.",
              "Разрешите хранение данных сессии для проверки оформления.",
            )}
          </p>,
        );
      }
    },
  };
  function currency(value: Currency) {
    setC(value);
    try {
      localStorage.setItem("azertur-currency", value);
    } catch {}
  }
  function consent(value: string) {
    try {
      localStorage.setItem("azertur-consent", value);
    } catch {}
    setCookie(false);
  }
  let content: ReactNode =
    route === "" ? (
      <Home />
    ) : route === "tours" ? (
      <TourList />
    ) : route.startsWith("tours/") ? (
      <TourPage key={route} slug={route.split("/")[1]} />
    ) : route === "plan" ? (
      <Planner />
    ) : route === "checkout/result" ? (
      <CustomerTrips locale={l} go={go} />
    ) : route.startsWith("checkout/") ? (
      <BookingCheckout locale={l} go={go} quoteId={route.split("/")[1]} />
    ) : route === "trips" ? (
      <CustomerTrips locale={l} go={go} />
    ) : route === "services" ? (
      <Services />
    ) : route === "credits" ? (
      <Credits />
    ) : route === "faq" ? (
      <FAQ />
    ) : route === "contact" || route === "request" ? (
      <Contact request={route === "request"} />
    ) : [
        "about",
        "how-it-works",
        "legal/terms",
        "legal/privacy",
        "legal/cancellation",
      ].includes(route) ? (
      <Info type={route} />
    ) : route === "login" ? (
      <CustomerAuth locale={l} go={go} />
    ) : (
      <NotFound />
    );
  return (
    <Context.Provider value={env}>
      <div className={route === "" ? "homepage-shell" : "site-shell"}>
        <a href="#main" className="skip-link">
          {tr("Skip to content", "К содержимому")}
        </a>
        <header className="header-wrap">
          <div className="header container">
            <Link to="/" aria-label="Azertur home">
              <Logo />
            </Link>
            <nav aria-label={tr("Main navigation", "Главная навигация")}>
              {route === "" ? (
                <>
                  <Link to="/tours">
                    {homeText(["Tours", "Туры", "Turlar"], l)}
                  </Link>
                  <a href={"/" + l + "#destinations"}>
                    {homeText(
                      ["Destinations", "Направления", "İstiqamətlər"],
                      l,
                    )}
                  </a>
                  <Link to="/plan">
                    {homeText(
                      [
                        "Create your trip",
                        "Создать поездку",
                        "Öz səfərini yarat",
                      ],
                      l,
                    )}
                  </Link>
                  <Link to="/about">
                    {homeText(["About us", "О нас", "Haqqımızda"], l)}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/tours"
                    className={route.startsWith("tours") ? "active" : ""}
                  >
                    {tr("Journeys", "Маршруты")}
                  </Link>
                  <Link to="/plan" className={route === "plan" ? "active" : ""}>
                    {tr("Build your trip", "Создать маршрут")}
                  </Link>
                  <Link to="/how-it-works">
                    {tr("How it works", "Как это работает")}
                  </Link>
                </>
              )}
            </nav>
            <div className="header-controls">
              <label className="sr-only" htmlFor="currency">
                {tr("Currency", "Валюта")}
              </label>
              <select
                id="currency"
                value={c}
                onChange={(e) => currency(e.target.value as Currency)}
              >
                <option>EUR</option>
                <option>USD</option>
                <option>AZN</option>
              </select>
              <select
                className="language"
                aria-label={tr("Language", "Язык")}
                value={l}
                onChange={(e) =>
                  go("/" + e.target.value + "/" + route + location.search)
                }
              >
                <option value="en">EN</option>
                <option value="ru">RU</option>
                <option value="az">AZ</option>
              </select>
              <Link to="/trips" className="header-trip">
                {route === ""
                  ? homeText(["My account", "Мой аккаунт", "Hesabım"], l)
                  : tr("My trips", "Мои поездки")}
                <ArrowUpRight size={16} />
              </Link>
              <button
                className="menu-button"
                onClick={() => setMenu(true)}
                aria-label={tr("Open menu", "Открыть меню")}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </header>
        <main id="main" key={route} tabIndex={-1}>
          {content}
        </main>
        <footer className="footer">
          <div className="container">
            <div className="footer-top">
              <div>
                <Link to="/">
                  <Logo />
                </Link>
                <p>
                  {tr(
                    "Azerbaijan, at your own pace.",
                    "Азербайджан в вашем ритме.",
                  )}
                </p>
              </div>
              <div>
                <h4>{tr("Explore", "Откройте")}</h4>
                <Link to="/tours">{tr("Journeys", "Маршруты")}</Link>
                <Link to="/plan">
                  {tr("Build your trip", "Создать маршрут")}
                </Link>
                <Link to="/services">
                  {tr("Services & prices", "Услуги и цены")}
                </Link>
              </div>
              <div>
                <h4>{tr("A little more", "Ещё немного")}</h4>
                <Link to="/about">{tr("About Azertur", "Об Azertur")}</Link>
                <Link to="/faq">FAQ</Link>
                <Link to="/contact">{tr("Get in touch", "Связаться")}</Link>
              </div>
              <div>
                <h4>{tr("The details", "Детали")}</h4>
                <Link to="/legal/terms" target="_blank">
                  {tr("Terms", "Условия")}
                </Link>
                <Link to="/legal/cancellation" target="_blank">
                  {tr("Cancellation", "Отмена")}
                </Link>
                <Link to="/legal/privacy">{tr("Privacy", "Приватность")}</Link>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 Azertur</span>
              <span>
                {tr(
                  "Interactive preview · sample itineraries · no real payments",
                  "Интерактивное демо · примерные маршруты · без реальных платежей",
                )}
              </span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                {tr("Back to top", "Наверх")}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <details className="photo-credits">
              <summary>
                {tr("Photography credits", "Авторы фотографий")}
                <Plus size={12} />
              </summary>
              <p>
                Khinalug valley:{" "}
                <a
                  href="https://commons.wikimedia.org/wiki/File:Azerbajiani_landscape_-_Another_version.jpg"
                  target="_blank"
                  rel="noreferrer"
                >
                  Matthew Hadley / Ximonic, Simo Räsänen
                </a>{" "}
                ·{" "}
                <a href="https://creativecommons.org/licenses/by/1.0/">
                  CC BY 1.0
                </a>
                . Village:{" "}
                <a href="https://commons.wikimedia.org/wiki/File:Az%C9%99rbaycan,_X%C4%B1nal%C4%B1q._Azerbaijan,_Khinalug.jpg">
                  Musa Abdulragimli
                </a>{" "}
                ·{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/">
                  CC BY-SA 4.0
                </a>
                . Baku & Sheki: <Link to="/credits">full photo credits</Link>.
                Tea and Nohur Lake:{" "}
                <Link to="/credits">full photo credits</Link>. All photos
                resized, converted to WebP and cropped in layouts.
              </p>
            </details>
          </div>
        </footer>
        <button
          className="contact-float"
          onClick={() => go("/contact")}
          aria-label={tr(
            "Ask a local — contact Azertur",
            "Связаться с Azertur",
          )}
        >
          <MessageCircle size={22} />
          <span>{tr("Ask a local", "Спросите местных")}</span>
        </button>
        {cookie && (
          <div className="cookie-banner">
            <p>
              {tr("A small note on cookies.", "Немного о cookies.")}
              <small>
                {tr(
                  "We remember your language and currency. No analytics are loaded in this preview.",
                  "Мы запоминаем язык и валюту. В демо аналитика не загружается.",
                )}
              </small>
            </p>
            <div>
              <button onClick={() => consent("essential")}>
                {tr("Essential only", "Только необходимые")}
              </button>
              <Btn onClick={() => consent("accepted")}>
                {tr("Got it", "Понятно")}
                <Check size={16} />
              </Btn>
            </div>
          </div>
        )}
        <dialog
          ref={dialog}
          className="app-dialog"
          onCancel={() => setModal(null)}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              const r = e.currentTarget.getBoundingClientRect();
              if (
                e.clientX < r.left ||
                e.clientX > r.right ||
                e.clientY < r.top ||
                e.clientY > r.bottom
              )
                setModal(null);
            }
          }}
        >
          <button
            className="dialog-close icon-button"
            aria-label={tr("Close dialog", "Закрыть")}
            onClick={() => setModal(null)}
          >
            <X />
          </button>
          {modal}
        </dialog>
        <dialog
          ref={menuRef}
          className="menu-dialog"
          onCancel={() => setMenu(false)}
        >
          <div className="menu-top">
            <Logo />
            <button
              aria-label={homeText(
                ["Close menu", "Закрыть меню", "Menyunu bağla"],
                l,
              )}
              onClick={() => setMenu(false)}
              className="icon-button"
            >
              <X />
            </button>
          </div>
          <nav>
            {[
              ["/tours", tr("Journeys", "Маршруты")],
              ["/plan", tr("Build your trip", "Создать маршрут")],
              ["/services", tr("Services", "Услуги")],
              ["/about", tr("Our story", "О нас")],
              ["/faq", "FAQ"],
              ["/contact", tr("Get in touch", "Связаться")],
            ].map(([to, label], i) => (
              <Link key={to} to={to}>
                <span>0{i + 1}</span>
                {label}
                <ArrowUpRight />
              </Link>
            ))}
          </nav>
          <div className="menu-bottom">
            <Link to="/trips">
              {tr("My trips", "Мои поездки")}
              <ArrowUpRight />
            </Link>
            <span>
              {tr(
                "Azerbaijan, at your own pace.",
                "Азербайджан в вашем ритме.",
              )}
            </span>
          </div>
        </dialog>
      </div>
    </Context.Provider>
  );
}
