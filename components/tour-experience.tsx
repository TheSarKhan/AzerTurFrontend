"use client";
import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CalendarDays,
  Users,
  Clock,
  Mountain,
  Car,
  BedDouble,
  Compass,
  Route,
  ClipboardCheck,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  Plus,
  Landmark,
  Amphora,
  HeartPulse,
  Tickets,
  Building2,
  Footprints,
  Handshake,
} from "lucide-react";
import {
  tours,
  money,
  rates,
  dateLimit,
  type Tour,
  type Locale,
  type Currency,
} from "@/lib/travel";
import {
  homeCategories,
  homeCopy,
  homeDestinations,
  homeText,
  type HomeText,
} from "@/lib/homepage-content";
import {
  tourCopy as copy,
  tourMedia,
  mediaAlt,
  beforeQuestions,
} from "@/lib/tour-content";
import {
  defaultDiscovery,
  readDiscovery,
  discoverySearch,
  bookingSearch,
  discoverTours,
  type Discovery,
} from "@/lib/tour-discovery";

type Props = { locale: Locale; currency: Currency; go: (path: string) => void };
function PageLink({
  to,
  children,
  className = "",
  locale,
  go,
  ...rest
}: Pick<Props, "locale" | "go"> & {
  to: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  function click(e: MouseEvent<HTMLAnchorElement>) {
    if (
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault();
      go(to);
    }
  }
  return (
    <a href={"/" + locale + to} onClick={click} className={className} {...rest}>
      {children}
    </a>
  );
}
function TravelImage({
  name,
  locale,
  eager = false,
  className = "",
}: {
  name: string;
  locale: Locale;
  eager?: boolean;
  className?: string;
}) {
  return (
    <Image
      className={className}
      src={"/images/homepage-v3/" + name + ".png"}
      width={1600}
      height={1000}
      alt={homeText(mediaAlt[name] || mediaAlt.khinalug, locale)}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      sizes={eager ? "100vw" : "(max-width: 700px) 100vw, 640px"}
    />
  );
}
function SampleCard({
  tour,
  locale,
  currency,
  go,
  date,
  pax,
  compact = false,
}: Props & { tour: Tour; date: string; pax: number; compact?: boolean }) {
  const t = (v: HomeText) => homeText(v, locale),
    i = locale === "az" ? 2 : locale === "ru" ? 1 : 0;
  const to = "/tours/" + tour.slug + bookingSearch(date, pax);
  return (
    <article className={"tx-card" + (compact ? " tx-related-card" : "")}>
      <PageLink
        to={to}
        locale={locale}
        go={go}
        className="tx-card-photo"
        aria-label={tour.name[i]}
      >
        <TravelImage name={tourMedia[tour.slug].image} locale={locale} />
      </PageLink>
      <div className="tx-card-copy">
        <p className="tx-location">
          <MapPin size={14} />
          {tour.region}
        </p>
        <h3>
          <PageLink to={to} locale={locale} go={go}>
            {tour.name[i]}
          </PageLink>
        </h3>
        {!compact && (
          <p className="tx-card-description">{tour.description[i]}</p>
        )}
        <p className="tx-card-facts">
          <Clock size={16} />
          {tour.days} {t(tour.days === 1 ? copy.oneDay : copy.days)}
          <span aria-hidden="true">·</span>
          <Mountain size={16} />
          {tour.difficulty[i]}
        </p>
        <div className="tx-card-bottom">
          <div>
            <p>
              {t(copy.from)}{" "}
              <strong>
                {money(tour.base * rates[currency], currency, locale)}
              </strong>
              <span> / {t(copy.person)}</span>
            </p>
            <small>{t(copy.samplePrice)}</small>
          </div>
          <PageLink to={to} locale={locale} go={go} className="tx-text-link">
            {t(copy.itinerary)}
            <ArrowRight size={16} />
          </PageLink>
        </div>
      </div>
    </article>
  );
}
const categoryIcons = {
  history: Landmark,
  culture: Amphora,
  medical: HeartPulse,
  nature: Mountain,
  entertainment: Tickets,
  business: Building2,
};

export function TourCatalog({ locale, currency, go }: Props) {
  const t = (v: HomeText) => homeText(v, locale),
    fmt = (n: number) => money(n * rates[currency], currency, locale);
  const [filters, setFilters] = useState<Discovery>(defaultDiscovery);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterDialog = useRef<HTMLDialogElement>(null),
    results = useRef<HTMLDivElement>(null);
  const dialogTitle = useId();
  useEffect(() => {
    const sync = () => setFilters(readDiscovery(location.search));
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("azertur:navigate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("azertur:navigate", sync);
    };
  }, []);
  useEffect(() => {
    if (filterOpen && !filterDialog.current?.open)
      filterDialog.current?.showModal();
    else if (!filterOpen && filterDialog.current?.open)
      filterDialog.current?.close();
  }, [filterOpen]);
  function update(patch: Partial<Discovery>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    history.replaceState({}, "", location.pathname + discoverySearch(next));
  }
  function reset() {
    update({ ...defaultDiscovery(), date: filters.date, pax: filters.pax });
  }
  function toggle(key: "regions" | "durations" | "activities", value: string) {
    update({
      [key]: filters[key].includes(value)
        ? filters[key].filter((v) => v !== value)
        : [...filters[key], value],
    });
  }
  const list = discoverTours(tours, filters),
    selectedCount =
      filters.regions.length +
      filters.durations.length +
      filters.activities.length +
      (filters.maxPrice < 500 ? 1 : 0) +
      (filters.category !== "all" ? 1 : 0);
  const count = `${list.length} ${t(list.length === 1 ? copy.sampleJourney : list.length === 0 ? copy.noSampleJourneys : copy.sampleJourneys)}`;
  function filterFields() {
    return (
      <>
        <div className="tx-filter-heading">
          <h2>{t(copy.refine)}</h2>
          <button type="button" className="tx-text-link" onClick={reset}>
            {t(copy.reset)}
          </button>
        </div>
        <fieldset>
          <legend>{t(homeCopy.destination)}</legend>
          {homeDestinations.map((d) => (
            <label key={d.region}>
              <input
                type="checkbox"
                checked={filters.regions.includes(d.region)}
                onChange={() => toggle("regions", d.region)}
              />
              {t(d.name)}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t(copy.duration)}</legend>
          {[
            ["day", copy.day],
            ["weekend", copy.weekend],
            ["extended", copy.long],
          ].map(([value, label]) => (
            <label key={value as string}>
              <input
                type="checkbox"
                checked={filters.durations.includes(value as string)}
                onChange={() => toggle("durations", value as string)}
              />
              {t(label as HomeText)}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t(copy.activity)}</legend>
          {[
            ["easy", copy.easy],
            ["moderate", copy.moderate],
          ].map(([value, label]) => (
            <label key={value as string}>
              <input
                type="checkbox"
                checked={filters.activities.includes(value as string)}
                onChange={() => toggle("activities", value as string)}
              />
              {t(label as HomeText)}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t(copy.priceRange)}</legend>
          <input
            type="range"
            min="0"
            max="500"
            step="5"
            value={filters.maxPrice}
            aria-label={t(copy.maxPrice)}
            aria-valuetext={fmt(filters.maxPrice)}
            onChange={(e) => update({ maxPrice: Number(e.target.value) })}
          />
          <div className="tx-range-labels">
            <span>{fmt(0)}</span>
            <output>{fmt(filters.maxPrice)}</output>
          </div>
          <p>{t(copy.samplePrices)}</p>
        </fieldset>
      </>
    );
  }
  return (
    <div className="tour-experience tx-catalog">
      <div className="tx-container tx-catalog-intro">
        <nav className="tx-breadcrumb" aria-label={t(copy.home)}>
          <PageLink to="/" locale={locale} go={go}>
            {t(copy.home)}
          </PageLink>
          <span>/</span>
          <span>{t(copy.tours)}</span>
        </nav>
        <h1>{t(copy.catalogTitle)}</h1>
        <p>{t(copy.catalogIntro)}</p>
      </div>
      <div className="tx-panorama">
        <TravelImage name="khinalug" locale={locale} eager />
      </div>
      <section
        className="tx-container tx-search-section"
        aria-label={t(homeCopy.search)}
      >
        <form
          className="tx-search"
          onSubmit={(e) => {
            e.preventDefault();
            results.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          <label>
            <MapPin />
            <span>
              <b>{t(homeCopy.destination)}</b>
              <select
                aria-label={t(homeCopy.destination)}
                value={
                  filters.regions.length === 1 ? filters.regions[0] : "all"
                }
                onChange={(e) =>
                  update({
                    regions: e.target.value === "all" ? [] : [e.target.value],
                  })
                }
              >
                <option value="all">{t(copy.allDestinations)}</option>
                {homeDestinations.map((d) => (
                  <option key={d.region} value={d.region}>
                    {t(d.name)}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label>
            <CalendarDays />
            <span>
              <b>{t(homeCopy.date)}</b>
              <input
                type="date"
                aria-label={t(homeCopy.date)}
                min={dateLimit(3)}
                max={dateLimit(365)}
                value={filters.date}
                onInput={(e) => update({ date: e.currentTarget.value })}
                onChange={(e) => update({ date: e.target.value })}
              />
            </span>
          </label>
          <label>
            <Users />
            <span>
              <b>{t(copy.travelers)}</b>
              <select
                value={filters.pax}
                aria-label={t(copy.travelers)}
                onChange={(e) => update({ pax: Number(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} · {t(copy.travelers)}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <button className="tx-button" type="submit">
            {t(homeCopy.search)}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="tx-note">{t(homeCopy.availability)}</p>
      </section>
      <section
        className="tx-container tx-categories"
        aria-label={t(homeCopy.categories)}
      >
        {homeCategories.map((cat) => {
          const Icon = categoryIcons[cat.id as keyof typeof categoryIcons];
          return (
            <button
              type="button"
              key={cat.id}
              aria-pressed={filters.category === cat.id}
              onClick={() =>
                update({
                  category: filters.category === cat.id ? "all" : cat.id,
                })
              }
            >
              <Icon size={35} strokeWidth={1.4} />
              <strong>{t(cat.label)}</strong>
              <span>{t(cat.description)}</span>
            </button>
          );
        })}
      </section>
      <section className="tx-container tx-catalog-layout">
        <aside
          className="tx-filters tx-desktop-filters"
          aria-label={t(copy.filters)}
        >
          {filterFields()}
        </aside>
        <div
          className="tx-results"
          ref={results}
          id="tour-results"
          tabIndex={-1}
        >
          <div className="tx-results-toolbar">
            <h2 aria-live="polite" aria-atomic="true">
              {count}
            </h2>
            <button
              type="button"
              className="tx-filter-trigger"
              onClick={() => setFilterOpen(true)}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal size={18} />
              {t(copy.filters)}
              {selectedCount > 0 ? " (" + selectedCount + ")" : ""}
            </button>
            <label>
              <span className="sr-only">{t(copy.sort)}</span>
              <select
                aria-label={t(copy.sort)}
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
              >
                <option value="recommended">{t(copy.recommended)}</option>
                <option value="price-low">{t(copy.priceLow)}</option>
                <option value="price-high">{t(copy.priceHigh)}</option>
                <option value="duration">{t(copy.shortest)}</option>
              </select>
            </label>
          </div>
          {list.length > 0 ? (
            <div className="tx-card-grid">
              {list.map((tour) => (
                <SampleCard
                  key={tour.slug}
                  tour={tour}
                  locale={locale}
                  currency={currency}
                  go={go}
                  date={filters.date}
                  pax={filters.pax}
                />
              ))}
              <div className="tx-custom-card">
                <Compass size={36} strokeWidth={1.2} />
                <h2>{t(copy.customTitle)}</h2>
                <p>{t(copy.customBody)}</p>
                <PageLink
                  to={"/plan" + bookingSearch(filters.date, filters.pax)}
                  locale={locale}
                  go={go}
                  className="tx-button tx-dark"
                >
                  {t(copy.customAction)}
                  <ArrowRight size={17} />
                </PageLink>
                <Route
                  size={120}
                  strokeWidth={0.6}
                  className="tx-custom-art"
                  aria-hidden="true"
                />
              </div>
            </div>
          ) : (
            <div className="tx-empty">
              <Mountain size={44} strokeWidth={1.2} />
              <h3>{t(copy.noMatches)}</h3>
              <button
                type="button"
                className="tx-button tx-dark"
                onClick={reset}
              >
                {t(copy.clearFilters)}
              </button>
              <PageLink
                to={
                  "/request?route=" +
                  encodeURIComponent(
                    t(
                      homeCategories.find((c) => c.id === filters.category)
                        ?.label || copy.customTitle,
                    ),
                  )
                }
                locale={locale}
                go={go}
                className="tx-text-link"
              >
                {t(copy.askTeam)}
                <ArrowRight size={18} />
              </PageLink>
            </div>
          )}
          <p className="tx-note">{t(copy.illustrative)}</p>
        </div>
      </section>
      <section className="tx-container tx-process">
        <h2>{t(copy.process)}</h2>
        <ol>
          {[
            [copy.browse, copy.browseText, Route],
            [copy.customize, copy.customizeText, SlidersHorizontal],
            [copy.send, copy.sendText, ClipboardCheck],
          ].map(([title, body, Icon], i) => {
            const StepIcon = Icon as typeof Route;
            return (
              <li key={i}>
                <span>0{i + 1}</span>
                <StepIcon size={30} strokeWidth={1.3} />
                <div>
                  <h3>{t(title as HomeText)}</h3>
                  <p>{t(body as HomeText)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="tx-contact-line">
          <p>{t(copy.contactPrompt)}</p>
          <PageLink
            to="/contact"
            locale={locale}
            go={go}
            className="tx-text-link"
          >
            {t(copy.contact)}
            <ArrowRight size={16} />
          </PageLink>
        </div>
      </section>
      <p className="tx-note tx-imagery">{t(copy.imagery)}</p>
      <dialog
        ref={filterDialog}
        className="tx-dialog tx-filter-dialog"
        aria-labelledby={dialogTitle}
        onClose={() => setFilterOpen(false)}
      >
        <div className="tx-dialog-top">
          <h2 id={dialogTitle}>{t(copy.filters)}</h2>
          <button
            type="button"
            className="tx-icon-button"
            aria-label={t(copy.close)}
            onClick={() => setFilterOpen(false)}
            autoFocus
          >
            <X />
          </button>
        </div>
        <div className="tx-filters">{filterFields()}</div>
        <button
          className="tx-button tx-filter-apply"
          type="button"
          onClick={() => {
            setFilterOpen(false);
            results.current?.focus({ preventScroll: true });
          }}
        >
          {t(copy.showResults)} ({list.length})<ArrowRight size={17} />
        </button>
      </dialog>
    </div>
  );
}

export function TourDetail({
  slug,
  locale,
  currency,
  go,
}: Props & { slug: string }) {
  const tour = tours.find((t) => t.slug === slug),
    t = (v: HomeText) => homeText(v, locale),
    i = locale === "az" ? 2 : locale === "ru" ? 1 : 0;
  const [date, setDate] = useState(""),
    [pax, setPax] = useState(2),
    [gallery, setGallery] = useState(false),
    [photo, setPhoto] = useState(0),
    [active, setActive] = useState("overview");
  const dialog = useRef<HTMLDialogElement>(null),
    options = useRef<HTMLFormElement>(null),
    galleryTitle = useId();
  useEffect(() => {
    const f = readDiscovery(location.search);
    setDate(f.date);
    setPax(f.pax);
  }, [slug]);
  useEffect(() => {
    if (gallery && !dialog.current?.open) dialog.current?.showModal();
    else if (!gallery && dialog.current?.open) dialog.current?.close();
  }, [gallery]);
  if (!tour)
    return (
      <div className="tx-container tx-empty">
        <h1>{t(copy.noMatches)}</h1>
        <PageLink to="/tours" locale={locale} go={go}>
          {t(copy.back)}
        </PageLink>
      </div>
    );
  const media = tourMedia[tour.slug],
    fmt = (n: number) => money(n * rates[currency], currency, locale),
    plan = "/plan" + bookingSearch(date, pax, tour.slug);
  const navProps = { locale, go };
  function setOptions(nextDate: string, nextPax: number) {
    setDate(nextDate);
    setPax(nextPax);
    history.replaceState(
      {},
      "",
      location.pathname + bookingSearch(nextDate, nextPax),
    );
  }
  function openPhoto(n: number) {
    setPhoto(n);
    setGallery(true);
  }
  function movePhoto(n: number) {
    setPhoto((v) => (v + n + media.gallery.length) % media.gallery.length);
  }
  const highlight =
    tour.image === "mountains"
      ? [
          {
            Icon: Mountain,
            title: [
              "Mountain village walks",
              "Горные прогулки",
              "Dağ kəndində gəzinti",
            ] as HomeText,
            body: [
              "Quiet paths and wide views.",
              "Тихие тропы и широкие виды.",
              "Sakit cığırlar və geniş mənzərələr.",
            ] as HomeText,
          },
          {
            Icon: Handshake,
            title: [
              "Local hospitality",
              "Местное гостеприимство",
              "Yerli qonaqpərvərlik",
            ] as HomeText,
            body: [
              "Meet local life at your own pace.",
              "Знакомство с местной жизнью в своём темпе.",
              "Yerli həyatı öz tempində tanı.",
            ] as HomeText,
          },
          {
            Icon: Route,
            title: [
              "Scenic roads",
              "Живописные дороги",
              "Mənzərəli yollar",
            ] as HomeText,
            body: [
              "The journey is part of the experience.",
              "Дорога — часть впечатлений.",
              "Yol özü də təcrübənin bir hissəsidir.",
            ] as HomeText,
          },
        ]
      : [
          {
            Icon: Landmark,
            title: [
              "Living heritage",
              "Живое наследие",
              "Yaşayan irs",
            ] as HomeText,
            body: [
              "Places with stories to discover.",
              "Места с историями для открытий.",
              "Hekayələri ilə kəşf ediləsi yerlər.",
            ] as HomeText,
          },
          {
            Icon: Amphora,
            title: ["Local life", "Местная жизнь", "Yerli həyat"] as HomeText,
            body: [
              "Time for crafts, culture and tea.",
              "Время для ремёсел, культуры и чая.",
              "Sənətkarlıq, mədəniyyət və çay üçün vaxt.",
            ] as HomeText,
          },
          {
            Icon: Footprints,
            title: [
              "Your own pace",
              "В своём темпе",
              "Öz tempində",
            ] as HomeText,
            body: [
              "Shape the day around your interests.",
              "День вокруг ваших интересов.",
              "Günü maraqlarına uyğun qur.",
            ] as HomeText,
          },
        ];
  const stops = [
    ...tour.stops,
    ...(tour.stops[tour.stops.length - 1] === "Baku" ? [] : ["Baku"]),
  ];
  return (
    <div className="tour-experience tx-detail">
      <div className="tx-container tx-detail-intro">
        <nav className="tx-breadcrumb" aria-label={t(copy.back)}>
          <PageLink to="/" {...navProps}>
            {t(copy.home)}
          </PageLink>
          <span>/</span>
          <PageLink to="/tours" {...navProps}>
            {t(copy.tours)}
          </PageLink>
          <span>/</span>
          <span>{tour.region}</span>
        </nav>
        <PageLink to="/tours" {...navProps} className="tx-mobile-back">
          <ArrowLeft size={17} />
          {t(copy.back)}
        </PageLink>
        <h1>{tour.name[i]}</h1>
        <p className="tx-subtitle">{t(media.subtitle)}</p>
        <ul className="tx-facts">
          <li>
            <MapPin />
            {tour.region}
          </li>
          <li>
            <Clock />
            {tour.days} {t(tour.days === 1 ? copy.oneDay : copy.days)}
            {tour.days > 1
              ? ", " +
                (tour.days - 1) +
                " " +
                t(tour.days === 2 ? copy.night : copy.nights)
              : ""}
          </li>
          <li>
            <Mountain />
            {tour.difficulty[i]}
          </li>
          <li>
            <Car />
            {t(copy.starts)}
          </li>
        </ul>
        <p className="tx-sample-label">{t(copy.sampleItinerary)}</p>
      </div>
      <div
        className={
          "tx-gallery tx-container" +
          (media.gallery.length === 2 ? " tx-gallery-two" : "")
        }
      >
        {media.gallery.map((name, n) => (
          <button
            key={name}
            type="button"
            onClick={() => openPhoto(n)}
            aria-label={t(copy.allPhotos) + " · " + (n + 1)}
          >
            <TravelImage name={name} locale={locale} eager={n === 0} />
            {n === 0 && (
              <span>
                <Images size={17} />
                {t(copy.allPhotos)}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="tx-container tx-detail-grid">
        <nav className="tx-anchor-nav" aria-label={t(copy.overview)}>
          {[
            ["overview", copy.overview],
            ["itinerary", copy.itineraryTab],
            ["services", copy.services],
            ["before", copy.before],
          ].map(([id, label]) => (
            <a
              key={id as string}
              href={"#" + id}
              aria-current={active === id ? "location" : undefined}
              onClick={() => setActive(id as string)}
            >
              {t(label as HomeText)}
            </a>
          ))}
        </nav>
        <aside className="tx-options-aside">
          <form
            id="trip-options"
            className="tx-options"
            ref={options}
            onSubmit={(e) => {
              e.preventDefault();
              go(plan);
            }}
          >
            <p className="tx-price">
              {t(copy.from)} <strong>{fmt(tour.base)}</strong>{" "}
              <span>/ {t(copy.person)}</span>
            </p>
            <p className="tx-sample-label">{t(copy.startingPrice)}</p>
            <label>
              <b>{t(copy.travelDate)}</b>
              <span>
                <CalendarDays size={18} />
                <input
                  type="date"
                  aria-label={t(copy.travelDate)}
                  min={dateLimit(3)}
                  max={dateLimit(365)}
                  value={date}
                  onInput={(e) => setOptions(e.currentTarget.value, pax)}
                  onChange={(e) => setOptions(e.target.value, pax)}
                />
              </span>
            </label>
            <label>
              <b>{t(copy.travelers)}</b>
              <span>
                <Users size={18} />
                <select
                  value={pax}
                  aria-label={t(copy.travelers)}
                  onChange={(e) => setOptions(date, Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, n) => (
                    <option key={n} value={n + 1}>
                      {n + 1} · {t(copy.travelers)}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <div className="tx-estimate">
              <span>{t(copy.total)}</span>
              <output>{fmt(tour.base * pax)}</output>
            </div>
            <p className="tx-price-helper">{t(copy.finalQuote)}</p>
            <button type="submit" className="tx-button">
              {t(copy.customizeTrip)}
              <ArrowRight size={18} />
            </button>
            <PageLink to="/login" {...navProps} className="tx-sign-in">
              {t(copy.signIn)}
            </PageLink>
            <ol className="tx-offer-steps">
              <li>
                <ClipboardCheck size={18} />
                {t(copy.request)}
              </li>
              <li aria-hidden="true">
                <ArrowRight size={16} />
              </li>
              <li>
                <Users size={18} />
                {t(copy.review)}
              </li>
              <li aria-hidden="true">
                <ArrowRight size={16} />
              </li>
              <li>
                <ClipboardCheck size={18} />
                {t(copy.offer)}
              </li>
            </ol>
          </form>
        </aside>
        <section id="overview" className="tx-overview">
          <h2>{t(copy.overviewTitle)}</h2>
          <p>{tour.description[i]}</p>
          <p>{t(copy.overviewNote)}</p>
          <div className="tx-highlights">
            {highlight.map(({ Icon, title, body }) => (
              <div key={title[0]}>
                <Icon size={36} strokeWidth={1.3} />
                <h3>{t(title)}</h3>
                <p>{t(body)}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="itinerary" className="tx-itinerary">
          <h2>{t(copy.routeTitle)}</h2>
          <div className="tx-route">
            <h3>{t(copy.routeOverview)}</h3>
            <ol>
              {stops.map((stop, n) => (
                <li key={stop + n}>
                  <span aria-hidden="true" />
                  {stop}
                </li>
              ))}
            </ol>
          </div>
          {tour.plans.map((day, n) => (
            <details key={n} open>
              <summary>
                <span className="tx-day-number">{n + 1}</span>
                <h3>
                  {t(copy.dayLabel)} {n + 1} — {day[i]}
                </h3>
                <Plus size={18} />
              </summary>
              <p>{t(media.itinerary[n])}</p>
            </details>
          ))}
          <p className="tx-sample-label">{t(copy.timing)}</p>
        </section>
        <section id="services" className="tx-services-section">
          <h2>{t(copy.chooseServices)}</h2>
          <div className="tx-services-grid">
            <div>
              {[
                { Icon: Car, label: copy.transfers },
                { Icon: Users, label: copy.guide },
                { Icon: BedDouble, label: copy.stay },
                { Icon: Compass, label: copy.experiences },
              ].map(({ Icon, label }) => (
                <PageLink
                  key={label[0]}
                  to={plan}
                  {...navProps}
                  className="tx-service"
                >
                  <Icon size={27} strokeWidth={1.4} />
                  <strong>{t(label)}</strong>
                  <span>{t(copy.separately)}</span>
                  <ArrowRight size={16} />
                </PageLink>
              ))}
            </div>
            <div className="tx-exclusions">
              <h3>{t(copy.notIncluded)}</h3>
              <p>{t(copy.exclusions)}</p>
              <p>{t(copy.priceNote)}</p>
            </div>
          </div>
        </section>
        <section className="tx-rhythm">
          <div>
            <h2>{t(copy.changeRhythm)}</h2>
            <p>{t(copy.customBody)}</p>
            <PageLink to={plan} {...navProps} className="tx-button tx-dark">
              {t(copy.makeYours)}
              <ArrowRight size={17} />
            </PageLink>
          </div>
          <TravelImage
            name={media.gallery[media.gallery.length - 1]}
            locale={locale}
          />
        </section>
        <section id="before" className="tx-before">
          <h2>{t(copy.before)}</h2>
          {beforeQuestions.map((q, n) => (
            <details key={n} open={n === 3}>
              <summary>
                {t(q.question)}
                <Plus size={18} />
              </summary>
              <p>{t(q.answer)}</p>
            </details>
          ))}
          <p className="tx-note">{t(copy.demo)}</p>
        </section>
        <section className="tx-related">
          <h2>{t(copy.keepExploring)}</h2>
          <div>
            {tours
              .filter((item) => item.slug !== slug)
              .map((item) => (
                <SampleCard
                  key={item.slug}
                  tour={item}
                  locale={locale}
                  currency={currency}
                  go={go}
                  date={date}
                  pax={pax}
                  compact
                />
              ))}
          </div>
        </section>
      </div>
      <p className="tx-note tx-imagery">{t(copy.imagery)}</p>
      <div className="tx-mobile-action">
        <div>
          <span>{t(copy.from)}</span>
          <strong>{fmt(tour.base)}</strong>
          <small>{t(copy.startingPrice)}</small>
        </div>
        <button
          type="button"
          className="tx-button"
          onClick={() => options.current?.requestSubmit()}
        >
          {t(copy.customizeTrip)}
          <ArrowRight size={17} />
        </button>
      </div>
      <dialog
        ref={dialog}
        className="tx-dialog tx-gallery-dialog"
        aria-labelledby={galleryTitle}
        onClose={() => setGallery(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            movePhoto(-1);
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            movePhoto(1);
          }
        }}
      >
        <div className="tx-dialog-top">
          <h2 id={galleryTitle}>{t(copy.gallery)}</h2>
          <button
            type="button"
            className="tx-icon-button"
            aria-label={t(copy.close)}
            autoFocus
            onClick={() => setGallery(false)}
          >
            <X />
          </button>
        </div>
        <TravelImage name={media.gallery[photo]} locale={locale} eager />
        <div className="tx-gallery-controls">
          <button
            className="tx-icon-button"
            type="button"
            onClick={() => movePhoto(-1)}
            aria-label={t(copy.previous)}
          >
            <ChevronLeft />
          </button>
          <p aria-live="polite">
            {photo + 1} / {media.gallery.length} ·{" "}
            {t(mediaAlt[media.gallery[photo]])}
          </p>
          <button
            className="tx-icon-button"
            type="button"
            onClick={() => movePhoto(1)}
            aria-label={t(copy.next)}
          >
            <ChevronRight />
          </button>
        </div>
      </dialog>
    </div>
  );
}
