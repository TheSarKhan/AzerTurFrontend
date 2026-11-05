"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Baby,
  Landmark,
  LocateFixed,
  MapPin,
  Music,
  PartyPopper,
  Search,
  Sparkles,
  Store,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import type { Locale } from "@/lib/travel";

type EventView = {
  slug: string;
  titleEn: string;
  titleRu: string;
  titleAz: string;
  category: string;
  citySlug: string;
  cityNameEn: string;
  cityNameRu: string;
  cityNameAz: string;
  venueName: string;
  startsAt: string;
  endsAt: string;
  timeKnown: boolean;
  free: boolean;
  priceFromMinor: number | null;
  currency: string;
  image: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
};
type EventDetailData = {
  event: EventView;
  descriptionEn: string;
  descriptionRu: string;
  descriptionAz: string;
  address: string;
  ticketUrl: string | null;
};
type City = { slug: string; nameEn: string; nameRu: string; nameAz: string };
type PageData = { items: EventView[]; total: number };

const PAGE = 24;
const CATEGORIES = ["CONCERT", "FESTIVAL", "SPORT", "CULTURE", "MARKET", "FOOD", "FAMILY", "OTHER"] as const;
const ICONS = { CONCERT: Music, FESTIVAL: PartyPopper, SPORT: Trophy, CULTURE: Landmark, MARKET: Store, FOOD: UtensilsCrossed, FAMILY: Baby, OTHER: Sparkles };
const RADII = [10, 25, 50, 100];
const tag = (l: Locale) => (l === "az" ? "az-AZ" : l === "ru" ? "ru-RU" : "en-GB");

function useText(l: Locale) {
  const t = (en: string, ru: string, az: string) => (l === "az" ? az : l === "ru" ? ru : en);
  const i = l === "az" ? 2 : l === "ru" ? 1 : 0;
  const categories: Record<string, string> = {
    CONCERT: t("Concerts", "Концерты", "Konsertlər"),
    FESTIVAL: t("Festivals", "Фестивали", "Festivallar"),
    SPORT: t("Sport", "Спорт", "İdman"),
    CULTURE: t("Culture", "Культура", "Mədəniyyət"),
    MARKET: t("Markets", "Ярмарки", "Yarmarkalar"),
    FOOD: t("Food", "Еда", "Yemək"),
    FAMILY: t("Family", "Семья", "Ailə"),
    OTHER: t("Other", "Другое", "Digər"),
  };
  const title = (e: EventView) => [e.titleEn, e.titleRu, e.titleAz][i] || e.titleEn;
  const cityOf = (e: EventView) => [e.cityNameEn, e.cityNameRu, e.cityNameAz][i];
  return { t, categories, title, cityOf };
}

const MONTHS: Record<Locale, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  az: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
};
const BAKU_OFFSET_MS = 4 * 3600_000; // Azerbaijan has no daylight saving time

/** Dates are shown in Baku time; an event with only a date never gets a clock time.
 *  Month names are listed here rather than taken from Intl, which lacks Azerbaijani data in some browsers. */
function when(e: Pick<EventView, "startsAt" | "endsAt" | "timeKnown">, l: Locale) {
  const parts = (iso: string) => {
    const d = new Date(Date.parse(iso) + BAKU_OFFSET_MS);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), hm: d.toISOString().slice(11, 16) };
  };
  const day = (x: ReturnType<typeof parts>) => (l === "en" ? `${x.d} ${MONTHS.en[x.m]} ${x.y}` : `${x.d} ${MONTHS[l][x.m]} ${x.y}`);
  const s = parts(e.startsAt), f = parts(e.endsAt);
  const same = s.y === f.y && s.m === f.m && s.d === f.d;
  if (!e.timeKnown) return same ? day(s) : `${day(s)} – ${day(f)}`;
  return same ? `${day(s)} · ${s.hm}–${f.hm}` : `${day(s)} ${s.hm} – ${day(f)} ${f.hm}`;
}
function price(e: EventView, l: Locale, t: ReturnType<typeof useText>["t"]) {
  if (e.free) return t("Free", "Бесплатно", "Pulsuz");
  if (e.priceFromMinor == null) return "";
  const amount = new Intl.NumberFormat(tag(l), { style: "currency", currency: e.currency, maximumFractionDigits: e.priceFromMinor % 100 ? 2 : 0 }).format(e.priceFromMinor / 100);
  return `${t("from", "от", "başlayaraq")} ${amount}`;
}
const mapsUrl = (e: Pick<EventView, "latitude" | "longitude">) => `https://www.google.com/maps/search/?api=1&query=${e.latitude},${e.longitude}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

function Banner({ category }: { category: string }) {
  const Icon = ICONS[category as keyof typeof ICONS] ?? Sparkles;
  return (
    <div className={"ev-banner " + category} aria-hidden="true">
      <Icon size={34} strokeWidth={1.4} />
    </div>
  );
}

export function EventsPage({ locale: l, go }: { locale: Locale; go: (p: string) => void }) {
  const { t, categories, title, cityOf } = useText(l);
  const [cities, setCities] = useState<City[]>([]),
    [city, setCity] = useState(""),
    [category, setCategory] = useState(""),
    [q, setQ] = useState(""),
    [mode, setMode] = useState<"city" | "near">("city"),
    [radius, setRadius] = useState(25),
    [point, setPoint] = useState<{ lat: number; lng: number } | null>(null),
    [geo, setGeo] = useState<"idle" | "asking" | "denied" | "unsupported">("idle"),
    [data, setData] = useState<PageData | null>(null),
    [items, setItems] = useState<EventView[]>([]),
    [page, setPage] = useState(0),
    [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      setCity(localStorage.getItem("azertur-events-city") || "");
    } catch {}
    fetch("/api/cities").then((r) => (r.ok ? r.json() : [])).then(setCities).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setQuery(q.trim()), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [q]);
  useEffect(() => { setPage(0); }, [city, category, query, mode, radius, point]);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    const p = new URLSearchParams({ size: String(PAGE), page: String(page) });
    if (category) p.set("category", category);
    if (query) p.set("q", query);
    if (mode === "near" && point) {
      p.set("lat", String(point.lat));
      p.set("lng", String(point.lng));
      p.set("radiusKm", String(radius));
    } else if (city) p.set("city", city);
    fetch("/api/events?" + p, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: PageData) => {
        setData(d);
        setItems((old) => (page === 0 ? d.items : [...old, ...d.items]));
        setState("ready");
      })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [city, category, query, mode, radius, point, page]);

  const chooseCity = (slug: string) => {
    setMode("city");
    setCity(slug);
    try { localStorage.setItem("azertur-events-city", slug); } catch {}
  };
  // Location is requested only when the visitor asks for it, and is rounded to about 1 km.
  const nearMe = useCallback(() => {
    if (!navigator.geolocation) return setGeo("unsupported");
    setGeo("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: round2(pos.coords.latitude), lng: round2(pos.coords.longitude) });
        setMode("near");
        setGeo("idle");
      },
      () => { setGeo("denied"); setMode("city"); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  const open = (slug: string) => go("/events/" + slug);
  return (
    <section className="events-page container page-content">
      <header className="ev-head">
        <h1>{t("What’s on in Azerbaijan", "Что происходит в Азербайджане", "Azərbaycanda nə var")}</h1>
        <p>{t("Concerts, festivals and shows for your dates. Browse by city or see what is near you.", "Концерты, фестивали и шоу на ваши даты. Выберите город или посмотрите, что рядом.", "Tarixlərinizə uyğun konsertlər, festivallar və şoular. Şəhər seçin və ya yaxınlıqdakılara baxın.")}</p>
      </header>
      <div className="ev-controls">
        <div className="ev-tabs" role="group" aria-label={t("City", "Город", "Şəhər")}>
          <button aria-pressed={mode === "city" && city === ""} onClick={() => chooseCity("")}>{t("All cities", "Все города", "Bütün şəhərlər")}</button>
          {cities.map((c) => (
            <button key={c.slug} aria-pressed={mode === "city" && city === c.slug} onClick={() => chooseCity(c.slug)}>{[c.nameEn, c.nameRu, c.nameAz][l === "az" ? 2 : l === "ru" ? 1 : 0]}</button>
          ))}
          <button className="ev-near" aria-pressed={mode === "near"} disabled={geo === "asking"} onClick={nearMe}>
            <LocateFixed size={16} />{geo === "asking" ? t("Locating…", "Определяем…", "Müəyyən edilir…") : t("Near me", "Рядом со мной", "Yaxınlıqda")}
          </button>
        </div>
        <div className="ev-filters">
          <label className="ev-search"><Search size={16} /><input type="search" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder={t("Search events or venues", "Поиск событий и мест", "Tədbir və ya məkan axtar")} aria-label={t("Search", "Поиск", "Axtar")} /></label>
          {mode === "near" && (
            <label className="ev-radius">{t("Within", "В радиусе", "Məsafə")}
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>{RADII.map((r) => <option key={r} value={r}>{r} km</option>)}</select>
            </label>
          )}
        </div>
        <div className="ev-chips" role="group" aria-label={t("Category", "Категория", "Kateqoriya")}>
          <button aria-pressed={category === ""} onClick={() => setCategory("")}>{t("All", "Все", "Hamısı")}</button>
          {CATEGORIES.map((c) => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{categories[c]}</button>)}
        </div>
        {(geo === "denied" || geo === "unsupported") && (
          <p role="status" className="ev-note">{geo === "denied" ? t("We could not use your location. Pick a city instead.", "Не удалось определить местоположение. Выберите город.", "Məkanınızı müəyyən etmək olmadı. Şəhər seçin.") : t("This browser cannot share a location. Pick a city instead.", "Браузер не передаёт местоположение. Выберите город.", "Bu brauzer məkan paylaşa bilmir. Şəhər seçin.")}</p>
        )}
        {mode === "near" && <p className="ev-note">{t("Your location is only used to find nearby events and is not stored.", "Местоположение используется только для поиска событий рядом и не сохраняется.", "Məkanınız yalnız yaxınlıqdakı tədbirləri tapmaq üçün istifadə olunur və saxlanılmır.")}</p>}
      </div>
      {state === "error" && (
        <p role="alert" className="ev-empty">{t("Events could not be loaded. Check your connection and try again.", "Не удалось загрузить события. Проверьте соединение.", "Tədbirləri yükləmək olmadı. Bağlantını yoxlayın.")}</p>
      )}
      {state !== "error" && state === "ready" && items.length === 0 && (
        <p className="ev-empty">{t("No events found — try another date or city.", "Событий не найдено — попробуйте другую дату или город.", "Tədbir tapılmadı — başqa tarix və ya şəhər sınayın.")}</p>
      )}
      {state === "loading" && items.length === 0 && <p role="status" className="ev-empty">{t("Loading…", "Загрузка…", "Yüklənir…")}</p>}
      <ul className="ev-grid">
        {items.map((e) => (
          <li key={e.slug}>
            <article className="ev-card">
              <a href={`/${l}/events/${e.slug}`} onClick={(x) => { x.preventDefault(); open(e.slug); }}>
                {e.image ? <img src={e.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <Banner category={e.category} />}
                <div className="ev-body">
                  <p className="ev-meta">{categories[e.category]} · {cityOf(e)}</p>
                  <h2>{title(e)}</h2>
                  <p className="ev-when">{when(e, l)}</p>
                  <p className="ev-venue"><MapPin size={14} />{e.venueName}</p>
                  <p className="ev-foot">
                    <span>{price(e, l, t)}</span>
                    {e.distanceKm != null && <strong>{e.distanceKm} km</strong>}
                  </p>
                </div>
              </a>
            </article>
          </li>
        ))}
      </ul>
      {data && items.length < data.total && (
        <div className="ev-more"><button onClick={() => setPage((p) => p + 1)} disabled={state === "loading"}>{t("Show more", "Показать ещё", "Daha çox göstər")}</button></div>
      )}
    </section>
  );
}

export function EventDetail({ locale: l, slug, go }: { locale: Locale; slug: string; go: (p: string) => void }) {
  const { t, categories, title, cityOf } = useText(l);
  const [d, setD] = useState<EventDetailData | null>(null),
    [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    fetch("/api/events/" + encodeURIComponent(slug), { signal: controller.signal })
      .then((r) => (r.status === 404 ? "missing" : r.ok ? r.json() : Promise.reject()))
      .then((v) => { if (v === "missing") setState("missing"); else { setD(v); setState("ready"); } })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [slug]);
  useEffect(() => { if (d) document.title = title(d.event) + " — Azertur"; }, [d, l]); // eslint-disable-line react-hooks/exhaustive-deps
  const back = (
    <a className="ev-back" href={`/${l}/events`} onClick={(x) => { x.preventDefault(); go("/events"); }}>
      <ArrowLeft size={16} />{t("All events", "Все события", "Bütün tədbirlər")}
    </a>
  );
  if (state !== "ready" || !d)
    return (
      <section className="events-page container page-content">
        {back}
        <p role={state === "loading" ? "status" : "alert"} className="ev-empty">
          {state === "loading" ? t("Loading…", "Загрузка…", "Yüklənir…") : state === "missing" ? t("This event is no longer available.", "Это событие больше недоступно.", "Bu tədbir artıq mövcud deyil.") : t("The event could not be loaded.", "Не удалось загрузить событие.", "Tədbiri yükləmək olmadı.")}
        </p>
      </section>
    );
  const e = d.event;
  const text = [d.descriptionEn, d.descriptionRu, d.descriptionAz][l === "az" ? 2 : l === "ru" ? 1 : 0] || d.descriptionEn;
  return (
    <section className="events-page container page-content ev-detail">
      {back}
      {e.image ? <img className="ev-hero" src={e.image} alt="" referrerPolicy="no-referrer" /> : <Banner category={e.category} />}
      <p className="ev-meta">{categories[e.category]} · {cityOf(e)}</p>
      <h1>{title(e)}</h1>
      <dl className="ev-facts">
        <div><dt>{t("When", "Когда", "Nə vaxt")}</dt><dd>{when(e, l)}{!e.timeKnown && <small>{t("Start time: check the organiser’s page.", "Время начала: см. страницу организатора.", "Başlama saatı: təşkilatçının səhifəsinə baxın.")}</small>}</dd></div>
        <div><dt>{t("Where", "Где", "Harada")}</dt><dd>{e.venueName}{d.address && <small>{d.address}</small>}</dd></div>
        {price(e, l, t) && <div><dt>{t("Price", "Цена", "Qiymət")}</dt><dd>{price(e, l, t)}</dd></div>}
      </dl>
      {text && <p className="ev-text">{text}</p>}
      <div className="ev-actions">
        {d.ticketUrl && <a className="button" href={d.ticketUrl} target="_blank" rel="noopener noreferrer">{t("Tickets and details", "Билеты и подробности", "Biletlər və ətraflı məlumat")}<ArrowUpRight size={16} /></a>}
        <a className="button outline" href={mapsUrl(e)} target="_blank" rel="noopener noreferrer"><MapPin size={16} />{t("Open in maps", "Открыть на карте", "Xəritədə aç")}</a>
      </div>
    </section>
  );
}
