"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Plus,
  X,
  Car,
  BedDouble,
  Users,
  Plane,
  Bus,
  Flower2,
  Utensils,
  Tickets,
  Camera,
  CalendarDays,
  Link as LinkIcon,
} from "lucide-react";
import { RouteMap, type RouteStop } from "./route-map";
import { places } from "@/lib/places";
import { PAX_OPTIONS, snapPax, travellerCount } from "@/lib/pax";
import {
  tours,
  transitions,
  dateLimit,
  priceRange,
  type Locale,
  type Currency,
  type Quote,
  type QuoteInput,
  catalogRoutes,
} from "@/lib/travel";

// The trip is built day by day: a day has one or more places, and every place has the services wanted there.
type PlanPlace = { city: string; services: string[] };
type PlanDay = { places: PlanPlace[] };
const SERVICE_KEYS = [
  "transport",
  "hotel",
  "guide",
  "transfer",
  "intercity",
  "activity",
  "event",
  "meals",
  "tickets",
  "photographer",
] as const;
// The estimate is built from these; the others are added to the offer by the team.
const MAIN_KEYS = ["transport", "hotel", "guide", "transfer", "intercity", "activity"];
const MAX_DAYS = 14;
const MAX_PLACES = 4;
const icons = {
  transport: Car,
  hotel: BedDouble,
  guide: Users,
  transfer: Plane,
  intercity: Bus,
  activity: Flower2,
  event: CalendarDays,
  meals: Utensils,
  tickets: Tickets,
  photographer: Camera,
};
const templates: Record<string, string[]> = {
  ...catalogRoutes,
  "baku-discovery": ["Baku"],
  "quba-khinalug": ["Quba", "Khinalug"],
  "sheki-gabala": ["Gabala", "Sheki", "Sheki"],
};
const cities = Object.keys(transitions);
/** Nothing is ticked for the customer: every day starts clear and they choose what they need. */
const defaultServices = (_day: number, _total: number): string[] => [];
/** A ready-made tour shows what it already includes, so a customer adjusting it starts from that. */
const tourServices = (day: number, total: number) => [
  "transport",
  "guide",
  ...(day < total - 1 ? ["hotel"] : []),
  ...(day === 0 ? ["transfer", "activity"] : []),
];
const planFromCities = (list: string[], fromTour = false): PlanDay[] =>
  list.map((city, i) => ({
    places: [
      {
        city,
        services: fromTour ? tourServices(i, list.length) : defaultServices(i, list.length),
      },
    ],
  }));
const encodePlan = (plan: PlanDay[]) =>
  plan
    .map((d) => d.places.map((p) => p.city + ":" + p.services.join("+")).join(","))
    .join("~");
function decodePlan(raw: string | null): PlanDay[] | null {
  if (!raw) return null;
  const days = raw.split("~");
  if (days.length < 1 || days.length > MAX_DAYS) return null;
  const out: PlanDay[] = [];
  for (const day of days) {
    const list = day.split(",");
    if (list.length < 1 || list.length > MAX_PLACES) return null;
    const dayPlaces: PlanPlace[] = [];
    for (const item of list) {
      const [city, services = ""] = item.split(":");
      if (!Object.hasOwn(transitions, city)) return null;
      const kinds = services.split("+").filter(Boolean);
      if (!kinds.every((k) => (SERVICE_KEYS as readonly string[]).includes(k))) return null;
      dayPlaces.push({ city, services: [...new Set(kinds)] });
    }
    out.push({ places: dayPlaces });
  }
  return out;
}
const uniqRun = (list: string[]) => list.filter((c, i) => c !== list[i - 1]);

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
  const [plan, setPlan] = useState<PlanDay[]>([]),
    [ready, setReady] = useState(false);
  const [input, setInput] = useState<QuoteInput>({
    slug: "quba-khinalug",
    date: "",
    pax: 0,
    hotel: "comfort",
    guide: false,
    guideLanguage: l,
    transfer: false,
    activity: false,
    currency: c,
    startCity: "Baku",
    endCity: "Baku",
  });
  const [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [notes, setNotes] = useState(""),
    [shared, setShared] = useState(""),
    [step, setStep] = useState(0),
    [showTours, setShowTours] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null),
    formRef = useRef<HTMLFormElement>(null);
  const days = plan.length,
    allPlaces = plan.flatMap((d) => d.places),
    startCity = input.startCity ?? "Baku",
    endCity = input.endCity ?? "Baku",
    fullRoute: RouteStop[] = days
      ? [
          { city: startCity, days: 0 },
          ...allPlaces.map((p) => ({ city: p.city, days: 1 })),
          { city: endCity, days: 0 },
        ]
      : [];
  const picked = (key: string) => allPlaces.some((p) => p.services.includes(key)),
    hasMain = allPlaces.some((p) => p.services.some((s) => MAIN_KEYS.includes(s)));
  const dateProblem =
    !!input.date &&
    (input.date < dateLimit(3) || input.date > dateLimit(365));
  const labels: Record<string, string> = {
    transport: t("Private car & driver", "Автомобиль с водителем", "Şəxsi avtomobil və sürücü"),
    hotel: t("Accommodation", "Проживание", "Qalma yeri"),
    guide: t("Local guide", "Местный гид", "Yerli bələdçi"),
    transfer: t("Airport transfer", "Трансфер из аэропорта", "Hava limanı transferi"),
    intercity: t("Transfer to the next region", "Трансфер в следующий регион", "Növbəti rayona transfer"),
    activity: t("Local craft experience", "Местный мастер-класс", "Yerli sənətkarlıq təcrübəsi"),
    event: t("Event", "Мероприятие", "Tədbir"),
    meals: t("Local meals", "Местная кухня", "Yerli yeməklər"),
    tickets: t("Entrance tickets", "Входные билеты", "Giriş biletləri"),
    photographer: t("Photographer", "Фотограф", "Fotoqraf"),
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
  const dayWord = (n: number) =>
    n === 1 ? t("day", "день", "gün") : t("days", "дн.", "gün");

  // What was in the link: a plan, or an older link with a route and service flags, or a ready-made tour.
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const template = p.get("template") || "";
    let next = decodePlan(p.get("plan"));
    if (!next) {
      const saved = p.get("route")?.split(",").filter((x) => Object.hasOwn(transitions, x));
      const base = saved?.length ? saved : templates[template];
      if (base) {
        next = planFromCities(base.slice(0, MAX_DAYS), !saved?.length);
        const off: Record<string, string> = {
          driver: "transport",
          stay: "hotel",
          guide: "guide",
          transfer: "transfer",
          activity: "activity",
        };
        for (const [param, kind] of Object.entries(off))
          if (p.get(param) === "false")
            next = next.map((d) => ({
              places: d.places.map((pl) => ({ ...pl, services: pl.services.filter((s) => s !== kind) })),
            }));
      }
    }
    if (next) setPlan(next);
    setInput((s) => {
      const out = {
        ...s,
        slug: Object.hasOwn(catalogRoutes, template) ? template : s.slug,
        date: p.get("date") || "",
        pax: p.has("pax") && Number(p.get("pax")) > 0 ? snapPax(Number(p.get("pax"))) : 0,
      };
      for (const [param, field] of [["start", "startCity"], ["end", "endCity"]] as const)
        if (Object.hasOwn(transitions, p.get(param) || "")) out[field] = p.get(param) as string;
      if (["standard", "comfort", "premium"].includes(p.get("hotel") || ""))
        out.hotel = p.get("hotel") as QuoteInput["hotel"];
      if (["en", "ru", "az"].includes(p.get("guideLanguage") || ""))
        out.guideLanguage = p.get("guideLanguage") as Locale;
      return out;
    });
    try {
      setNotes(sessionStorage.getItem("azertur-planner-notes") || "");
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (plan.length) p.set("plan", encodePlan(plan));
    if (Object.hasOwn(catalogRoutes, input.slug)) p.set("template", input.slug);
    for (const key of ["date", "pax", "hotel", "guideLanguage"] as const)
      p.set(key, String(input[key] ?? ""));
    if (input.startCity && input.startCity !== "Baku") p.set("start", input.startCity);
    if (input.endCity && input.endCity !== "Baku") p.set("end", input.endCity);
    const url = location.pathname + "?" + p;
    history.replaceState({}, "", url);
    try {
      sessionStorage.setItem("azertur-draft-url", url);
      sessionStorage.setItem("azertur-planner-notes", notes);
    } catch {}
  }, [ready, plan, input, notes]);
  // The server still prices the request internally; the customer only sees an estimate range.
  useEffect(() => {
    setQuote(null);
    setError("");
    if (!ready || !input.date || !input.pax || dateProblem || !hasMain || !days) {
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
            currency: c,
            // The server works out the days, the route and the service flags from the plan.
            guide: false,
            transfer: false,
            activity: false,
            customDays: days,
            cities: plan.map((d) => d.places[0].city),
            plan,
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
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ready, input, c, plan, retry, l]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = dialogRef.current;
    if (showTours && el && !el.open) el.showModal();
  }, [showTours]);

  function change<K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) {
    setQuote(null);
    setInput((s) => ({ ...s, [key]: value }));
  }
  const edit = (next: PlanDay[]) => {
    setQuote(null);
    setPlan(next);
  };
  const addDay = () => {
    if (days >= MAX_DAYS) return;
    const last = allPlaces[allPlaces.length - 1]?.city ?? cities[0];
    // The new day starts in the last place with no service ticked.
    edit([...plan, { places: [{ city: last, services: [] }] }]);
  };
  const removeDay = (di: number) => edit(plan.filter((_, i) => i !== di));
  const addPlace = (di: number) => {
    if (plan[di].places.length >= MAX_PLACES) return;
    const last = plan[di].places[plan[di].places.length - 1].city;
    const next = cities.find((x) => x !== last) ?? last;
    edit(plan.map((d, i) => (i === di ? { places: [...d.places, { city: next, services: [] }] } : d)));
  };
  const removePlace = (di: number, pi: number) =>
    edit(plan.map((d, i) => (i === di ? { places: d.places.filter((_, n) => n !== pi) } : d)));
  const patchPlace = (di: number, pi: number, patch: Partial<PlanPlace>) =>
    edit(
      plan.map((d, i) =>
        i === di ? { places: d.places.map((p, n) => (n === pi ? { ...p, ...patch } : p)) } : d,
      ),
    );
  const toggle = (di: number, pi: number, key: string, on: boolean) => {
    const current = plan[di].places[pi].services;
    patchPlace(di, pi, {
      services: on ? [...new Set([...current, key])] : current.filter((s) => s !== key),
    });
  };
  function useTemplate(slug: string) {
    edit(planFromCities(templates[slug], true));
    setInput((s) => ({
      ...s,
      slug: Object.hasOwn(catalogRoutes, slug) ? slug : "quba-khinalug",
      startCity: "Baku",
      endCity: "Baku",
    }));
    setStep(0);
    setShowTours(false);
    dialogRef.current?.close();
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
  const action = t("Send to our team", "Отправить команде", "Komandaya göndər");
  const stepTitles = [
    t("Day by day", "День за днём", "Gün-gün marşrut"),
    t("Dates and travellers", "Даты и участники", "Tarix və səyahətçilər"),
    t("Review and send", "Проверка и отправка", "Yoxlama və göndərmə"),
  ];
  const stepDone = [hasMain && days > 0, !!input.date && !dateProblem && input.pax > 0, true];
  const firstOpen = stepDone.indexOf(false);
  const reachable = firstOpen === -1 ? stepTitles.length - 1 : firstOpen;
  const stepHint = [
    days === 0
      ? t("Add a day to start.", "Добавьте день, чтобы начать.", "Başlamaq üçün gün əlavə et.")
      : t(
          "Choose at least one main service (car, stay, guide, transfer or experience) to continue.",
          "Выберите хотя бы одну основную услугу (авто, проживание, гид, трансфер или впечатление).",
          "Davam etmək üçün ən azı bir əsas xidmət seç (avtomobil, qalma yeri, bələdçi, transfer və ya təcrübə).",
        ),
    t("Choose a valid start date to continue.", "Выберите корректную дату начала.", "Davam etmək üçün düzgün başlama tarixi seç."),
    "",
  ][step];
  function goStep(n: number) {
    if (n < 0 || n > reachable) return;
    setStep(n);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const submitDisabled = busy || !hasMain || !days || dateProblem || !input.date || !input.pax || !quote;
  const pickedKeys = SERVICE_KEYS.filter((k) => picked(k));
  const citySelect = (value: string, label: string, onChange: (v: string) => void) => (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {cities.map((city) => (
        <option key={city} value={city}>
          {cityName(city)}
        </option>
      ))}
    </select>
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
            <h1>{t("Your trip. Your choices.", "Ваш маршрут. Ваш выбор.", "Sənin səfərin. Sənin seçimin.")}</h1>
            <p>
              {t(
                "Add the days, choose where you go each day and what you need there. Our team replies with a personal offer.",
                "Добавляйте дни, выбирайте, куда вы едете и что нужно на месте. Команда пришлёт персональное предложение.",
                "Gün əlavə et, hər gün hara getdiyini və orada nələr lazım olduğunu seç. Komandamız fərdi təklif göndərəcək.",
              )}
            </p>
          </div>
          <div>
            <button type="button" onClick={() => setShowTours(true)}>
              {t("Start with a ready-made tour", "Начать с готового тура", "Hazır turla başla")}{" "}
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                edit([{ places: [{ city: cities[0], services: ["transport", "guide"] }] }]);
                setStep(0);
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
            // Enter on an earlier step moves on instead of sending the request.
            if (step < stepTitles.length - 1) {
              if (stepDone[step]) goStep(step + 1);
              return;
            }
            review();
          }}
        >
          <ol className="tpx-steps" aria-label={t("Steps", "Шаги", "Addımlar")}>
            {stepTitles.map((title, n) => (
              <li key={n}>
                <button
                  type="button"
                  aria-current={step === n ? "step" : undefined}
                  data-done={n < step && stepDone[n] ? "true" : undefined}
                  disabled={n > reachable}
                  onClick={() => goStep(n)}
                >
                  <b aria-hidden="true">{n + 1}</b>
                  <span>{title}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="tpx-layout">
            <div className="tpx-card">
              {step === 0 && (
                <section className="tpx-days" aria-labelledby="tpx-days-h">
                  <h2 id="tpx-days-h">{stepTitles[0]}</h2>
                  <p className="tpx-hint">
                    {t(
                      "Add a day, choose where you want to go, then tick the services you want in that place. A day can have several places.",
                      "Добавьте день, выберите, куда хотите поехать, и отметьте нужные услуги. В один день можно посетить несколько мест.",
                      "Gün əlavə et, hara getmək istədiyini seç, sonra orada istədiyin xidmətləri işarələ. Bir gündə bir neçə yer ola bilər.",
                    )}
                  </p>
                  <div className="tpx-endrow">
                    <b aria-hidden="true">
                      <Plane size={14} />
                    </b>
                    <div>
                      <small>{t("Start", "Старт", "Başlanğıc")}</small>
                      {citySelect(startCity, t("Start city", "Город старта", "Başlanğıc şəhəri"), (v) => change("startCity", v))}
                    </div>
                  </div>
                  <p className="tpx-hint">
                    {t(
                      "Tick the services you need for each day and place. Nothing is chosen for you.",
                      "Отметьте нужные услуги для каждого дня и места. Ничего не выбрано заранее.",
                      "Hər gün və hər yer üçün lazım olan xidmətləri işarələyin. Əvvəlcədən heç nə seçilmir.",
                    )}
                  </p>
                  <ol className="tpx-daylist">
                    {plan.map((day, di) => (
                      <li className="tpx-day" key={di}>
                        <details open>
                          <summary>
                            <strong>
                              {t("Day", "День", "Gün")} {di + 1}
                            </strong>
                            <span>{day.places.map((pl) => cityName(pl.city)).join(", ")}</span>
                            <small>
                              {day.places.reduce((n, pl) => n + pl.services.length, 0)}{" "}
                              {t("services", "услуг", "xidmət")}
                            </small>
                          </summary>
                          <div className="tpx-daybody">
                            {day.places.map((pl, pi) => (
                              <details className="tpx-place" open key={pi}>
                                <summary>
                                  <strong>{cityName(pl.city)}</strong>
                                  <small>
                                    {pl.services.length} {t("services", "услуг", "xidmət")}
                                  </small>
                                </summary>
                                <div className="tpx-placebody">
                                  <div className="tpx-placehead">
                                    {citySelect(
                                      pl.city,
                                      t("Place ", "Место ", "Yer ") + (pi + 1) + t(" of day ", " дня ", ", gün ") + (di + 1),
                                      (v) => patchPlace(di, pi, { city: v }),
                                    )}
                                    {day.places.length > 1 && (
                                      <button
                                        type="button"
                                        className="tpx-x"
                                        aria-label={t("Remove place ", "Убрать место ", "Yeri sil ") + cityName(pl.city)}
                                        onClick={() => removePlace(di, pi)}
                                      >
                                        <X size={15} />
                                      </button>
                                    )}
                                  </div>
                                  <div
                                    className="tpx-chips"
                                    role="group"
                                    aria-label={t("Services in ", "Услуги: ", "Xidmətlər: ") + cityName(pl.city)}
                                  >
                                    {SERVICE_KEYS.map((key) => {
                                      const Icon = icons[key];
                                      const on = pl.services.includes(key);
                                      return (
                                        <label key={key} className={"tpx-chip" + (on ? " on" : "")}>
                                          <input
                                            type="checkbox"
                                            checked={on}
                                            onChange={(e) => toggle(di, pi, key, e.target.checked)}
                                          />
                                          <Icon size={15} aria-hidden="true" />
                                          {labels[key]}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              </details>
                            ))}
                            <div className="tpx-dayactions">
                              <button
                                type="button"
                                className="tpx-addplace"
                                disabled={day.places.length >= MAX_PLACES}
                                onClick={() => addPlace(di)}
                              >
                                <Plus size={15} />
                                {t("Add another place this day", "Добавить место в этот день", "Bu gün başqa yer əlavə et")}
                              </button>
                              <button
                                type="button"
                                className="tpx-removeday"
                                aria-label={t("Remove day ", "Убрать день ", "Günü sil ") + (di + 1)}
                                onClick={() => removeDay(di)}
                              >
                                <X size={15} />
                                {t("Remove this day", "Убрать этот день", "Bu günü sil")}
                              </button>
                            </div>
                          </div>
                        </details>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    className="tpx-addday"
                    disabled={days >= MAX_DAYS}
                    onClick={addDay}
                  >
                    <Plus size={16} />
                    {t("Add a day", "Добавить день", "Gün əlavə et")}
                  </button>
                  {days >= MAX_DAYS && (
                    <small>{t("Up to 14 days.", "До 14 дней.", "Ən çoxu 14 gün.")}</small>
                  )}
                  <div className="tpx-endrow">
                    <b aria-hidden="true">
                      <Plane size={14} />
                    </b>
                    <div>
                      <small>{t("Return", "Возвращение", "Qayıdış")}</small>
                      {citySelect(endCity, t("Return city", "Город возвращения", "Qayıdış şəhəri"), (v) => change("endCity", v))}
                    </div>
                  </div>
                  <p className="tpx-provider-note" role="note">
                    {t(
                      "Specific hotels, cars and guides are not chosen yet. Our team confirms them and the final price after you send the request. Meals, tickets, events and a photographer are priced in your offer.",
                      "Конкретные отели, автомобили и гиды пока не выбраны. Команда подтвердит их и итоговую цену после отправки заявки. Питание, билеты, мероприятия и фотограф оцениваются в предложении.",
                      "Konkret otel, avtomobil və bələdçi hələ seçilməyib. Komandamız onları və yekun qiyməti sorğunu göndərdikdən sonra təsdiqləyir. Yemək, bilet, tədbir və fotoqrafın qiyməti təklifdə göstərilir.",
                    )}
                  </p>
                </section>
              )}
              {step === 1 && (
                <section className="tpx-basics">
                  <h2>{stepTitles[1]}</h2>
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
                      required
                      value={input.pax || ""}
                      onChange={(e) => change("pax", Number(e.target.value))}
                    >
                      <option value="" disabled>
                        {t("Select travelers", "Выберите число путешественников", "İştirakçı sayını seçin")}
                      </option>
                      {PAX_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {travellerCount(n, l)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="tpx-length">
                    <strong>
                      {days} {dayWord(days)}
                    </strong>
                  </p>
                  {picked("hotel") && (
                    <label>
                      {t("Accommodation category", "Категория проживания", "Qalma yerinin kateqoriyası")}
                      <select
                        value={input.hotel}
                        onChange={(e) => change("hotel", e.target.value as QuoteInput["hotel"])}
                      >
                        {Object.entries(hotels).map(([value, name]) => (
                          <option key={value} value={value}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {picked("guide") && (
                    <label>
                      {t("Guide language", "Язык гида", "Bələdçi dili")}
                      <select
                        value={input.guideLanguage}
                        onChange={(e) => change("guideLanguage", e.target.value as Locale)}
                      >
                        {(Object.keys(langNames) as Locale[]).map((code) => (
                          <option key={code} value={code}>
                            {langNames[code]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </section>
              )}
              {step === 2 && (
                <section className="tpx-notes">
                  <h2>{stepTitles[2]}</h2>
                  <label>
                    {t("Anything else we should know?", "Что ещё нам нужно знать?", "Əlavə nəyi bilməliyik?")}
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
              )}
              <div className="tpx-nav">
                {stepHint && !stepDone[step] && <p role="status">{stepHint}</p>}
                <div>
                  {step > 0 && (
                    <button type="button" className="tpx-back" onClick={() => goStep(step - 1)}>
                      {t("Back", "Назад", "Geri")}
                    </button>
                  )}
                  {step < stepTitles.length - 1 && (
                    <button
                      type="button"
                      className="tp-primary"
                      disabled={!stepDone[step]}
                      onClick={() => goStep(step + 1)}
                    >
                      {t("Next", "Далее", "Növbəti")}
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <aside className="tpx-aside">
              <h2>{t("Your request", "Ваша заявка", "Sənin sorğun")}</h2>
              {fullRoute.length > 0 && (
                <RouteMap
                  stops={fullRoute}
                  name={cityName}
                  label={
                    t("Route: ", "Маршрут: ", "Marşrut: ") +
                    fullRoute.map((s) => cityName(s.city)).join(" → ")
                  }
                />
              )}
              <p className="tpx-route-line">
                {days ? (
                  uniqRun(fullRoute.map((s) => s.city)).map(cityName).join(" → ")
                ) : (
                  <em>{t("Add your first day", "Добавьте первый день", "İlk günü əlavə et")}</em>
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
                  <dt>{t("Duration", "Длительность", "Müddət")}</dt>
                  <dd>
                    {days} {dayWord(days)}
                  </dd>
                </div>
                <div>
                  <dt>{t("Travelers", "Путешественники", "Səyahətçilər")}</dt>
                  <dd>{input.pax ? travellerCount(input.pax, l) : "-"}</dd>
                </div>
              </dl>
              <ul className="tpx-picked">
                {pickedKeys.map((key) => {
                  const Icon = icons[key];
                  const extra =
                    key === "hotel"
                      ? hotels[input.hotel]
                      : key === "guide"
                        ? langNames[(input.guideLanguage ?? l) as Locale]
                        : "";
                  return (
                    <li key={key}>
                      <Icon size={16} aria-hidden="true" />
                      {labels[key]}
                      {extra && <small>{extra}</small>}
                    </li>
                  );
                })}
                {!pickedKeys.length && (
                  <li>
                    <em>{t("No services selected", "Услуги не выбраны", "Xidmət seçilməyib")}</em>
                  </li>
                )}
              </ul>
              <div className="tpx-estimate" aria-live="polite">
                <span>{t("Estimated price range", "Ориентировочный диапазон цен", "Təxmini qiymət aralığı")}</span>
                {quote && quote.status === "PRICED" ? (
                  <>
                    <strong>{priceRange(quote.total, c, l)}</strong>
                    <small>
                      {t(
                        "Our operator reviews your request and sends the exact price in an offer.",
                        "Оператор рассмотрит заявку и пришлёт точную цену в предложении.",
                        "Operator müraciətinə baxıb dəqiq qiyməti təklifdə göndərəcək.",
                      )}
                    </small>
                  </>
                ) : busy ? (
                  <em>{t("Calculating…", "Считаем…", "Hesablanır…")}</em>
                ) : quote ? (
                  <em>
                    {t("Our team will price this trip.", "Цену рассчитает наша команда.", "Bu səfərin qiymətini komandamız hesablayacaq.")}
                  </em>
                ) : !hasMain ? (
                  <em>
                    {t("Select at least one main service.", "Выберите хотя бы одну основную услугу.", "Ən azı bir əsas xidmət seç.")}
                  </em>
                ) : (
                  <em>
                    {t(
                      "Choose a start date and a stop to see it.",
                      "Выберите дату и остановку, чтобы увидеть сумму.",
                      "Görmək üçün tarix və dayanacaq seç.",
                    )}
                  </em>
                )}
              </div>
              {step === stepTitles.length - 1 && (
                <>
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
                </>
              )}
              {error && (
                <div role="status">
                  <p>{error}</p>
                  <button type="button" onClick={() => setRetry((x) => x + 1)}>
                    {t("Retry", "Повторить", "Yenidən yoxla")}
                  </button>{" "}
                  <a
                    href={"/" + l + "/request" + (typeof window !== "undefined" ? location.search : "")}
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
            {days} {dayWord(days)}, {pickedKeys.length} {t("services", "услуг", "xidmət")}
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
      {showTours && (
        <dialog
          ref={dialogRef}
          className="tp-dialog"
          aria-label={t("Start with a ready-made tour", "Начать с готового тура", "Hazır turla başla")}
          onClose={() => setShowTours(false)}
        >
          <button
            className="tp-close"
            type="button"
            aria-label={t("Close", "Закрыть", "Bağla")}
            onClick={() => {
              dialogRef.current?.close();
              setShowTours(false);
            }}
          >
            <X size={18} />
          </button>
          <h2>{t("Start with a ready-made tour", "Начать с готового тура", "Hazır turla başla")}</h2>
          <p>
            {t(
              "You can change the days, places and services afterwards.",
              "Дни, места и услуги можно изменить потом.",
              "Gün, yer və xidmətləri sonra dəyişə bilərsən.",
            )}
          </p>
          <ul className="tpx-tourlist">
            {tours.map((tour) => (
              <li key={tour.slug}>
                <button type="button" onClick={() => useTemplate(tour.slug)}>
                  <strong>{tour.name[idx] ?? tour.name[0]}</strong>
                  <small>
                    {uniqRun(templates[tour.slug]).map(cityName).join(" → ")}, {tour.days} {dayWord(tour.days)}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </dialog>
      )}
    </section>
  );
}
