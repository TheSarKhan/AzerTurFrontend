"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Plus,
  Minus,
  X,
  Pencil,
  Car,
  BedDouble,
  Users,
  Plane,
  Flower2,
  Link as LinkIcon,
} from "lucide-react";
import { RouteMap, type RouteStop } from "./route-map";
import { places } from "@/lib/places";
import {
  tours,
  transitions,
  dateLimit,
  type Locale,
  type Currency,
  type Quote,
  type QuoteInput,
} from "@/lib/travel";
const templates: Record<string, string[]> = {
  "baku-discovery": ["Baku"],
  "quba-khinalug": ["Quba", "Khinalug"],
  "sheki-gabala": ["Baku", "Gabala", "Sheki"],
};
const photo = (city: string) =>
  city === "Baku"
    ? "baku"
    : city === "Gabala"
      ? "gabala"
      : city === "Sheki"
        ? "sheki"
        : "khinalug";
const MAX_DAYS = 14;
const valid = (route: string[]) =>
  route.length > 0 &&
  route.length <= MAX_DAYS &&
  route.every(
    (city, i) =>
      Object.hasOwn(transitions, city) &&
      (i === 0 || transitions[route[i - 1]].includes(city)),
  );
// The route is stored one city per day (it is also what the quote API and share links use);
// the form works with stops: a destination and how many days are spent there.
const toStops = (route: string[]) =>
  route.reduce<RouteStop[]>((all, city) => {
    const last = all[all.length - 1];
    if (last && last.city === city) last.days++;
    else all.push({ city, days: 1 });
    return all;
  }, []);
const toRoute = (stops: RouteStop[]) =>
  stops.flatMap((s) => Array<string>(s.days).fill(s.city));
const keys = ["driver", "stay", "guide", "transfer", "activity"] as const;

export default function TripPlanner({
  locale: l,
  currency: c,
  go,
  book,
}: {
  locale: Locale;
  currency: Currency;
  go: (p: string) => void;
  book: (q: Quote) => void;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const idx = l === "az" ? 2 : l === "ru" ? 1 : 0;
  const cityName = (city: string) => places[city]?.name[idx] ?? city;
  const [route, setRoute] = useState<string[]>([]),
    [ready, setReady] = useState(false);
  const [input, setInput] = useState<QuoteInput>({
    slug: "quba-khinalug",
    date: "",
    pax: 2,
    hotel: "comfort",
    driver: true,
    stay: true,
    guide: true,
    guideLanguage: l,
    transfer: true,
    activity: true,
    currency: c,
  });
  const [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [notice, setNotice] = useState(""),
    [notes, setNotes] = useState(""),
    [shared, setShared] = useState("");
  const [dialog, setDialog] = useState<"stop" | "tours" | null>(null),
    [draft, setDraft] = useState<{ index: number; city: string; days: number }>({
      index: 0,
      city: "",
      days: 1,
    }),
    [chosen, setChosen] = useState<string[]>([]),
    [search, setSearch] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    returnFocus = useRef<HTMLElement | null>(null);
  const stops = toStops(route),
    days = route.length,
    nights = Math.max(0, days - 1);
  const dateProblem =
    !!input.date &&
    (input.date < dateLimit(3) || input.date > dateLimit(365));
  const labels = {
    driver: t(
      "Private car & driver",
      "Автомобиль с водителем",
      "Şəxsi avtomobil və sürücü",
    ),
    stay: t("Accommodation", "Проживание", "Qalma yeri"),
    guide: t("Local guide", "Местный гид", "Yerli gid"),
    transfer: t(
      "Airport transfer",
      "Трансфер из аэропорта",
      "Hava limanı transferi",
    ),
    activity: t(
      "Local craft experience",
      "Местный мастер-класс",
      "Yerli sənətkarlıq təcrübəsi",
    ),
  };
  const hints = {
    driver: t(
      "A private car with a driver every day",
      "Личный автомобиль с водителем каждый день",
      "Hər gün sürücülü şəxsi avtomobil",
    ),
    stay: t(
      "Our team confirms the property",
      "Отель подтвердит наша команда",
      "Oteli komandamız təsdiqləyir",
    ),
    guide: t(
      "A local guide for the whole trip",
      "Местный гид на всё путешествие",
      "Bütün səfər boyu yerli gid",
    ),
    transfer: t(
      "Pick-up on arrival",
      "Встреча по прилёту",
      "Gəlişdə qarşılanma",
    ),
    activity: t(
      "A hands-on workshop with local makers",
      "Мастер-класс у местных мастеров",
      "Yerli ustalarla praktik təcrübə",
    ),
  };
  const selected = keys.filter(
    (key) => input[key] && (key !== "stay" || nights > 0),
  );
  const icons = {
    driver: Car,
    stay: BedDouble,
    guide: Users,
    transfer: Plane,
    activity: Flower2,
  };
  const hotels = {
    standard: t("Standard", "Стандарт", "Standart"),
    comfort: t("Comfort", "Комфорт", "Komfort"),
    premium: t("Premium", "Премиум", "Premium"),
  };
  const langNames: Record<Locale, string> = {
    en: "English",
    ru: "Русский",
    az: "Azərbaycanca",
  };
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const template = templates[p.get("template") || ""];
    const saved = p.get("route")?.split(",");
    if (saved && valid(saved)) setRoute(saved);
    else if (template) setRoute(template);
    setInput((s) => {
      const next = {
        ...s,
        date: p.get("date") || "",
        pax: Math.max(1, Math.min(12, Number(p.get("pax")) || 2)),
      };
      for (const key of keys) {
        if (p.has(key)) next[key] = p.get(key) !== "false";
        else if (p.has("services"))
          next[key] = (p.get("services") || "")
            .split(",")
            .includes(key === "stay" ? "hotel" : key);
      }
      if (["standard", "comfort", "premium"].includes(p.get("hotel") || ""))
        next.hotel = p.get("hotel") as QuoteInput["hotel"];
      if (["en", "ru", "az"].includes(p.get("guideLanguage") || ""))
        next.guideLanguage = p.get("guideLanguage") as Locale;
      return next;
    });
    try {
      setNotes(sessionStorage.getItem("azertur-planner-notes") || "");
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    p.set("route", route.join(","));
    for (const key of [
      "date",
      "pax",
      "hotel",
      "guideLanguage",
      ...keys,
    ] as const)
      p.set(key, String(input[key] ?? ""));
    const url = location.pathname + "?" + p;
    history.replaceState({}, "", url);
    try {
      sessionStorage.setItem("azertur-draft-url", url);
      sessionStorage.setItem("azertur-planner-notes", notes);
    } catch {}
  }, [ready, route, input, notes]);
  // The server still prices the request internally; the customer never sees amounts here.
  useEffect(() => {
    setQuote(null);
    setError("");
    if (!ready || !input.date || dateProblem || !selected.length || !route.length) {
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            stay: input.stay && nights > 0,
            currency: c,
            customDays: days,
            cities: route,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw Error();
        const data = await response.json();
        if (!controller.signal.aborted) {
          setQuote(data);
          setBusy(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setBusy(false);
          setError(
            t(
              "Could not prepare your request. Retry or write to our team.",
              "Не удалось подготовить заявку. Повторите или напишите нам.",
              "Sorğunu hazırlamaq olmadı. Yenidən yoxlayın və ya bizə yazın.",
            ),
          );
        }
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ready, input, c, route, retry, l]);
  useEffect(() => {
    const el = dialogRef.current;
    if (dialog && el && !el.open) el.showModal();
  }, [dialog]);
  function open(kind: "stop" | "tours") {
    returnFocus.current = document.activeElement as HTMLElement;
    setSearch("");
    setNotice("");
    setDialog(kind);
  }
  function close() {
    dialogRef.current?.close();
    setDialog(null);
    returnFocus.current?.focus();
  }
  function change<K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) {
    setQuote(null);
    setInput((s) => ({ ...s, [key]: value }));
  }
  // Destinations a stop at this position may take: anything except a neighbour's destination
  // (that would just be more days at the same place).
  function options(index: number) {
    const before = stops[index - 1]?.city,
      after = index < stops.length ? stops[index + 1]?.city : undefined;
    return Object.keys(transitions).filter(
      (city) =>
        (!before || (city !== before && transitions[before].includes(city))) &&
        (!after || (city !== after && transitions[city].includes(after))),
    );
  }
  function daysLeft(index: number) {
    return MAX_DAYS - (days - (stops[index]?.days ?? 0));
  }
  function openStop(index: number) {
    const existing = stops[index];
    const first = options(index)[0] ?? "";
    setDraft({
      index,
      city: existing ? existing.city : first,
      days: existing ? existing.days : 1,
    });
    open("stop");
  }
  function mergeNeighbours(list: RouteStop[]) {
    return list.reduce<RouteStop[]>((all, s) => {
      const last = all[all.length - 1];
      if (last && last.city === s.city) last.days += s.days;
      else all.push({ ...s });
      return all;
    }, []);
  }
  function saveStop() {
    const next = stops.map((s) => ({ ...s }));
    if (draft.index >= next.length) next.push({ city: draft.city, days: draft.days });
    else next[draft.index] = { city: draft.city, days: draft.days };
    const route2 = toRoute(next);
    if (!valid(route2)) return;
    setQuote(null);
    setRoute(route2);
    close();
  }
  function stopsWithout(index: number) {
    return mergeNeighbours(stops.filter((_, i) => i !== index));
  }
  const canRemove = (index: number) =>
    stops.length > 1 && valid(toRoute(stopsWithout(index)));
  function removeStop(index: number) {
    if (!canRemove(index)) return;
    setQuote(null);
    setRoute(toRoute(stopsWithout(index)));
  }
  function applyTours() {
    const next = chosen.flatMap((slug) => templates[slug] || []);
    if (!valid(next)) {
      setNotice(
        t(
          "A trip can be 14 days at most. Remove a tour from your selection.",
          "Поездка длится не более 14 дней. Уберите один из туров.",
          "Səfər ən çox 14 gün ola bilər. Seçimdən bir turu çıxarın.",
        ),
      );
      return;
    }
    setQuote(null);
    setRoute(next);
    setNotice("");
    close();
  }
  async function share() {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShared(t("Link copied", "Ссылка скопирована", "Link kopyalandı"));
    } catch {
      setShared(url);
    }
  }
  function review() {
    if (!formRef.current?.reportValidity()) return;
    if (!quote || busy) return;
    try {
      sessionStorage.setItem("azertur-planner-notes-" + quote.id, notes);
    } catch {}
    book(quote);
  }
  const action = t(
    "Send to our team",
    "Отправить команде",
    "Komandaya göndər",
  );
  const dayWord = (n: number) =>
    n === 1 ? t("day", "день", "gün") : t("days", "дн.", "gün");
  const dayRange = (index: number) => {
    const from = stops.slice(0, index).reduce((n, s) => n + s.days, 0) + 1,
      to = from + stops[index].days - 1;
    return from === to ? `${t("Day", "День", "Gün")} ${from}` : `${t("Days", "Дни", "Günlər")} ${from}–${to}`;
  };
  const choices = options(draft.index);
  const submitDisabled =
    busy ||
    !selected.length ||
    !route.length ||
    dateProblem ||
    (!quote && !!input.date);
  return (
    <section className="trip-planner">
      <div className="tp-container">
        <p className="tp-breadcrumb">
          <a
            href={"/" + l + "/"}
            onClick={(e) => {
              e.preventDefault();
              go("/");
            }}
          >
            {t("Home", "Главная", "Ana səhifə")}
          </a>{" "}
          / {t("Create your trip", "Создать маршрут", "Səfərini qur")}
        </p>
        <header className="tp-heading">
          <div>
            <h1>
              {t(
                "Your trip. Your choices.",
                "Ваш маршрут. Ваш выбор.",
                "Sənin səfərin. Sənin seçimin.",
              )}
            </h1>
            <p>
              {t(
                "Pick the route and what you need. Our team replies with a personal offer.",
                "Выберите маршрут и нужные услуги. Команда пришлёт персональное предложение.",
                "Marşrutu və lazım olanları seç. Komandamız fərdi təklif göndərəcək.",
              )}
            </p>
          </div>
          <div>
            <button type="button" onClick={() => open("tours")}>
              {t(
                "Start with a ready-made tour",
                "Начать с готового тура",
                "Hazır turla başla",
              )}{" "}
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setQuote(null);
                setRoute([]);
                setNotice("");
              }}
            >
              {t("Start from scratch", "Начать с нуля", "Sıfırdan başla")}
            </button>
          </div>
        </header>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            review();
          }}
        >
          <div className="tpx-layout">
            <div className="tpx-card">
              <section className="tpx-basics">
                <label>
                  {t("Start date", "Дата начала", "Başlama tarixi")}
                  <input
                    required
                    type="date"
                    min={dateLimit(3)}
                    max={dateLimit(365)}
                    value={input.date}
                    onChange={(e) => change("date", e.target.value)}
                    aria-invalid={dateProblem}
                    aria-describedby={dateProblem ? "date-problem" : undefined}
                  />
                  {dateProblem && (
                    <small id="date-problem" role="alert" className="tpx-field-error">
                      {t(
                        "The start date must be between 3 and 365 days from today.",
                        "Дата начала должна быть от 3 до 365 дней от сегодняшнего дня.",
                        "Səfər tarixi cari gündən ən azı 3 gün, ən çoxu 365 gün sonra olmalıdır.",
                      )}
                    </small>
                  )}
                </label>
                <label>
                  {t("Travelers", "Путешественники", "Səyahətçilər")}
                  <select
                    value={input.pax}
                    onChange={(e) => change("pax", Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1} {t("traveler(s)", "чел.", "nəfər")}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="tpx-length">
                  <strong>
                    {days} {dayWord(days)}
                  </strong>
                  <span>
                    {nights} {t("night(s)", "ноч.", "gecə")}
                  </span>
                </p>
              </section>
              <section className="tpx-route" aria-labelledby="tpx-route">
                <div>
                  <h2 id="tpx-route">{t("Route", "Маршрут", "Marşrut")}</h2>
                  <ol className="tpx-stops">
                    {stops.map((stop, i) => (
                      <li key={i}>
                        <b aria-hidden="true">{i + 1}</b>
                        <div>
                          <strong>{cityName(stop.city)}</strong>
                          <small>
                            {dayRange(i)} · {stop.days} {dayWord(stop.days)}
                          </small>
                        </div>
                        <button
                          type="button"
                          aria-label={`${t("Edit", "Изменить", "Dəyiş")}: ${cityName(stop.city)}`}
                          onClick={() => openStop(i)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${t("Remove", "Убрать", "Sil")}: ${cityName(stop.city)}`}
                          disabled={!canRemove(i)}
                          onClick={() => removeStop(i)}
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ol>
                  {!stops.length && (
                    <p className="tpx-empty">
                      {t(
                        "No stops yet. Add the places you want to visit.",
                        "Остановок пока нет. Добавьте места, которые хотите посетить.",
                        "Hələ dayanacaq yoxdur. Getmək istədiyin yerləri əlavə et.",
                      )}
                    </p>
                  )}
                  <button
                    type="button"
                    className="tpx-add"
                    disabled={days >= MAX_DAYS || !options(stops.length).length}
                    onClick={() => openStop(stops.length)}
                  >
                    <Plus size={16} />
                    {t("Add a stop", "Добавить остановку", "Dayanacaq əlavə et")}
                  </button>
                  {notice && !dialog && <p role="status">{notice}</p>}
                  <small className="tpx-return">
                    {t(
                      "Your return route is arranged with our team.",
                      "Обратный маршрут согласуется с командой.",
                      "Geri dönüş marşrutu komandamızla razılaşdırılır.",
                    )}
                  </small>
                </div>
                <RouteMap
                  stops={stops}
                  name={cityName}
                  label={
                    t("Route: ", "Маршрут: ", "Marşrut: ") +
                    stops.map((s) => cityName(s.city)).join(" → ")
                  }
                />
              </section>
              <section aria-labelledby="tpx-services">
                <h2 id="tpx-services">
                  {t("What do you need?", "Что вам нужно?", "Nələr lazımdır?")}
                </h2>
                <div className="tpx-services">
                  {keys.map((key) => {
                    const Icon = icons[key];
                    const off = key === "stay" && nights === 0;
                    return (
                      <div
                        className={"tpx-service" + (input[key] && !off ? " on" : "")}
                        key={key}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={!!input[key] && !off}
                            disabled={off}
                            onChange={(e) => change(key, e.target.checked)}
                          />
                          <Icon size={20} aria-hidden="true" />
                          <span>
                            <strong>{labels[key]}</strong>
                            <small>
                              {off
                                ? t(
                                    "Needs a trip of two days or more",
                                    "Нужна поездка от двух дней",
                                    "İki gün və daha uzun səfər lazımdır",
                                  )
                                : hints[key]}
                            </small>
                          </span>
                        </label>
                        {key === "stay" && input.stay && !off && (
                          <select
                            aria-label={t("Accommodation category", "Категория проживания", "Qalma yerinin kateqoriyası")}
                            value={input.hotel}
                            onChange={(e) =>
                              change("hotel", e.target.value as QuoteInput["hotel"])
                            }
                          >
                            {Object.entries(hotels).map(([value, name]) => (
                              <option key={value} value={value}>
                                {name}
                              </option>
                            ))}
                          </select>
                        )}
                        {key === "guide" && input.guide && (
                          <select
                            aria-label={t("Guide language", "Язык гида", "Gid dili")}
                            value={input.guideLanguage}
                            onChange={(e) =>
                              change("guideLanguage", e.target.value as Locale)
                            }
                          >
                            {(Object.keys(langNames) as Locale[]).map((code) => (
                              <option key={code} value={code}>
                                {langNames[code]}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="tpx-notes">
                <label>
                  {t(
                    "Anything else we should know?",
                    "Что ещё нам нужно знать?",
                    "Əlavə nəyi bilməliyik?",
                  )}
                  <textarea
                    value={notes}
                    maxLength={2000}
                    rows={2}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t(
                      "Your pace, luggage or accessibility needs…",
                      "Темп, багаж, особые потребности…",
                      "Səfər tempi, baqaj və ya əlçatanlıq ehtiyacları…",
                    )}
                  />
                </label>
                <a
                  href={"/" + l + "/request"}
                  onClick={(e) => {
                    e.preventDefault();
                    go("/request" + location.search);
                  }}
                >
                  {t(
                    "Need flights or visa support? Tell our team →",
                    "Нужны билеты или виза? Напишите нам →",
                    "Bilet və ya viza dəstəyi lazımdır? Bizə yaz →",
                  )}
                </a>
              </section>
            </div>
            <aside className="tpx-aside">
              <h2>{t("Your request", "Ваша заявка", "Sənin sorğun")}</h2>
              <p className="tpx-route-line">
                {stops.length ? (
                  stops.map((s) => cityName(s.city)).join(" → ")
                ) : (
                  <em>{t("Add your first stop", "Добавьте первую остановку", "İlk dayanacağı əlavə et")}</em>
                )}
              </p>
              <dl>
                <div>
                  <dt>{t("Dates", "Даты", "Tarix")}</dt>
                  <dd>
                    {input.date || (
                      <em>{t("Choose a start date", "Выберите дату", "Başlama tarixini seç")}</em>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t("Length", "Длительность", "Müddət")}</dt>
                  <dd>
                    {days} {dayWord(days)} · {nights} {t("night(s)", "ноч.", "gecə")}
                  </dd>
                </div>
                <div>
                  <dt>{t("Travelers", "Путешественники", "Səyahətçilər")}</dt>
                  <dd>{input.pax}</dd>
                </div>
              </dl>
              <ul className="tpx-picked">
                {selected.map((key) => {
                  const Icon = icons[key];
                  const extra =
                    key === "stay"
                      ? hotels[input.hotel]
                      : key === "guide"
                        ? langNames[input.guideLanguage as Locale]
                        : "";
                  return (
                    <li key={key}>
                      <Icon size={16} aria-hidden="true" />
                      {labels[key]}
                      {extra && <small>{extra}</small>}
                    </li>
                  );
                })}
                {!selected.length && (
                  <li>
                    <em>{t("No services selected", "Услуги не выбраны", "Xidmət seçilməyib")}</em>
                  </li>
                )}
              </ul>
              <button className="tp-primary" type="submit" disabled={submitDisabled}>
                {busy ? t("Preparing…", "Готовим…", "Hazırlanır…") : action}
                <ArrowRight size={18} />
              </button>
              <small>
                {t(
                  "No payment now. Our team checks availability and replies with an offer. You sign in to send it.",
                  "Оплата сейчас не нужна. Команда проверит доступность и пришлёт предложение. Для отправки нужен вход.",
                  "İndi ödəniş yoxdur. Komandamız mövcudluğu yoxlayıb təklif göndərəcək. Göndərmək üçün daxil olursan.",
                )}
              </small>
              {error && (
                <div role="status">
                  <p>{error}</p>
                  <button type="button" onClick={() => setRetry((x) => x + 1)}>
                    {t("Retry", "Повторить", "Yenidən yoxla")}
                  </button>{" "}
                  ·{" "}
                  <a
                    href={
                      "/" +
                      l +
                      "/request" +
                      (typeof window !== "undefined" ? location.search : "")
                    }
                  >
                    {t("Write to our team", "Написать команде", "Komandaya yaz")}
                  </a>
                </div>
              )}
              <button type="button" className="tpx-share" onClick={share}>
                <LinkIcon size={16} />
                {t("Copy plan link", "Скопировать ссылку", "Plan linkini kopyala")}
              </button>
              {shared && <output className="tpx-shared">{shared}</output>}
            </aside>
          </div>
        </form>
        <div className="tp-faq">
          <h2>{t("Good to know", "Полезно знать", "Bilmək faydalıdır")}</h2>
          {[
            [
              t(
                "Can I change these choices later?",
                "Можно изменить выбор?",
                "Seçimləri sonra dəyişə bilərəm?",
              ),
              t(
                "Yes. Our office team handles changes to your request.",
                "Да. Изменения обрабатывает офисная команда.",
                "Bəli. Sorğudakı dəyişiklikləri ofis komandamız idarə edir.",
              ),
            ],
            [
              t(
                "How do payments work?",
                "Как проходит оплата?",
                "Ödəniş necə işləyir?",
              ),
              t(
                "After our offer and contract approval, a deposit is requested. Later payments follow the services.",
                "После предложения и одобрения договора запрашивается депозит. Следующие платежи зависят от услуг.",
                "Təklif və müqavilə təsdiqindən sonra beh tələb olunur. Sonrakı ödənişlər xidmətlərə görə istənilir.",
              ),
            ],
            [
              t(
                "Changes and cancellation",
                "Изменения и отмена",
                "Dəyişiklik və ləğv",
              ),
              t(
                "Terms vary by service, provider and cancellation time. Our team reviews each request.",
                "Условия зависят от услуги, поставщика и времени отмены. Команда рассмотрит запрос.",
                "Şərtlər xidmət, təchizatçı və ləğv vaxtından asılıdır. Hər sorğu komandamız tərəfindən yoxlanılır.",
              ),
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
        <div className="tpx-mobile-action">
          <span>
            {days} {dayWord(days)} · {selected.length}{" "}
            {t("services", "услуг", "xidmət")}
          </span>
          <button
            className="tp-primary"
            disabled={submitDisabled}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {action}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      {dialog && (
        <dialog
          ref={dialogRef}
          className="tp-dialog"
          aria-label={
            dialog === "stop"
              ? draft.index >= stops.length
                ? t("Add a stop", "Добавить остановку", "Dayanacaq əlavə et")
                : t("Edit the stop", "Изменить остановку", "Dayanacağı dəyiş")
              : t(
                  "Add tours to your route",
                  "Добавьте туры в маршрут",
                  "Marşrutuna turlar əlavə et",
                )
          }
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <button
            type="button"
            className="tp-close"
            aria-label={t("Close", "Закрыть", "Bağla")}
            onClick={close}
          >
            <X />
          </button>
          {dialog === "stop" ? (
            <>
              <h2>
                {draft.index >= stops.length
                  ? t("Add a stop", "Добавить остановку", "Dayanacaq əlavə et")
                  : t("Edit the stop", "Изменить остановку", "Dayanacağı dəyiş")}
              </h2>
              <p>
                {t(
                  "Choose where you go next and how many days you stay. Our team arranges the transfers.",
                  "Выберите, куда едете дальше и сколько дней остаётесь. Переезды организует команда.",
                  "Növbəti istiqaməti və orada neçə gün qalacağını seç. Yerdəyişmələri komandamız təşkil edir.",
                )}
              </p>
              {choices.length ? (
                <div className="tpx-choices" role="radiogroup" aria-label={t("Destination", "Направление", "İstiqamət")}>
                  {choices.map((city) => (
                    <label key={city} className={draft.city === city ? "on" : ""}>
                      <input
                        type="radio"
                        name="stop-city"
                        checked={draft.city === city}
                        onChange={() => setDraft((d) => ({ ...d, city }))}
                      />
                      <strong>{cityName(city)}</strong>
                      <small>{places[city]?.note[idx]}</small>
                    </label>
                  ))}
                </div>
              ) : (
                <p role="status">
                  {t(
                    "No other destination is available here.",
                    "Других направлений здесь нет.",
                    "Burada başqa istiqamət yoxdur.",
                  )}
                </p>
              )}
              <div className="tpx-days">
                <span>{t("Days at this stop", "Дней на остановке", "Bu dayanacaqda neçə gün")}</span>
                <div className="tp-stepper">
                  <button
                    type="button"
                    disabled={draft.days <= 1}
                    aria-label={t("Fewer days", "Меньше дней", "Daha az gün")}
                    onClick={() => setDraft((d) => ({ ...d, days: d.days - 1 }))}
                  >
                    <Minus size={16} />
                  </button>
                  <output>
                    {draft.days} {dayWord(draft.days)}
                  </output>
                  <button
                    type="button"
                    disabled={draft.days >= daysLeft(draft.index)}
                    aria-label={t("More days", "Больше дней", "Daha çox gün")}
                    onClick={() => setDraft((d) => ({ ...d, days: d.days + 1 }))}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <small>
                  {t("Up to", "Всего до", "Ümumilikdə")} {MAX_DAYS} {t("days in total", "дней", "günədək")}
                </small>
              </div>
              <div className="tp-dialog-actions">
                <span>
                  {draft.city ? cityName(draft.city) : "—"} · {draft.days} {dayWord(draft.days)}
                </span>
                <button
                  type="button"
                  className="tp-primary"
                  disabled={!draft.city || !choices.includes(draft.city)}
                  onClick={saveStop}
                >
                  {draft.index >= stops.length
                    ? t("Add to route", "Добавить в маршрут", "Marşruta əlavə et")
                    : t("Save", "Сохранить", "Yadda saxla")}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>
                {t(
                  "Add tours to your route",
                  "Добавьте туры в маршрут",
                  "Marşrutuna turlar əlavə et",
                )}
              </h2>
              <p>
                {t(
                  "Start with one or combine a few. Make each day yours.",
                  "Выберите один или объедините несколько.",
                  "Birini seç və ya bir neçəsini birləşdir.",
                )}
              </p>
              <input
                type="search"
                aria-label={t("Search tours", "Поиск туров", "Tur axtar")}
                placeholder={t(
                  "Search tours or destinations",
                  "Туры и направления",
                  "Tur və ya istiqamət axtar",
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {tours
                .filter((tour) =>
                  (tour.name.join(" ") + templates[tour.slug].join(" "))
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((tour) => (
                  <label className="tp-tour-option" key={tour.slug}>
                    <input
                      type="checkbox"
                      checked={chosen.includes(tour.slug)}
                      onChange={(e) => {
                        setNotice("");
                        setChosen((s) =>
                          e.target.checked
                            ? [...s, tour.slug]
                            : s.filter((x) => x !== tour.slug),
                        );
                      }}
                    />
                    <Image
                      src={
                        "/images/homepage-v3/" +
                        photo(templates[tour.slug].at(-1)!) +
                        ".webp"
                      }
                      alt=""
                      width={150}
                      height={100}
                    />
                    <div>
                      <strong>
                        {tour.name[l === "az" ? 2 : l === "ru" ? 1 : 0]}
                      </strong>
                      <small>
                        {templates[tour.slug].join(" · ")} · {tour.days}{" "}
                        {t("days", "дн.", "gün")}
                      </small>
                    </div>
                  </label>
                ))}
              <h3>
                {t(
                  "Your route order",
                  "Порядок маршрута",
                  "Marşrut ardıcıllığın",
                )}
              </h3>
              {chosen.map((slug, i) => (
                <div className="tp-order" key={slug}>
                  <span>
                    {i + 1}. {templates[slug].join(" → ")}
                  </span>
                  <button
                    disabled={!i}
                    aria-label={t("Move up", "Вверх", "Yuxarı")}
                    onClick={() =>
                      setChosen((s) => {
                        const a = [...s];
                        [a[i - 1], a[i]] = [a[i], a[i - 1]];
                        return a;
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    disabled={i === chosen.length - 1}
                    aria-label={t("Move down", "Вниз", "Aşağı")}
                    onClick={() =>
                      setChosen((s) => {
                        const a = [...s];
                        [a[i + 1], a[i]] = [a[i], a[i + 1]];
                        return a;
                      })
                    }
                  >
                    ↓
                  </button>
                </div>
              ))}
              <p>
                {t(
                  "Combine as many tours as you like; our team arranges the transfers between them.",
                  "Объединяйте любое число туров; переезды между ними организует команда.",
                  "İstədiyin qədər turu birləşdirə bilərsən; aralarındakı yerdəyişmələri komandamız təşkil edir.",
                )}
              </p>
              {notice && <p role="status">{notice}</p>}
              <div className="tp-dialog-actions">
                <span>
                  {chosen.length} {t("tour(s)", "тур.", "tur")} ·{" "}
                  {chosen.flatMap((s) => templates[s]).length}{" "}
                  {t("days", "дн.", "gün")}
                </span>
                <button
                  className="tp-primary"
                  disabled={!chosen.length}
                  onClick={applyTours}
                >
                  {t(
                    "Add selected tours",
                    "Добавить туры",
                    "Seçilmiş turları əlavə et",
                  )}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </dialog>
      )}
    </section>
  );
}
