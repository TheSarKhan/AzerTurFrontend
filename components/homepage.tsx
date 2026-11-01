"use client";
import Image from "next/image";
import { useState, type ReactNode, type MouseEvent } from "react";
import {
  ArrowRight,
  Search,
  MapPin,
  CalendarDays,
  Users,
  Landmark,
  Amphora,
  HeartPulse,
  Mountain,
  Tickets,
  Building2,
  Check,
  Route,
  ClipboardCheck,
  WalletCards,
  UserRound,
  MapPinned,
  FileCheck2,
  Plus,
} from "lucide-react";
import {
  homeCopy,
  homeText,
  homeCategories,
  homeDestinations,
  homeServices,
  homeSteps,
  homeBenefits,
  homeFaq,
  type HomeText,
} from "@/lib/homepage-content";
import { tours, dateLimit, type Locale } from "@/lib/travel";
type Props = { locale: Locale; go: (path: string) => void };
export default function Homepage({ locale, go }: Props) {
  const t = (text: HomeText) => homeText(text, locale);
  const [region, setRegion] = useState("all"),
    [date, setDate] = useState(""),
    [pax, setPax] = useState("2");
  const link = (to: string, children: ReactNode, className = "") => (
    <a
      key={to}
      className={className}
      href={"/" + locale + to}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey &&
          e.button === 0
        ) {
          e.preventDefault();
          go(to);
        }
      }}
    >
      {children}
    </a>
  );
  const picture = (src: string, alt: string, eager = false) => (
    <Image
      src={"/images/" + src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      sizes={
        eager
          ? "100vw"
          : "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 640px"
      }
      quality={85}
      width={1600}
      height={1000}
    />
  );
  return (
    <div className="home-v2">
      <section className="hv-hero">
        {picture(
          "homepage-v3/hero.png",
          t([
            "Illustrative Caucasus mountain village",
            "Иллюстрация горной деревни Кавказа",
            "Qafqaz dağ kəndinin illüstrativ görüntüsü",
          ]),
          true,
        )}
        <div className="hv-hero-copy hv-container">
          <h1>
            {t(homeCopy.title)}
            <br />
            {t(homeCopy.headline)}
          </h1>
          <p>
            {t(homeCopy.intro)}
            <br />
            {t(homeCopy.intro2)}
          </p>
          {link(
            "/tours",
            <>
              {t(homeCopy.explore)}
              <ArrowRight size={18} />
            </>,
            "hv-button",
          )}
        </div>
      </section>
      <div className="hv-container hv-discovery">
        <form
          className="hv-search"
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams({ region, date, pax });
            go("/tours?" + params);
          }}
        >
          <label>
            <MapPin />
            <span>
              <b>{t(homeCopy.destination)}</b>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                aria-label={t(homeCopy.destination)}
              >
                <option value="all">{t(homeCopy.where)}</option>
                {homeDestinations.map((d) => (
                  <option key={d.image} value={d.region}>
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
                min={dateLimit(3)}
                max={dateLimit(365)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onInput={(e) => setDate(e.currentTarget.value)}
                aria-label={t(homeCopy.date)}
              />
            </span>
          </label>
          <label>
            <Users />
            <span>
              <b>{t(homeCopy.travelers)}</b>
              <select
                value={pax}
                onChange={(e) => setPax(e.target.value)}
                aria-label={t(homeCopy.travelers)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} {t(i === 0 ? homeCopy.person : homeCopy.people)}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <button className="hv-button" type="submit">
            <Search size={20} />
            {t(homeCopy.search)}
          </button>
        </form>
        <p className="hv-availability">{t(homeCopy.availability)}</p>
      </div>
      <section className="hv-container hv-section hv-categories">
        <h2>{t(homeCopy.categories)}</h2>
        <div className="hv-category-grid">
          {homeCategories.map((cat, i) => {
            const Icon = [
              Landmark,
              Amphora,
              HeartPulse,
              Mountain,
              Tickets,
              Building2,
            ][i];
            return link(
              "/tours?category=" + cat.id,
              <>
                <Icon size={32} strokeWidth={1.4} />
                <h3>{t(cat.label)}</h3>
                <p>{t(cat.description)}</p>
              </>,
              "hv-category",
            );
          })}
        </div>
      </section>
      <section className="hv-container hv-section" id="destinations">
        <div className="hv-section-heading">
          <h2>{t(homeCopy.destinations)}</h2>
          {link(
            "/tours",
            <>
              {t(homeCopy.destinationsLink)}
              <ArrowRight size={17} />
            </>,
            "hv-text-link",
          )}
        </div>
        <div className="hv-destinations">
          {homeDestinations.map((d) => (
            <article key={d.image}>
              {link(
                "/tours?region=" +
                  d.region,
                <>
                  {picture(d.image, t(d.alt))}
                  <h3>{t(d.name)}</h3>
                  <p>{t(d.description)}</p>
                </>,
                "hv-destination",
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="hv-container hv-section" id="journeys">
        <div className="hv-section-heading">
          <div>
            <h2>{t(homeCopy.journeys)}</h2>
            <p>{t(homeCopy.journeysIntro)}</p>
          </div>
          {link(
            "/tours",
            <>
              {t(homeCopy.allTours)}
              <ArrowRight size={17} />
            </>,
            "hv-text-link",
          )}
        </div>
        <div className="hv-tour-grid">
          {[tours[2], tours[1], tours[0]].map((tour) => (
            <article className="hv-tour" key={tour.slug}>
              {link(
                "/tours/" + tour.slug,
                <>
                  {picture(
                    "homepage-v3/" +
                      {
                        "baku-discovery": "baku",
                        "sheki-gabala": "sheki",
                        "quba-khinalug": "khinalug",
                      }[tour.slug] +
                      ".png",
                    tour.region,
                  )}
                  <div className="hv-tour-copy">
                    <span>
                      <MapPin size={13} />
                      {tour.region}
                    </span>
                    <h3>
                      {tour.name[locale === "en" ? 0 : locale === "ru" ? 1 : 2]}
                    </h3>
                    <p>
                      {tour.days}{" "}
                      {t(tour.days === 1 ? homeCopy.day : homeCopy.days)}
                    </p>
                    <span className="hv-text-link">
                      {t(homeCopy.itinerary)}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </>,
              )}
            </article>
          ))}
        </div>
        <p className="hv-example-note">{t(homeCopy.examples)}</p>
      </section>
      <section className="hv-container hv-builder hv-section">
        <div>
          <h2>{t(homeCopy.builderTitle)}</h2>
          <p>{t(homeCopy.builderIntro)}</p>
          {link(
            "/plan",
            <>
              {t(homeCopy.create)}
              <ArrowRight size={18} />
            </>,
            "hv-button hv-dark",
          )}
          <ul>
            {homeServices.map((s) => (
              <li key={s[0]}>
                <Check size={18} />
                {t(s)}
              </li>
            ))}
          </ul>
        </div>
        <div className="hv-builder-images">
          {picture(
            "homepage-v3/guesthouse.png",
            t([
              "Illustrative mountain guesthouse terrace",
              "Иллюстрация террасы горного гостевого дома",
              "Dağ qonaq evinin illüstrativ terrası",
            ]),
          )}
          {picture(
            "homepage-v3/hiking.png",
            t([
              "Hikers on a mountain trail",
              "Поход по горной тропе",
              "Dağ cığırında yürüş",
            ]),
          )}
        </div>
      </section>
      <section className="hv-container hv-section">
        <h2>{t(homeCopy.process)}</h2>
        <ol className="hv-process">
          {homeSteps.map((s, i) => {
            const Icon = [Route, ClipboardCheck, WalletCards][i];
            return (
              <li key={s.title[0]}>
                <span>0{i + 1}</span>
                <Icon size={32} strokeWidth={1.4} />
                <div>
                  <h3>{t(s.title)}</h3>
                  <p>{t(s.description)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="hv-process-note">{t(homeCopy.processNote)}</p>
      </section>
      <section className="hv-hospitality hv-section">
        <div className="hv-hospitality-photo">
          {picture(
            "homepage-v3/tea.png",
            t([
              "Tea in an Azerbaijani armudu glass",
              "Чай в азербайджанском стакане армуду",
              "Azərbaycan armudu stəkanında çay",
            ]),
          )}
        </div>
        <div>
          <h2>{t(homeCopy.local)}</h2>
          <div className="hv-benefits">
            {homeBenefits.map((b, i) => {
              const Icon = [UserRound, MapPinned, FileCheck2][i];
              return (
                <div key={b.title[0]}>
                  <Icon size={32} strokeWidth={1.3} />
                  <div>
                    <h3>{t(b.title)}</h3>
                    <p>{t(b.description)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="hv-container hv-section hv-faq">
        <h2>{t(homeCopy.faq)}</h2>
        {homeFaq.map((f, i) => (
          <details key={f.q[0]} open={i === 0}>
            <summary>
              {t(f.q)}
              <Plus size={20} />
            </summary>
            <p>{t(f.a)}</p>
          </details>
        ))}
      </section>
      <p className="hv-imagery-note">
        {t([
          "Homepage imagery is AI-generated for illustration.",
          "Изображения на главной созданы ИИ для иллюстрации.",
          "Ana səhifədəki görüntülər illüstrasiya üçün süni intellektlə yaradılıb.",
        ])}
      </p>
    </div>
  );
}
