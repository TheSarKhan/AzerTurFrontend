"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Plus,
  Minus,
  X,
  Car,
  BedDouble,
  Users,
  Plane,
  Flower2,
  Link as LinkIcon,
} from "lucide-react";
import {
  tours,
  transitions,
  dateLimit,
  money,
  rates,
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
const valid = (route: string[]) =>
  route.length > 0 &&
  route.length <= 14 &&
  route.every(
    (city, i) =>
      Object.hasOwn(transitions, city) &&
      (i === 0 || transitions[route[i - 1]].includes(city)),
  );
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
  const fmt = (value: number) => money(value * rates[c], c, l);
  const [route, setRoute] = useState(["Quba", "Khinalug"]),
    [active, setActive] = useState(0),
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
  const [dialog, setDialog] = useState<"stay" | "tours" | null>(null),
    [stay, setStay] = useState("comfort"),
    [chosen, setChosen] = useState<string[]>([]),
    [search, setSearch] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null),
    formRef = useRef<HTMLFormElement>(null),
    returnFocus = useRef<HTMLElement | null>(null);
  const days = route.length,
    nights = days - 1,
    rooms = Math.ceil(input.pax / 2);
  const labels = {
    driver: t(
      "Private car & driver",
      "Автомобиль с водителем",
      "Şəxsi avtomobil və sürücü",
    ),
    stay: t("Your stay", "Проживание", "Qalma yeri"),
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
  const amounts = {
    driver: days * (input.pax <= 3 ? 90 : input.pax <= 7 ? 135 : 180),
    stay:
      nights *
      rooms *
      { standard: 65, comfort: 110, premium: 190 }[input.hotel],
    guide: days * 65,
    transfer: 35,
    activity: input.pax * 20,
  };
  const total = keys.reduce(
    (sum, key) =>
      sum + (input[key] && (key !== "stay" || nights > 0) ? amounts[key] : 0),
    0,
  );
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
  const unit = (key: (typeof keys)[number]) =>
    key === "driver"
      ? `${days} × ${fmt(input.pax <= 3 ? 90 : input.pax <= 7 ? 135 : 180)}`
      : key === "stay"
        ? `${rooms} ${t("room(s)", "ном.", "otaq")} × ${nights} ${t("night(s)", "ноч.", "gecə")} × ${fmt({ standard: 65, comfort: 110, premium: 190 }[input.hotel])}`
        : key === "guide"
          ? `${days} × ${fmt(65)}`
          : key === "transfer"
            ? `1 × ${fmt(35)}`
            : `${input.pax} × ${fmt(20)}`;
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
  useEffect(() => {
    setQuote(null);
    setError("");
    if (!ready || !input.date || !selected.length) {
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
              "Could not confirm this estimate. Retry or request a manual offer.",
              "Не удалось подтвердить расчёт. Повторите или запросите предложение.",
              "Hesablamanı təsdiqləmək olmadı. Yenidən yoxlayın və ya təklif istəyin.",
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
  function open(kind: "stay" | "tours") {
    returnFocus.current = document.activeElement as HTMLElement;
    setStay(input.stay ? input.hotel : "own");
    setSearch("");
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
  function resize(n: number) {
    if (n < 1 || n > 14) return;
    setQuote(null);
    setRoute((s) =>
      Array.from({ length: n }, (_, i) => s[i] || s[s.length - 1]),
    );
    setActive((a) => Math.min(a, n - 1));
  }
  function city(value: string) {
    const next = [...route];
    next[active] = value;
    if (!valid(next)) {
      setNotice(
        t(
          "Choose a stop connected to both neighbouring days, or remove the following day first.",
          "Выберите остановку, связанную с соседними днями, или сначала удалите следующий день.",
          "Qonşu günlərlə əlaqəli dayanacaq seçin və ya əvvəlcə sonrakı günü silin.",
        ),
      );
      return;
    }
    setNotice("");
    setQuote(null);
    setRoute(next);
  }
  function applyTours() {
    const next = chosen.flatMap((slug) => templates[slug] || []);
    if (!valid(next)) {
      setNotice(
        t(
          "These tours need a connecting stop or a different order. Reorder your selection.",
          "Нужна пересадка или другой порядок туров. Измените порядок.",
          "Bu turlar üçün əlaqələndirici dayanacaq və ya başqa ardıcıllıq lazımdır.",
        ),
      );
      return;
    }
    setQuote(null);
    setRoute(next);
    setActive(0);
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
    "Review my request",
    "Проверить заявку",
    "Sorğumu nəzərdən keçir",
  );
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
                "Shape the route. Choose the details. We bring it together.",
                "Создайте маршрут. Выберите детали. Остальное — за нами.",
                "Marşrutu qur. Detalları seç. Biz bir araya gətirək.",
              )}
            </p>
          </div>
          <div>
            <button onClick={() => open("tours")}>
              {t(
                "Start with a ready-made tour",
                "Начать с готового тура",
                "Hazır turla başla",
              )}{" "}
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                setRoute(["Baku"]);
                setActive(0);
                setChosen([]);
              }}
            >
              {t("Start from scratch", "Начать с нуля", "Sıfırdan başla")}
            </button>
          </div>
        </header>
        <nav
          className="tp-steps"
          aria-label={t("Planner sections", "Разделы", "Planlayıcı bölmələri")}
        >
          {[
            t("Route", "Маршрут", "Marşrut"),
            t("Services", "Услуги", "Xidmətlər"),
            t("Review", "Проверка", "Baxış"),
          ].map((name, i) => (
            <a key={name} href={"#tp-" + i}>
              0{i + 1} {name}
            </a>
          ))}
        </nav>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            review();
          }}
        >
          <div className="tp-grid">
            <div>
              <div className="tp-fields">
                <label>
                  {t("Start date", "Дата начала", "Başlama tarixi")}
                  <input
                    required
                    type="date"
                    min={dateLimit(3)}
                    max={dateLimit(365)}
                    value={input.date}
                    onChange={(e) => change("date", e.target.value)}
                  />
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
                <div>
                  <span>
                    {t("Trip length", "Длительность", "Səfər müddəti")}
                  </span>
                  <div className="tp-stepper">
                    <button
                      type="button"
                      disabled={days <= 1}
                      aria-label={t("Remove day", "Убрать день", "Günü sil")}
                      onClick={() => resize(days - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <output>
                      {days} {t("days", "дн.", "gün")}
                    </output>
                    <button
                      type="button"
                      disabled={days >= 14}
                      aria-label={t("Add day", "Добавить день", "Gün əlavə et")}
                      onClick={() => resize(days + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <small>
                    {nights}{" "}
                    {t(
                      "night(s) · up to 14 days",
                      "ноч. · до 14 дней",
                      "gecə · 14 günədək",
                    )}
                  </small>
                </div>
              </div>
              <section id="tp-0">
                <h2>
                  <span>01</span>
                  {t("Your route", "Ваш маршрут", "Marşrutun")}
                </h2>
                <p>
                  {t(
                    "Choose your destinations, in order. Connected stops only.",
                    "Выберите направления по порядку. Только связанные остановки.",
                    "İstiqamətləri ardıcıllıqla seç. Yalnız əlaqəli dayanacaqlar.",
                  )}
                </p>
                <div className="tp-days">
                  {route.map((name, i) => (
                    <button
                      type="button"
                      key={i}
                      aria-pressed={active === i}
                      onClick={() => setActive(i)}
                    >
                      {t("Day", "День", "Gün")} {i + 1} · {name}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={days === 14}
                    onClick={() => resize(days + 1)}
                  >
                    <Plus size={15} />
                    {t("Add day", "Добавить", "Gün əlavə et")}
                  </button>
                </div>
                <div className="tp-day-editor">
                  <label>
                    {t("Destination", "Направление", "İstiqamət")}
                    <select
                      value={route[active]}
                      onChange={(e) => city(e.target.value)}
                    >
                      {Object.keys(transitions).map((name) => (
                        <option
                          key={name}
                          disabled={
                            active > 0 &&
                            !transitions[route[active - 1]].includes(name)
                          }
                        >
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={days === 1}
                    onClick={() => {
                      const next = route.filter((_, i) => i !== active);
                      if (valid(next)) {
                        setRoute(next);
                        setActive(Math.max(0, active - 1));
                        setNotice("");
                      } else
                        setNotice(
                          t(
                            "Reconnect neighbouring stops before removing this day.",
                            "Сначала соедините соседние остановки.",
                            "Əvvəlcə qonşu dayanacaqları əlaqələndir.",
                          ),
                        );
                    }}
                  >
                    {t("Remove this day", "Удалить день", "Bu günü sil")}
                  </button>
                </div>
                {notice && !dialog && <p role="status">{notice}</p>}
                <Image
                  className="tp-route-photo"
                  src={"/images/homepage-v3/" + photo(route[active]) + ".png"}
                  alt={route[active]}
                  width={1000}
                  height={420}
                />
                <div className="tp-route-line">
                  {route.map((city, i) => (
                    <span key={i}>{city}</span>
                  ))}
                </div>
                <p className="tp-caption">
                  {t(
                    "Your return route is arranged with our team.",
                    "Обратный маршрут согласуем с нашей командой.",
                    "Geri dönüş marşrutu komandamızla razılaşdırılır.",
                  )}
                </p>
              </section>
              <section id="tp-1">
                <h2>
                  <span>02</span>
                  {t(
                    "Choose your services",
                    "Выберите услуги",
                    "Xidmətlərini seç",
                  )}
                </h2>
                <p>
                  {t(
                    "Add only what you need. Prices update with your choices.",
                    "Добавляйте нужное. Цена меняется вместе с выбором.",
                    "Ehtiyacın olanı əlavə et. Qiymət seçimlərinə görə yenilənir.",
                  )}
                </p>
                <div className="tp-services">
                  {keys.map((key) => {
                    const Icon = icons[key];
                    return (
                      <div className="tp-service" key={key}>
                        <input
                          aria-label={labels[key]}
                          type="checkbox"
                          checked={!!input[key]}
                          disabled={key === "stay" && !nights}
                          onChange={(e) => change(key, e.target.checked)}
                        />
                        <Icon size={28} />
                        <div>
                          <strong>{labels[key]}</strong>
                          {key === "stay" && (
                            <>
                              <Image
                                src="/images/homepage-v3/guesthouse.png"
                                alt={t(
                                  "Illustrative stay",
                                  "Пример проживания",
                                  "Nümunə qalma yeri",
                                )}
                                width={86}
                                height={70}
                              />
                              <small>
                                {input.hotel} ·{" "}
                                {t(
                                  "Property confirmed by our team",
                                  "Отель подтвердит команда",
                                  "Oteli komandamız təsdiqləyir",
                                )}
                              </small>
                            </>
                          )}
                          <small>{unit(key)}</small>
                          {key === "guide" && (
                            <select
                              aria-label={t(
                                "Guide language",
                                "Язык гида",
                                "Gid dili",
                              )}
                              value={input.guideLanguage}
                              onChange={(e) =>
                                change(
                                  "guideLanguage",
                                  e.target.value as Locale,
                                )
                              }
                            >
                              <option value="en">English</option>
                              <option value="ru">Русский</option>
                              <option value="az">Azərbaycanca</option>
                            </select>
                          )}
                        </div>
                        <strong>{fmt(input[key] ? amounts[key] : 0)}</strong>
                        {key === "stay" && (
                          <button
                            type="button"
                            disabled={!nights}
                            onClick={() => open("stay")}
                          >
                            {t("Change", "Изменить", "Dəyiş")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <label className="tp-notes">
                  {t(
                    "Anything else we should know?",
                    "Что ещё нам нужно знать?",
                    "Əlavə nəyi bilməliyik?",
                  )}
                  <textarea
                    value={notes}
                    maxLength={2000}
                    rows={3}
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
            <aside className="tp-summary">
              <Image
                src={
                  "/images/homepage-v3/" +
                  photo(route[route.length - 1]) +
                  ".png"
                }
                alt={route[route.length - 1]}
                width={600}
                height={350}
              />
              <h2>
                {t(
                  "Your trip at a glance",
                  "Ваше путешествие",
                  "Səfərinə ümumi baxış",
                )}
              </h2>
              <p>
                {route.join(" · ")}
                <br />
                {days} {t("days", "дн.", "gün")} · {nights}{" "}
                {t("night(s)", "ноч.", "gecə")} · {input.pax}{" "}
                {t("travelers", "чел.", "nəfər")}
              </p>
              <div className="tp-lines">
                {selected.map((key) => {
                  const Icon = icons[key];
                  return (
                    <div key={key}>
                      <Icon size={20} />
                      <span>{labels[key]}</span>
                      <strong>{fmt(amounts[key])}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="tp-total">
                <strong>
                  {t("Estimated total", "Примерная сумма", "Təxmini cəm")}
                </strong>
                <strong>{fmt(total)}</strong>
              </div>
              <small>
                {t(
                  "For your group · sample prices. Final services and price confirmed by our team.",
                  "Для всей группы · примерные цены. Услуги и цену подтвердит команда.",
                  "Bütün qrup üçün · nümunə qiymətlər. Yekun xidmət və qiyməti komandamız təsdiqləyir.",
                )}
              </small>
              <button
                className="tp-primary"
                type="submit"
                disabled={busy || !selected.length || (!quote && !!input.date)}
              >
                {busy ? t("Updating…", "Обновляем…", "Yenilənir…") : action}
                <ArrowRight size={18} />
              </button>
              <small>
                {t(
                  "Sign in or create an account to continue. Your choices will be kept.",
                  "Войдите или создайте аккаунт. Ваш выбор сохранится.",
                  "Davam etmək üçün daxil ol və ya qeydiyyatdan keç. Seçimlərin saxlanılacaq.",
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
                    {t("Manual offer", "Предложение", "Fərdi təklif")}
                  </a>
                </div>
              )}
              <button type="button" className="tp-share" onClick={share}>
                <LinkIcon size={18} />
                {t(
                  "Copy plan link",
                  "Скопировать ссылку",
                  "Plan linkini kopyala",
                )}
              </button>
              {shared && <output className="tp-shared">{shared}</output>}
              <small>
                {t(
                  "Route and service choices only.",
                  "Только маршрут и услуги.",
                  "Yalnız marşrut və xidmət seçimləri.",
                )}
              </small>
            </aside>
          </div>
          <section className="tp-review" id="tp-2">
            <h2>
              <span>03</span>
              {t("Review your plan", "Проверьте план", "Planına nəzər sal")}
            </h2>
            <div className="tp-review-strip">
              <span>
                {input.date ||
                  t("Choose a date", "Выберите дату", "Tarixi seç")}
              </span>
              <span>
                {input.pax} {t("travelers", "чел.", "nəfər")}
              </span>
              <span>{route.join(" → ")}</span>
              <span>
                {selected.length}{" "}
                {t("selected services", "услуг", "seçilmiş xidmət")}
              </span>
            </div>
            <div className="tp-next">
              {[
                t(
                  "1. Send a request",
                  "1. Отправьте заявку",
                  "1. Sorğu göndər",
                ),
                t(
                  "2. Our team checks",
                  "2. Команда проверяет",
                  "2. Komandamız yoxlayır",
                ),
                t(
                  "3. Review your offer",
                  "3. Рассмотрите предложение",
                  "3. Təklifə bax",
                ),
              ].map((name, i) => (
                <div key={name}>
                  <h3>{name}</h3>
                  <p>
                    {
                      [
                        t(
                          "Sign in and review before explicitly submitting.",
                          "Войдите и проверьте перед отправкой.",
                          "Daxil ol və göndərməzdən əvvəl yoxla.",
                        ),
                        t(
                          "We confirm availability and prepare your offer.",
                          "Мы проверим доступность и подготовим предложение.",
                          "Mövcudluğu yoxlayıb təklif hazırlayırıq.",
                        ),
                        t(
                          "Review your itinerary, final prices and contract.",
                          "Проверьте маршрут, цены и договор.",
                          "Marşrut, yekun qiymətlər və müqavilə ilə tanış ol.",
                        ),
                      ][i]
                    }
                  </p>
                </div>
              ))}
            </div>
            <p>
              {t(
                "No booking or payment is made at this stage.",
                "На этом этапе нет бронирования и оплаты.",
                "Bu mərhələdə rezervasiya və ödəniş edilmir.",
              )}
            </p>
          </section>
        </form>
        <div className="tp-faq">
          <div>
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
                  "After operator review and contract approval, a deposit is requested. Later payments follow service requirements. Contract approval and staged payments are planned; current payments are simulated.",
                  "После проверки и одобрения договора запрашивается депозит. Следующие платежи зависят от услуг. Договор и поэтапная оплата запланированы; сейчас платежи демонстрационные.",
                  "Operator yoxlaması və müqavilə təsdiqindən sonra beh tələb olunur. Sonrakı ödənişlər xidmətlərə görə istənilir. Müqavilə və mərhələli ödənişlər planlaşdırılır; hazırkı ödənişlər demodur.",
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
          <div>
            <Image
              src="/images/homepage-v3/hiking.png"
              alt={t(
                "Illustrative mountain journey",
                "Иллюстрация похода",
                "Nümunə dağ səyahəti",
              )}
              width={500}
              height={300}
            />
            <small>
              {t(
                "Illustrative imagery and sample prices.",
                "Иллюстрации и примерные цены.",
                "İllüstrativ şəkillər və nümunə qiymətlər.",
              )}
            </small>
          </div>
        </div>
        <div className="tp-mobile-action">
          <span>
            {t("Estimate", "Примерно", "Təxmini")}
            <strong>{fmt(total)}</strong>
          </span>
          <button
            className="tp-primary"
            disabled={busy || !selected.length || (!quote && !!input.date)}
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
            dialog === "stay"
              ? t("Choose your stay", "Выберите проживание", "Qalma yerini seç")
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
          {dialog === "stay" ? (
            <>
              <h2>
                {t(
                  "Choose your stay",
                  "Выберите проживание",
                  "Qalma yerini seç",
                )}
              </h2>
              <p>
                {rooms} {t("room(s)", "ном.", "otaq")} · {nights}{" "}
                {t("night(s)", "ноч.", "gecə")}
              </p>
              <p>
                {t(
                  "Choose a category. Our team confirms the property.",
                  "Выберите категорию. Отель подтвердит команда.",
                  "Kateqoriyanı seç. Oteli komandamız təsdiqləyir.",
                )}
              </p>
              {["standard", "comfort", "premium", "own"].map((key, i) => (
                <label className="tp-stay-option" key={key}>
                  <input
                    type="radio"
                    name="stay-category"
                    checked={stay === key}
                    onChange={() => setStay(key)}
                  />
                  {key === "comfort" && (
                    <Image
                      src="/images/homepage-v3/guesthouse.png"
                      alt=""
                      width={90}
                      height={76}
                    />
                  )}
                  <strong>
                    {
                      [
                        t("Standard", "Стандарт", "Standart"),
                        t("Comfort", "Комфорт", "Komfort"),
                        t("Premium", "Премиум", "Premium"),
                        t(
                          "I’ll arrange my own stay",
                          "Организую проживание сам",
                          "Özüm təşkil edəcəyəm",
                        ),
                      ][i]
                    }
                  </strong>
                  <span>
                    {fmt([65, 110, 190, 0][i])}
                    <small>
                      {t("per room / night", "за номер / ночь", "otaq / gecə")}
                    </small>
                  </span>
                </label>
              ))}
              <div className="tp-dialog-actions">
                <button onClick={close}>
                  {t("Cancel", "Отмена", "Ləğv et")}
                </button>
                <button
                  className="tp-primary"
                  onClick={() => {
                    setInput((s) => ({
                      ...s,
                      stay: stay !== "own",
                      hotel:
                        stay === "own"
                          ? s.hotel
                          : (stay as QuoteInput["hotel"]),
                    }));
                    setQuote(null);
                    close();
                  }}
                >
                  {t("Apply stay", "Применить", "Tətbiq et")}
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
                        ".png"
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
                  "Only connected stops can be combined. Prices come from your selected services.",
                  "Можно объединить связанные остановки. Цена зависит от выбранных услуг.",
                  "Yalnız əlaqəli dayanacaqlar birləşdirilir. Qiymət seçilmiş xidmətlərə görə hesablanır.",
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
