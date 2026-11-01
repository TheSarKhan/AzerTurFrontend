"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import CustomerOfferView, {
  offerStatus,
  originalEstimate,
} from "./customer-offer";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  UserRound,
  LogOut,
  Luggage,
  RefreshCw,
  FileText,
  Car,
  BedDouble,
  Users,
  Plane,
  Flower2,
  X,
  Check,
} from "lucide-react";
import {
  customerApi,
  ApiError,
  type Customer,
  type Booking,
  type BookingRequest,
  type CustomerOffer,
} from "@/lib/customer-api";
import { money, dateLimit, type Locale } from "@/lib/travel";
import {
  bookingQuote,
  cabinetDates,
  cabinetCity,
  cabinetTitle,
  cabinetRoute,
  cabinetPhoto,
  tripEnd,
  filterTrips,
  paymentAvailable,
} from "@/lib/customer-cabinet";
type Props = {
  locale: Locale;
  go: (path: string) => void;
  bookingId?: string;
  renderAuth: (next: string) => ReactNode;
};
export default function CustomerCabinet({
  locale: l,
  go,
  bookingId,
  renderAuth,
}: Props) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [offers, setOffers] = useState<CustomerOffer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null),
    [bookings, setBookings] = useState<Booking[]>([]),
    [requests, setRequests] = useState<BookingRequest[]>([]),
    [ready, setReady] = useState(false),
    [unauthorized, setUnauthorized] = useState(false),
    [error, setError] = useState(""),
    [refreshing, setRefreshing] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [filter, setFilter] = useState("all");
  const [dialog, setDialog] = useState<"request" | "payment" | null>(null),
    [kind, setKind] = useState("CHANGE");
  const dialogRef = useRef<HTMLDialogElement>(null),
    focusRef = useRef<HTMLElement | null>(null),
    paymentKeys = useRef<Record<string, string>>({});
  const next = bookingId ? "/trips/" + bookingId : "/trips";
  function problem(e: unknown) {
    const code = e instanceof ApiError ? e.code : "";
    return code === "REQUEST_PENDING" || code === "CONFLICT"
      ? t(
          "A request is already pending. Refresh to see its status.",
          "Заявка уже на рассмотрении. Обновите статус.",
          "Sorğu artıq yoxlamadadır. Statusu yeniləyin.",
        )
      : code === "DEMO_PAYMENT_FAILED"
        ? t(
            "Demo payment failed. Nothing was charged.",
            "Демо-платёж не прошёл. Списания нет.",
            "Demo ödəniş alınmadı. Məbləğ tutulmayıb.",
          )
        : t(
            "Could not load or complete this request. Please try again.",
            "Не удалось загрузить или выполнить запрос. Повторите.",
            "Sorğunu yükləmək və ya tamamlamaq olmadı. Yenidən yoxlayın.",
          );
  }
  async function load() {
    setRefreshing(true);
    setError("");
    try {
      const c = await customerApi<Customer>("auth/me");
      const [b, r, o] = await Promise.all([
        customerApi<Booking[]>("bookings"),
        customerApi<BookingRequest[]>("bookings/requests"),
        customerApi<CustomerOffer[]>("bookings/offers"),
      ]);
      setCustomer(c);
      setBookings(b);
      setRequests(r);
      setOffers(o);
      setUnauthorized(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUnauthorized(true);
        setCustomer(null);
        setBookings([]);
        setRequests([]);
        setOffers([]);
      } else setError(problem(e));
    } finally {
      setReady(true);
      setRefreshing(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (dialog && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [dialog]);
  useEffect(() => {
    setNotice("");
    setError("");
  }, [bookingId, l]);
  const currentOffer = offers.find((o) => o.bookingId === bookingId);
  const b = bookings.find((item) => item.id === bookingId),
    q = b ? bookingQuote(b) : null,
    route = b ? cabinetRoute(b) : [],
    activeRequests = b ? requests.filter((r) => r.bookingId === b.id) : [],
    pending = activeRequests.some((r) => r.status === "PENDING");
  const statuses: Record<Booking["status"], string> = {
    PENDING_REVIEW: t(
      "Waiting for operator review",
      "На проверке у оператора",
      "Operator yoxlamasını gözləyir",
    ),
    AWAITING_PAYMENT: t(
      "Approved · deposit required",
      "Одобрено · ожидает депозита",
      "Təsdiqlənib · beh gözlənilir",
    ),
    CONFIRMED: t("Confirmed", "Подтверждено", "Təsdiqlənib"),
    REJECTED: t("Not approved", "Не одобрено", "Təsdiqlənməyib"),
    CANCELLED: t("Cancelled", "Отменено", "Ləğv edilib"),
  };
  const services: Record<string, string> = {
    transport: t(
      "Private car & driver",
      "Автомобиль с водителем",
      "Şəxsi avtomobil və sürücü",
    ),
    hotel: t("Your stay", "Проживание", "Qalma yeri"),
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
  const icons: Record<string, typeof Car> = {
    transport: Car,
    hotel: BedDouble,
    guide: Users,
    transfer: Plane,
    activity: Flower2,
  };
  const dates = (item: Booking) => cabinetDates(item, l);
  const cityName = (city: string) => cabinetCity(city, l);
  const link = (path: string, label: ReactNode, className = "") => (
    <a
      href={"/" + l + path}
      className={className}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          go(path);
        }
      }}
    >
      {label}
    </a>
  );
  const planned = t(
    "Contract approval and staged payments are planned. Current payments are simulated.",
    "Договор и поэтапная оплата запланированы. Текущие платежи — демонстрационные.",
    "Müqavilə təsdiqi və mərhələli ödənişlər planlaşdırılır. Hazırkı ödənişlər demodur.",
  );
  const cancellation = t(
    "The team reviews every request. Terms and refunds depend on the service, provider and cancellation time.",
    "Команда рассмотрит запрос. Условия и возврат зависят от услуги, поставщика и времени отмены.",
    "Komanda hər sorğunu yoxlayır. Şərtlər və geri ödəniş xidmət, təchizatçı və ləğv vaxtından asılıdır.",
  );
  function open(mode: "request" | "payment") {
    focusRef.current = document.activeElement as HTMLElement;
    setKind("CHANGE");
    setError("");
    paymentKeys.current = {};
    setDialog(mode);
  }
  function close() {
    if (busy) return;
    dialogRef.current?.close();
    setDialog(null);
    focusRef.current?.focus();
  }
  const refresh = (
    <button
      className="cc-text cc-refresh"
      disabled={refreshing || busy}
      onClick={() => void load()}
    >
      <RefreshCw size={16} />
      {t("Refresh", "Обновить", "Yenilə")}
    </button>
  );
  const status = (item: Booking) => (
    <span className="cc-status">
      {item.status === "CONFIRMED" ? <Check size={20} /> : <Clock size={20} />}{" "}
      {item.status === "PENDING_REVIEW" &&
      offers.some((o) => o.bookingId === item.id)
        ? offerStatus(l)
        : statuses[item.status]}
    </span>
  );
  const nextSteps = (
    <>
      <h2>{t("What happens next?", "Что дальше?", "Sonra nə olur?")}</h2>
      <div className="cc-next">
        {[
          [
            t("Team review", "Проверка команды", "Komanda yoxlaması"),
            t(
              "We check availability and prepare your offer.",
              "Проверяем доступность и готовим предложение.",
              "Mövcudluğu yoxlayıb təklif hazırlayırıq.",
            ),
          ],
          [
            t(
              "Your confirmed offer",
              "Ваше предложение",
              "Təsdiqlənmiş təklifin",
            ),
            t(
              "Review the itinerary, final prices and terms.",
              "Проверьте маршрут, цены и условия.",
              "Marşrut, yekun qiymətlər və şərtlərlə tanış ol.",
            ),
          ],
          [
            t(
              "Contract & payments",
              "Договор и оплата",
              "Müqavilə və ödənişlər",
            ),
            t(
              "After contract approval, a deposit and later service payments follow.",
              "После одобрения договора — депозит и платежи по услугам.",
              "Müqavilə təsdiqindən sonra beh və xidmət ödənişləri gəlir.",
            ),
          ],
        ].map(([title, body], i) => (
          <div key={title}>
            <span>{i + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="cc-planned">{planned}</p>
    </>
  );
  if (!ready)
    return (
      <section className="cabinet cc-container cc-loading" role="status">
        {t(
          "Loading your journeys…",
          "Загружаем поездки…",
          "Səfərləriniz yüklənir…",
        )}
      </section>
    );
  if (unauthorized) return <>{renderAuth(next)}</>;
  if (!customer)
    return (
      <section className="cabinet cc-container cc-loading">
        <h1>{t("Your journeys", "Ваши поездки", "Səfərləriniz")}</h1>
        <p role="alert">{error}</p>
        {refresh}
      </section>
    );
  const account = (
    <div className="cc-account">
      <UserRound size={28} />
      <div>
        <h3>{t("Your account", "Ваш аккаунт", "Hesabın")}</h3>
        <p>
          {customer.name}
          <br />
          {customer.email}
          <br />
          {customer.locale.toUpperCase()}
        </p>
      </div>
    </div>
  );
  const alerts = (
    <>
      {error && (
        <p className="cc-error" role="alert">
          {error} {refresh}
        </p>
      )}
      {notice && (
        <p className="cc-notice" role="status">
          {notice}
        </p>
      )}
    </>
  );
  return (
    <section
      className={
        "cabinet " +
        (bookingId && bookingId !== "account" ? "cc-detail" : "cc-overview")
      }
    >
      <div className="cc-container">
        {alerts}
        {!bookingId || bookingId === "account" ? (
          <div className="cc-account-grid">
            <aside className="cc-sidebar">
              <nav
                aria-label={t(
                  "Account navigation",
                  "Навигация аккаунта",
                  "Hesab menyusu",
                )}
              >
                {link(
                  "/trips",
                  <>
                    <Luggage size={22} />
                    {t("My trips", "Мои поездки", "Səfərlərim")}
                  </>,
                  !bookingId ? "active" : "",
                )}
                {link(
                  "/trips/account",
                  <>
                    <UserRound size={22} />
                    {t(
                      "Account details",
                      "Данные аккаунта",
                      "Hesab məlumatları",
                    )}
                  </>,
                  bookingId === "account" ? "active" : "",
                )}
              </nav>
              <button
                className="cc-text"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await customerApi("auth/logout", {});
                    setUnauthorized(true);
                    setCustomer(null);
                    setBookings([]);
                    setRequests([]);
                    setOffers([]);
                  } catch (e) {
                    setError(problem(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <LogOut size={20} />
                {t("Sign out", "Выйти", "Çıxış")}
              </button>
            </aside>
            <div className="cc-content">
              {bookingId === "account" ? (
                <>
                  <h1>{t("Your account", "Ваш аккаунт", "Hesabın")}</h1>
                  {account}
                  {link(
                    "/trips",
                    t(
                      "← Back to my trips",
                      "← К моим поездкам",
                      "← Səfərlərimə qayıt",
                    ),
                    "cc-text",
                  )}
                </>
              ) : (
                <>
                  <header className="cc-heading">
                    <div>
                      <h1>
                        {t("Your journeys.", "Ваши поездки.", "Səfərləriniz.")}
                      </h1>
                      <p>
                        {t(
                          "Your Azerbaijan plans, all in one place.",
                          "Ваши планы в Азербайджане — в одном месте.",
                          "Azərbaycan səfərlərin bir yerdə.",
                        )}
                      </p>
                    </div>
                    {link(
                      "/plan",
                      <>
                        {t(
                          "Plan another trip",
                          "Новый маршрут",
                          "Yeni səfər planla",
                        )}
                        <ArrowRight size={18} />
                      </>,
                      "cc-primary",
                    )}
                  </header>
                  <div
                    className="cc-filters"
                    role="group"
                    aria-label={t(
                      "Filter trips",
                      "Фильтр поездок",
                      "Səfər filtri",
                    )}
                  >
                    {[
                      ["all", t("All trips", "Все поездки", "Bütün səfərlər")],
                      ["upcoming", t("Upcoming", "Предстоящие", "Qarşıdakı")],
                      ["past", t("Past", "Прошедшие", "Keçmiş")],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        aria-pressed={filter === key}
                        onClick={() => setFilter(key)}
                      >
                        {label} (
                        {filterTrips(bookings, key, dateLimit(0)).length})
                      </button>
                    ))}
                    {refresh}
                  </div>
                  {filterTrips(bookings, filter, dateLimit(0)).map((item) => {
                    const quote = bookingQuote(item);
                    const latest = offers.find((o) => o.bookingId === item.id);
                    return (
                      <article className="cc-trip" key={item.id}>
                        <Image
                          src={
                            "/images/homepage-v3/" + cabinetPhoto(item) + ".png"
                          }
                          alt={cabinetRoute(item).map(cityName).join(" · ")}
                          width={600}
                          height={500}
                        />
                        <div className="cc-trip-body">
                          <div className="cc-trip-top">
                            <small>
                              {t("Request", "Запрос", "Sorğu")} #
                              {item.id.slice(0, 8)}
                            </small>
                            {status(item)}
                          </div>
                          <h2>{cabinetTitle(item, l)}</h2>
                          <p className="cc-route-name">
                            {cabinetRoute(item).map(cityName).join(" → ")}
                          </p>
                          <p>
                            {dates(item)} · {quote?.input.pax || "—"}{" "}
                            {t("travelers", "чел.", "nəfər")}
                          </p>
                          {item.status === "PENDING_REVIEW" && !latest && (
                            <div className="cc-sage">
                              <Users size={26} />
                              <div>
                                <strong>
                                  {t(
                                    "Your request is with our team.",
                                    "Ваша заявка у нашей команды.",
                                    "Sorğun komandamızdadır.",
                                  )}
                                </strong>
                                <p>
                                  {t(
                                    "We’re checking the route and availability. No payment is due.",
                                    "Проверяем маршрут и доступность. Сейчас оплаты нет.",
                                    "Marşrutu və mövcudluğu yoxlayırıq. Hazırda ödəniş tələb olunmur.",
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                          {latest && (
                            <CustomerOfferView
                              offer={latest}
                              locale={l}
                              compact
                            />
                          )}
                          {item.operatorNote && (
                            <p className="cc-operator">{item.operatorNote}</p>
                          )}
                          <div className="cc-trip-bottom">
                            <div>
                              <strong>
                                {latest
                                  ? originalEstimate(l)
                                  : t(
                                      "Estimated group total",
                                      "Примерная сумма для группы",
                                      "Qrup üçün təxmini cəm",
                                    )}
                              </strong>
                              <small>
                                {t("Paid", "Оплачено", "Ödənilib")}{" "}
                                {money(item.paid, item.currency, l)} ·{" "}
                                {t("Remaining", "Остаток", "Qalıq")}{" "}
                                {money(
                                  Math.max(0, item.total - item.paid),
                                  item.currency,
                                  l,
                                )}
                              </small>
                            </div>
                            <strong className="cc-price">
                              {money(item.total, item.currency, l)}
                            </strong>
                            {link(
                              "/trips/" + item.id,
                              <>
                                {t(
                                  "View request",
                                  "Открыть запрос",
                                  "Sorğuya bax",
                                )}
                                <ArrowRight size={18} />
                              </>,
                              "cc-primary",
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {!filterTrips(bookings, filter, dateLimit(0)).length && (
                    <div className="cc-empty">
                      <Luggage size={32} />
                      <h2>
                        {bookings.length
                          ? t(
                              "No trips in this view.",
                              "Здесь пока нет поездок.",
                              "Bu bölmədə səfər yoxdur.",
                            )
                          : t(
                              "Your next journey is waiting.",
                              "Вас ждёт новая поездка.",
                              "Növbəti səfərin səni gözləyir.",
                            )}
                      </h2>
                      {link(
                        "/tours",
                        t(
                          "Explore journeys →",
                          "Посмотреть туры →",
                          "Turlara bax →",
                        ),
                        "cc-text",
                      )}
                    </div>
                  )}
                  <section className="cc-next-section">{nextSteps}</section>
                  <div className="cc-help">
                    <div>
                      <FileText size={30} />
                      <div>
                        <h3>
                          {t(
                            "Need to update your plan?",
                            "Хотите изменить план?",
                            "Planı dəyişmək istəyirsən?",
                          )}
                        </h3>
                        <p>
                          {t(
                            "Open your request to send a change or cancellation.",
                            "Откройте заявку, чтобы запросить изменение или отмену.",
                            "Dəyişiklik və ya ləğv istəmək üçün sorğunu aç.",
                          )}
                        </p>
                      </div>
                    </div>
                    {account}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : !b ? (
          <div className="cc-empty">
            <h1>
              {t(
                "Request unavailable",
                "Запрос недоступен",
                "Sorğu mövcud deyil",
              )}
            </h1>
            <p>
              {t(
                "It may not exist or belong to this account.",
                "Возможно, он не существует или принадлежит другому аккаунту.",
                "Sorğu mövcud olmaya və ya başqa hesaba aid ola bilər.",
              )}
            </p>
            {link(
              "/trips",
              t("Back to my trips", "К моим поездкам", "Səfərlərimə qayıt"),
              "cc-primary",
            )}
          </div>
        ) : (
          <>
            <p className="cc-breadcrumb">
              {t("My trips", "Мои поездки", "Səfərlərim")} /{" "}
              {t("Request", "Запрос", "Sorğu")} {b.id.slice(0, 8)}
            </p>
            {link(
              "/trips",
              <>
                <ArrowLeft size={16} />
                {t("Back to my trips", "К моим поездкам", "Səfərlərimə qayıt")}
              </>,
              "cc-text",
            )}
            <header className="cc-detail-heading">
              <h1>{cabinetTitle(b, l)}</h1>
              <p>
                {dates(b)} · {q?.input.customDays || route.length || 1}{" "}
                {t("days", "дн.", "gün")} ·{" "}
                {Math.max(0, (q?.input.customDays || route.length || 1) - 1)}{" "}
                {t("night(s)", "ноч.", "gecə")} · {q?.input.pax || "—"}{" "}
                {t("travelers", "чел.", "nəfər")}
              </p>
            </header>
            <Image
              className="cc-hero"
              src={"/images/homepage-v3/" + cabinetPhoto(b) + ".png"}
              alt={route.map(cityName).join(" · ")}
              width={1400}
              height={380}
              priority
            />
            <div className="cc-state-banner">
              <Clock size={25} />
              <div>
                <strong>
                  {currentOffer && b.status === "PENDING_REVIEW"
                    ? offerStatus(l)
                    : statuses[b.status]}
                </strong>
                <p>
                  {pending
                    ? t(
                        "Your change or cancellation request is being reviewed. Payment is paused.",
                        "Изменение или отмена на проверке. Оплата приостановлена.",
                        "Dəyişiklik və ya ləğv sorğusu yoxlanılır. Ödəniş dayandırılıb.",
                      )
                    : currentOffer
                      ? offerStatus(l)
                      : b.status === "PENDING_REVIEW"
                        ? t(
                            "We’re checking your route and availability. No payment is due.",
                            "Проверяем маршрут и доступность. Сейчас оплаты нет.",
                            "Marşrutu və mövcudluğu yoxlayırıq. Hazırda ödəniş tələb olunmur.",
                          )
                        : b.operatorNote ||
                          t(
                            "See your request details and next step below.",
                            "Детали заявки и следующий шаг ниже.",
                            "Sorğu detalları və növbəti addım aşağıdadır.",
                          )}
                </p>
              </div>
              {refresh}
            </div>
            <div className="cc-detail-grid">
              <div>
                <nav
                  className="cc-anchors"
                  aria-label={t(
                    "Request sections",
                    "Разделы заявки",
                    "Sorğu bölmələri",
                  )}
                >
                  {[
                    ["cc-route", t("Overview", "Обзор", "Ümumi baxış")],
                    ["cc-services", t("Services", "Услуги", "Xidmətlər")],
                    ["cc-requests", t("Requests", "Запросы", "Sorğular")],
                    ["cc-documents", t("Documents", "Документы", "Sənədlər")],
                  ].map(([id, name]) => (
                    <a key={id} href={"#" + id}>
                      {name}
                    </a>
                  ))}
                </nav>
                {currentOffer && (
                  <CustomerOfferView offer={currentOffer} locale={l} />
                )}
                <section id="cc-route">
                  <h2>
                    <span>01</span>
                    {t("Your route", "Ваш маршрут", "Marşrutun")}
                  </h2>
                  <div className="cc-day-list">
                    {route.map((city, i) => (
                      <details key={i} open={route.length <= 2}>
                        <summary>
                          {t("Day", "День", "Gün")} {i + 1} · {cityName(city)}
                        </summary>
                        <p>
                          {t(
                            "Selected destination",
                            "Выбранное направление",
                            "Seçilmiş istiqamət",
                          )}
                          : {cityName(city)}.{" "}
                          {t(
                            "Final itinerary confirmed by our team.",
                            "Итоговый маршрут подтвердит команда.",
                            "Yekun proqramı komandamız təsdiqləyir.",
                          )}
                        </p>
                      </details>
                    ))}
                  </div>
                  <div className="cc-route-line">
                    {route.map((city, i) => (
                      <span key={i}>{cityName(city)}</span>
                    ))}
                  </div>
                  <p className="cc-caption">
                    {t(
                      "Return route arranged with our team.",
                      "Обратный маршрут согласуем с командой.",
                      "Geri dönüş marşrutu komandamızla razılaşdırılır.",
                    )}
                  </p>
                </section>
                <section id="cc-services">
                  <h2>
                    <span>02</span>
                    {t(
                      "Your selected services",
                      "Выбранные услуги",
                      "Seçdiyin xidmətlər",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Final details and prices will be confirmed.",
                      "Итоговые детали и цены будут подтверждены.",
                      "Yekun detallar və qiymətlər təsdiqlənəcək.",
                    )}
                  </p>
                  {q ? (
                    q.lines.map((line, i) => {
                      const Icon = icons[line.label] || FileText;
                      const days = q.input.customDays || route.length || 1;
                      const nights = Math.max(0, days - 1),
                        rooms = Math.ceil(q.input.pax / 2);
                      const count =
                        line.label === "hotel"
                          ? rooms * nights
                          : line.label === "activity"
                            ? q.input.pax
                            : line.label === "transfer"
                              ? 1
                              : days;
                      const quantity =
                        line.label === "hotel"
                          ? `${rooms} ${t("room(s)", "ном.", "otaq")} × ${nights} ${t("night(s)", "ноч.", "gecə")}`
                          : line.label === "activity"
                            ? `${count} ${t("travelers", "чел.", "nəfər")}`
                            : line.label === "transfer"
                              ? `1 ${t("transfer", "трансфер", "transfer")}`
                              : `${count} ${t("days", "дн.", "gün")}`;

                      return (
                        <div className="cc-service" key={line.label + "-" + i}>
                          <Icon size={28} />
                          <div>
                            <strong>
                              {services[line.label] || line.label}
                            </strong>
                            <small>
                              {quantity}
                              {b.currency === "EUR" &&
                              count > 0 &&
                              Number.isInteger(line.amount / count)
                                ? ` × ${money(line.amount / count, b.currency, l)}`
                                : ""}
                            </small>
                            {line.label === "hotel" && (
                              <small>
                                {
                                  {
                                    standard: t(
                                      "Standard",
                                      "Стандарт",
                                      "Standart",
                                    ),
                                    comfort: t("Comfort", "Комфорт", "Komfort"),
                                    premium: t("Premium", "Премиум", "Premium"),
                                  }[q.input.hotel]
                                }
                              </small>
                            )}
                            {line.label === "guide" && (
                              <small>
                                {
                                  {
                                    en: "English",
                                    ru: "Русский",
                                    az: "Azərbaycanca",
                                  }[q.input.guideLanguage || l]
                                }
                              </small>
                            )}
                          </div>
                          <strong>{money(line.amount, b.currency, l)}</strong>
                        </div>
                      );
                    })
                  ) : (
                    <p>
                      {t(
                        "Service details unavailable. Please refresh.",
                        "Детали услуг недоступны. Обновите.",
                        "Xidmət detalları mövcud deyil. Yeniləyin.",
                      )}
                    </p>
                  )}
                  <div className="cc-service cc-service-total">
                    <strong>
                      {t("Estimated total", "Примерная сумма", "Təxmini cəm")}
                    </strong>
                    <strong>{money(b.total, b.currency, l)}</strong>
                  </div>
                </section>
                <section>
                  <h2>
                    <span>03</span>
                    {t("Your notes", "Ваши пожелания", "Qeydlərin")}
                  </h2>
                  <p className="cc-notes">
                    {b.customerNote ||
                      t(
                        "No additional notes.",
                        "Нет дополнительных пожеланий.",
                        "Əlavə qeyd yoxdur.",
                      )}
                  </p>
                  {b.operatorNote && (
                    <div className="cc-operator">
                      <strong>
                        {t(
                          "From our team",
                          "От нашей команды",
                          "Komandamızdan",
                        )}
                      </strong>
                      <p>{b.operatorNote}</p>
                    </div>
                  )}
                </section>
                <section id="cc-requests">
                  <h2>
                    <span>04</span>
                    {t(
                      "Requests & updates",
                      "Запросы и обновления",
                      "Sorğular və yeniliklər",
                    )}
                  </h2>
                  {activeRequests.map((r) => (
                    <article className="cc-update" key={r.id}>
                      <strong>
                        {r.kind === "CANCEL"
                          ? t(
                              "Cancellation request",
                              "Запрос отмены",
                              "Ləğv sorğusu",
                            )
                          : t(
                              "Change request",
                              "Запрос изменения",
                              "Dəyişiklik sorğusu",
                            )}{" "}
                        ·{" "}
                        {r.status === "PENDING"
                          ? t(
                              "Waiting for a response",
                              "Ожидает ответа",
                              "Cavab gözlənilir",
                            )
                          : r.status === "ACCEPTED"
                            ? t("Accepted", "Принято", "Qəbul edilib")
                            : t("Declined", "Отклонено", "Qəbul edilməyib")}
                      </strong>
                      <p>{r.message}</p>
                      {r.response && (
                        <p className="cc-operator">{r.response}</p>
                      )}
                    </article>
                  ))}
                  {!activeRequests.length && (
                    <p>
                      {t(
                        "No change or cancellation requests yet.",
                        "Запросов на изменение или отмену пока нет.",
                        "Hələ dəyişiklik və ya ləğv sorğusu yoxdur.",
                      )}
                    </p>
                  )}
                  {!pending &&
                    !["CANCELLED", "REJECTED"].includes(b.status) && (
                      <button
                        className="cc-outline"
                        onClick={() => open("request")}
                      >
                        <FileText size={18} />
                        {t(
                          "Request a change or cancellation",
                          "Запросить изменение или отмену",
                          "Dəyişiklik və ya ləğv istə",
                        )}
                        <ArrowRight size={17} />
                      </button>
                    )}
                  <p className="cc-caption">{cancellation}</p>
                </section>
                <section id="cc-documents">
                  <h2>
                    <span>05</span>
                    {t("Documents", "Документы", "Sənədlər")}
                  </h2>
                  <div className="cc-documents">
                    <FileText size={28} />
                    <div>
                      <strong>
                        {t(
                          "No documents yet.",
                          "Документов пока нет.",
                          "Hələ sənəd yoxdur.",
                        )}
                      </strong>
                      <p>
                        {t(
                          "Your confirmed offer and documents will appear here when available.",
                          "Подтверждённое предложение и документы появятся здесь.",
                          "Təsdiqlənmiş təklif və sənədlər hazır olduqda burada görünəcək.",
                        )}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
              <aside className="cc-summary">
                <div>
                  <h2>{t("Your request", "Ваша заявка", "Sorğun")}</h2>
                  <small>#{b.id.slice(0, 8)}</small>
                  <dl>
                    <dt>
                      {t("Travel dates", "Даты поездки", "Səfər tarixləri")}
                    </dt>
                    <dd>{dates(b)}</dd>
                    <dt>{t("Travelers", "Участники", "Səyahətçilər")}</dt>
                    <dd>{q?.input.pax || "—"}</dd>
                  </dl>
                  <dl className="cc-money">
                    <dt>
                      {t("Estimated total", "Примерная сумма", "Təxmini cəm")}
                    </dt>
                    <dd>{money(b.total, b.currency, l)}</dd>
                    <dt>{t("Paid", "Оплачено", "Ödənilib")}</dt>
                    <dd>{money(b.paid, b.currency, l)}</dd>
                    <dt>{t("Remaining", "Остаток", "Qalıq")}</dt>
                    <dd>
                      {money(Math.max(0, b.total - b.paid), b.currency, l)}
                    </dd>
                  </dl>
                  <p className="cc-caption">
                    {t(
                      "Final services and price confirmed by our team.",
                      "Услуги и цену подтвердит команда.",
                      "Yekun xidmət və qiyməti komandamız təsdiqləyir.",
                    )}
                  </p>
                  <div className="cc-next-action">
                    <h3>{t("Next step", "Следующий шаг", "Növbəti addım")}</h3>
                    <p>
                      {pending
                        ? t(
                            "Wait for the team’s response to your request.",
                            "Дождитесь ответа команды.",
                            "Komandanın sorğuya cavabını gözlə.",
                          )
                        : currentOffer
                          ? offerStatus(l)
                          : b.status === "PENDING_REVIEW"
                            ? t(
                                "Wait for our team’s review.",
                                "Дождитесь проверки команды.",
                                "Komandamızın yoxlamasını gözlə.",
                              )
                            : statuses[b.status]}
                    </p>
                    {!currentOffer && paymentAvailable(b, requests) && (
                      <button
                        className="cc-primary"
                        onClick={() => open("payment")}
                      >
                        {t(
                          "Try demo payment",
                          "Проверить демо-оплату",
                          "Demo ödənişi yoxla",
                        )}
                        <ArrowRight size={17} />
                      </button>
                    )}
                    {b.status === "CANCELLED" && b.paid > 0 && (
                      <p>
                        {t(
                          "Any refund is handled manually by the team.",
                          "Возврат обрабатывает команда вручную.",
                          "Geri ödənişi komanda manual idarə edir.",
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3>
                    {t(
                      "How payments will work",
                      "Как проходит оплата",
                      "Ödənişlər necə olacaq",
                    )}
                  </h3>
                  <p>
                    {t(
                      "Review the confirmed offer and PDF contract before a deposit. Later payments follow confirmed service requests.",
                      "Ознакомьтесь с предложением и PDF-договором до депозита. Далее оплата по запросам услуг.",
                      "Behdən əvvəl təsdiqlənmiş təklif və PDF müqavilə ilə tanış ol. Sonrakı ödənişlər xidmətlər üzrə tələb olunur.",
                    )}
                  </p>
                  <p className="cc-planned">{planned}</p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
      {dialog && b && (
        <dialog
          ref={dialogRef}
          className="cc-dialog"
          aria-label={
            dialog === "request"
              ? t(
                  "Change or cancellation request",
                  "Изменение или отмена",
                  "Dəyişiklik və ya ləğv sorğusu",
                )
              : t("Demo payment", "Демо-оплата", "Demo ödəniş")
          }
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <button
            className="cc-close"
            disabled={busy}
            aria-label={t("Close", "Закрыть", "Bağla")}
            onClick={close}
          >
            <X />
          </button>
          {dialog === "request" ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                const message = String(
                  new FormData(e.currentTarget).get("message") || "",
                ).trim();
                if (message.length < 5) {
                  setError(
                    t(
                      "Enter at least five characters.",
                      "Введите минимум пять символов.",
                      "Ən azı beş simvol yazın.",
                    ),
                  );
                  return;
                }
                setBusy(true);
                setError("");
                try {
                  await customerApi("bookings/" + b.id + "/requests", {
                    kind,
                    message,
                  });
                  dialogRef.current?.close();
                  setDialog(null);
                  focusRef.current?.focus();
                  setNotice(
                    t(
                      "Your request was sent to the office team.",
                      "Запрос отправлен офисной команде.",
                      "Sorğun ofis komandasına göndərildi.",
                    ),
                  );
                  await load();
                } catch (e) {
                  setError(problem(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <h2>
                {t(
                  "Update your journey",
                  "Измените поездку",
                  "Səfər üçün dəyişiklik istə",
                )}
              </h2>
              <p>{cancellation}</p>
              <label>
                {t("Request type", "Тип запроса", "Sorğunun növü")}
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  disabled={busy}
                >
                  <option value="CHANGE">
                    {t("Change", "Изменение", "Dəyişiklik")}
                  </option>
                  <option value="CANCEL">
                    {t("Cancellation", "Отмена", "Ləğv")}
                  </option>
                </select>
              </label>
              <label>
                {t("Your message", "Сообщение", "Mesajın")}
                <textarea
                  name="message"
                  minLength={5}
                  maxLength={2000}
                  required
                  rows={5}
                  disabled={busy}
                />
              </label>
              {error && (
                <p role="alert" className="cc-error">
                  {error}
                </p>
              )}
              <div className="cc-dialog-actions">
                <button
                  type="button"
                  className="cc-outline"
                  onClick={close}
                  disabled={busy}
                >
                  {t("Close", "Закрыть", "Bağla")}
                </button>
                <button className="cc-primary" disabled={busy}>
                  {busy
                    ? t("Sending…", "Отправляем…", "Göndərilir…")
                    : t("Send request", "Отправить запрос", "Sorğunu göndər")}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2>{t("Demo payment", "Демо-оплата", "Demo ödəniş")}</h2>
              <p>
                {t(
                  "No real money is charged. Test either outcome.",
                  "Реальные деньги не списываются. Проверьте любой результат.",
                  "Real pul tutulmur. Hər iki nəticəni yoxlaya bilərsən.",
                )}
              </p>
              <strong className="cc-price">
                {money(
                  b.status === "AWAITING_PAYMENT"
                    ? b.deposit
                    : Math.max(0, b.total - b.paid),
                  b.currency,
                  l,
                )}
              </strong>
              {error && (
                <p role="alert" className="cc-error">
                  {error}
                </p>
              )}
              <div className="cc-payment-actions">
                {[true, false].map((success) => (
                  <button
                    key={String(success)}
                    className={success ? "cc-primary" : "cc-outline"}
                    disabled={busy}
                    onClick={async () => {
                      if (busy || !paymentAvailable(b, requests)) return;
                      setBusy(true);
                      setError("");
                      const key = String(success);
                      paymentKeys.current[key] ||= crypto.randomUUID();
                      try {
                        await customerApi(
                          "bookings/" + b.id + "/demo-payment",
                          {
                            kind:
                              b.status === "AWAITING_PAYMENT"
                                ? "DEPOSIT"
                                : "BALANCE",
                            success,
                          },
                          { "Idempotency-Key": paymentKeys.current[key] },
                        );
                        dialogRef.current?.close();
                        setDialog(null);
                        focusRef.current?.focus();
                        setNotice(
                          t(
                            "Demo payment recorded. No real money was charged.",
                            "Демо-оплата сохранена. Реального списания не было.",
                            "Demo ödəniş qeydə alındı. Real pul tutulmayıb.",
                          ),
                        );
                        await load();
                      } catch (e) {
                        setError(problem(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {success
                      ? t(
                          "Simulate success",
                          "Успешная оплата",
                          "Uğurlu ödənişi yoxla",
                        )
                      : t(
                          "Simulate failure",
                          "Ошибка оплаты",
                          "Uğursuz ödənişi yoxla",
                        )}
                  </button>
                ))}
              </div>
            </>
          )}
        </dialog>
      )}
    </section>
  );
}
