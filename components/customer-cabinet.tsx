"use client";
import { travellerCount } from "@/lib/pax";
import CustomerAmendments from "./customer-amendments";
import AccountSecurity from "./account-security";
import CustomerNotifications from "./customer-notifications";
import CustomerPayments from "./customer-payments";
import CustomerCancellation from "./customer-cancellation";
import CustomerContract from "@/components/customer-contract";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import CustomerOfferView, {
  offerStatus,
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
  CreditCard,
  Wallet,
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
} from "@/lib/customer-cabinet";
type Props = {
  locale: Locale;
  go: (path: string) => void;
  bookingId?: string;
  cancellationView?: boolean;
  paymentView?: boolean;
  amendmentView?: boolean;
  renderAuth: (next: string) => ReactNode;
};
export default function CustomerCabinet({
  locale: l,
  go,
  bookingId,
  cancellationView,
  paymentView,
  amendmentView,
  renderAuth,
}: Props) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [unread, setUnread] = useState(0);
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
  const [dialog, setDialog] = useState<"request" | null>(null),
    [kind, setKind] = useState("CHANGE");
  const dialogRef = useRef<HTMLDialogElement>(null),
    focusRef = useRef<HTMLElement | null>(null);
  type TripContract = { state: string; accepted_at: string | null } | null;
  type TripPayments = {
    contract: { id: string } | null;
    requests: {
      id: string;
      contract_id: string;
      kind: string;
      amount_minor: number;
      status: string;
    }[];
    paidMinor: number;
    paymentBlocked: boolean;
  } | null;
  const [tripContract, setTripContract] = useState<TripContract>(null),
    [tripPayments, setTripPayments] = useState<TripPayments>(null);
  const [listExtras, setListExtras] = useState<
    Record<string, { contract: TripContract; payments: TripPayments }>
  >({});
  async function loadListExtras(ids: string[]) {
    const rows = await Promise.all(
      ids.map(async (id) => {
        const [contract, payments] = await Promise.all([
          customerApi<TripContract>("bookings/" + id + "/contract").catch(() => null),
          customerApi<TripPayments>("bookings/" + id + "/payment-context").catch(() => null),
        ]);
        return [id, { contract: contract ?? null, payments: payments ?? null }] as const;
      }),
    );
    setListExtras(Object.fromEntries(rows));
  }
  async function loadTripExtras(id: string) {
    const [c, p] = await Promise.all([
      customerApi<TripContract>("bookings/" + id + "/contract").catch(() => null),
      customerApi<TripPayments>("bookings/" + id + "/payment-context").catch(() => null),
    ]);
    setTripContract(c ?? null);
    setTripPayments(p ?? null);
  }
  const next = bookingId
    ? "/trips/" +
      bookingId +
      (amendmentView
        ? "/changes"
        : cancellationView
          ? "/cancellation"
          : paymentView
            ? "/payments"
            : "")
    : "/trips";
  function problem(e: unknown) {
    const code = e instanceof ApiError ? e.code : "";
    if (code === "EMAIL_VERIFICATION_REQUIRED")
      return t(
        "Verify your email in Account before continuing.",
        "Подтвердите email в аккаунте.",
        "Davam etmək üçün Hesab bölməsində emailini təsdiqlə.",
      );
    return code === "REQUEST_PENDING" || code === "CONFLICT"
      ? t(
          "A request is already pending. Refresh to see its status.",
          "Заявка уже на рассмотрении. Обновите статус.",
          "Sorğu artıq yoxlamadadır. Statusu yeniləyin.",
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
      const [b, r, o, n] = await Promise.all([
        customerApi<Booking[]>("bookings"),
        customerApi<BookingRequest[]>("bookings/requests"),
        customerApi<CustomerOffer[]>("bookings/offers"),
        customerApi<{ unread: number }>("bookings/notifications"),
      ]);
      setUnread(n.unread);
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
  useEffect(() => {
    setTripContract(null);
    setTripPayments(null);
    if (
      bookingId &&
      bookingId !== "account" &&
      bookingId !== "notifications" &&
      !paymentView &&
      !cancellationView &&
      !amendmentView
    )
      void loadTripExtras(bookingId);
  }, [bookingId, paymentView, cancellationView, amendmentView]);
  useEffect(() => {
    if (!bookingId && bookings.length)
      void loadListExtras(
        bookings
          .filter((x) => !["CANCELLED", "REJECTED"].includes(x.status))
          .slice(0, 20)
          .map((x) => x.id),
      );
  }, [bookingId, bookings]);
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
      "Approved, deposit required",
      "Одобрено, ожидает депозита",
      "Təsdiqlənib, beh gözlənilir",
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
    guide: t("Local guide", "Местный гид", "Yerli bələdçi"),
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
  const planLabels: Record<string, string> = {
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
    "Contract approval is available when your team sends a document.",
    "Договор появится после отправки командой.",
    "Komanda göndərdikdə müqaviləyə baxıb təsdiqləyə bilərsiniz.",
  );
  const cancellation = t(
    "The team reviews every request. Terms and refunds depend on the service, provider and cancellation time.",
    "Команда рассмотрит запрос. Условия и возврат зависят от услуги, поставщика и времени отмены.",
    "Komanda hər sorğunu yoxlayır. Şərtlər və geri ödəniş xidmət, təchizatçı və ləğv vaxtından asılıdır.",
  );
  function open(mode: "request") {
    focusRef.current = document.activeElement as HTMLElement;
    setKind("CHANGE");
    setError("");
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
  const verificationPrompt = !customer.emailVerified && (
    <div className="container verification-prompt" role="status">
      {t(
        "Verify your email before sending requests or accepting documents.",
        "Подтвердите email перед отправкой запросов и принятием документов.",
        "Sorğu göndərmək və sənədləri təsdiqləmək üçün emailini təsdiqlə.",
      )}{" "}
      <a href={"/" + l + "/trips/account"}>
        {t("Open account", "Открыть аккаунт", "Hesabı aç")}
      </a>
    </div>
  );
  if (amendmentView && b)
    return (
      <>
        {verificationPrompt}
        <CustomerAmendments key={b.id} booking={b} locale={l} go={go} />
      </>
    );
  if (cancellationView && b)
    return (
      <>
        {verificationPrompt}
        <CustomerCancellation key={b.id} booking={b} locale={l} go={go} />
      </>
    );
  if (paymentView && b)
    return (
      <>
        {verificationPrompt}
        <CustomerPayments key={b.id} booking={b} locale={l} go={go} />
      </>
    );
  /** One trip in the list: what it is, how far it is, and the single next thing to do. */
  function tripCard(item: Booking) {
    const quote = bookingQuote(item);
    const latest = offers.find((o) => o.bookingId === item.id);
    const extra = listExtras[item.id];
    const contractState = extra?.contract?.state;
    const reqs = extra?.payments?.requests ?? [];
    const openReq = reqs.find(
      (r) => r.status === "OPEN" && r.contract_id === extra?.payments?.contract?.id,
    );
    const depositPaid = reqs.some((r) => r.kind === "DEPOSIT" && r.status === "PAID");
    const closed = ["CANCELLED", "REJECTED"].includes(item.status);
    const hasPending = requests.some((r) => r.bookingId === item.id && r.status === "PENDING");
    const done = [true, !!latest, contractState === "ACCEPTED", depositPaid];
    const current = closed ? -1 : done.findIndex((x) => !x);
    const labels = [
      t("Request", "Заявка", "Sorğu"),
      t("Offer", "Предложение", "Təklif"),
      t("Contract", "Договор", "Müqavilə"),
      t("Payment", "Оплата", "Ödəniş"),
    ];
    const total = latest ? latest.total : item.total;
    const paid = extra?.payments ? extra.payments.paidMinor / 100 : item.paid;
    let tone = "info";
    let badge = "";
    let hint = "";
    let cta = t("Open", "Открыть", "Aç");
    if (closed) {
      tone = "muted";
      badge = statuses[item.status];
      hint = item.operatorNote || "";
    } else if (hasPending) {
      tone = "wait";
      badge = t("Request under review", "Запрос на рассмотрении", "Sorğu yoxlanılır");
      hint = t("Payment is paused while the team reviews your request.", "Оплата приостановлена на время проверки.", "Komanda sorğunu yoxlayana qədər ödəniş dayandırılıb.");
    } else if (openReq) {
      tone = "action";
      badge = t("Payment requested", "Запрошена оплата", "Ödəniş tələb olunur");
      hint = t(
        `Payment requested: ${money(openReq.amount_minor / 100, item.currency, l)}`,
        `Запрошена оплата: ${money(openReq.amount_minor / 100, item.currency, l)}`,
        `Ödəniş tələb olunur: ${money(openReq.amount_minor / 100, item.currency, l)}`,
      );
      cta = t("Go to payment", "К оплате", "Ödənişə keç");
    } else if (contractState === "SENT") {
      tone = "action";
      badge = t("Your confirmation is needed", "Нужно ваше подтверждение", "Təsdiqiniz lazımdır");
      hint = t("Read and confirm the contract.", "Прочитайте и подтвердите договор.", "Müqaviləni oxuyub təsdiqləyin.");
      cta = t("Confirm the contract", "Подтвердить договор", "Müqaviləni təsdiqlə");
    } else if (latest && contractState !== "ACCEPTED") {
      tone = "action";
      badge = offerStatus(l);
      hint = t("Review the itinerary and prices.", "Изучите маршрут и цены.", "Marşrut və qiymətlərə baxın.");
      cta = t("View the offer", "Открыть предложение", "Təklifə bax");
    } else if (contractState === "ACCEPTED") {
      tone = "ok";
      badge = depositPaid
        ? t("Booked and paid", "Забронировано и оплачено", "Rezerv və ödəniş qeyd olunub")
        : t("Contract confirmed", "Договор подтверждён", "Müqavilə təsdiqlənib");
      hint = depositPaid
        ? t("New payment requests will appear here.", "Новые запросы оплаты появятся здесь.", "Yeni ödəniş tələbləri burada görünəcək.")
        : t("Our team will request the deposit.", "Команда запросит депозит.", "Komanda behi tələb edəcək.");
    } else {
      tone = "info";
      badge = t("Being prepared", "Готовится", "Hazırlanır");
      hint = t("Our team is preparing your offer. No payment is due.", "Команда готовит предложение. Оплаты нет.", "Komanda təklifi hazırlayır. Ödəniş tələb olunmur.");
    }
    const route = cabinetRoute(item).map(cityName);
    return (
      <article className="cc-trip tp-card" key={item.id}>
        <div className="tp-card-main">
          <div className="tp-card-head">
            <div>
              <small>
                {quote?.input.customDays ? t("Custom journey", "Индивидуальный маршрут", "Fərdi səfər") + ", " : ""}
                #{item.id.slice(0, 8)}
              </small>
              <h2>{route.length ? route.join(" → ") : cabinetTitle(item, l)}</h2>
              <p>
                {dates(item)}, {quote?.input.pax ? travellerCount(quote.input.pax, l) : "—"}
              </p>
            </div>
            <span className={"tp-badge " + tone}>{badge}</span>
          </div>
          <ol className="tp-mini" aria-label={t("Progress", "Ход", "Gedişat")}>
            {labels.map((label, i) => (
              <li key={label} className={(done[i] ? "done " : "") + (i === current ? "current" : "")}>
                <b>{done[i] ? <Check size={12} /> : i + 1}</b>
                {label}
              </li>
            ))}
          </ol>
          {hint && <p className="tp-hint">{hint}</p>}
          <div className="tp-card-foot">
            <div>
              <small>{t("Total", "Итого", "Cəmi")}</small>
              <strong>{money(total, item.currency, l)}</strong>
              {paid > 0 && (
                <small>
                  {t("Paid", "Оплачено", "Ödənilib")} {money(paid, item.currency, l)}
                </small>
              )}
            </div>
            {link(
              "/trips/" + item.id + (openReq ? "/payments" : ""),
              <>
                {cta}
                <ArrowRight size={18} />
              </>,
              tone === "action" ? "cc-primary" : "cc-outline tp-open",
            )}
          </div>
        </div>
      </article>
    );
  }
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
        (bookingId && bookingId !== "account" && bookingId !== "notifications"
          ? "cc-detail"
          : "cc-overview")
      }
    >
      <div className="cc-container">
        {bookingId !== "account" && verificationPrompt}
        {alerts}
        {!bookingId ||
        bookingId === "account" ||
        bookingId === "notifications" ? (
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
                {link(
                  "/trips/notifications",
                  t(
                    "Notifications",
                    "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f",
                    "Bildiri\u015fl\u0259r",
                  ) +
                    " (" +
                    unread +
                    ")",
                  bookingId === "notifications" ? "active" : "",
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
              {bookingId === "notifications" ? (
                <CustomerNotifications
                  locale={l}
                  go={go}
                  onUnreadChange={setUnread}
                />
              ) : bookingId === "account" ? (
                <>
                  <h1>{t("Your account", "Ваш аккаунт", "Hesabın")}</h1>
                  {account}
                  {customer && (
                    <AccountSecurity customer={customer} locale={l} />
                  )}
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
                  <div className="tp-list">
                    {filterTrips(bookings, filter, dateLimit(0)).map((item) => tripCard(item))}
                  </div>
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
                {dates(b)}, {q?.input.customDays || route.length || 1}{" "}
                {t("days", "дн.", "gün")},{" "}
                {Math.max(0, (q?.input.customDays || route.length || 1) - 1)}{" "}
                {t("night(s)", "ноч.", "gecə")},{" "}
                {q?.input.pax ? travellerCount(q.input.pax, l) : "—"}
              </p>
            </header>
            {(() => {
              const cancelled = ["CANCELLED", "REJECTED"].includes(b.status);
              const contractAccepted = tripContract?.state === "ACCEPTED";
              const contractSent = tripContract?.state === "SENT";
              const depositPaid = !!tripPayments?.requests.some(
                (r) => r.kind === "DEPOSIT" && r.status === "PAID",
              );
              const openRequest = tripPayments?.requests.find(
                (r) =>
                  r.status === "OPEN" &&
                  r.contract_id === tripPayments.contract?.id,
              );
              const stages = [
                { label: t("Request", "Заявка", "Sorğu"), done: true },
                { label: t("Offer", "Предложение", "Təklif"), done: !!currentOffer },
                { label: t("Contract", "Договор", "Müqavilə"), done: contractAccepted },
                { label: t("Payment", "Оплата", "Ödəniş"), done: depositPaid },
              ];
              const current = cancelled ? -1 : stages.findIndex((x) => !x.done);
              const amount = (minor: number) => money(minor / 100, b.currency, l);
              const go2 = (id: string) =>
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              let icon = <Clock size={26} />;
              let title = "";
              let text = "";
              let action: ReactNode = null;
              if (cancelled) {
                title = statuses[b.status];
                text =
                  b.operatorNote ||
                  t("This request is closed.", "Этот запрос закрыт.", "Bu sorğu bağlanıb.");
              } else if (pending) {
                title = t("Your request is being reviewed", "Ваш запрос на рассмотрении", "Sorğunuz yoxlanılır");
                text = t(
                  "Your change or cancellation request is being reviewed. Payment is paused.",
                  "Изменение или отмена на проверке. Оплата приостановлена.",
                  "Dəyişiklik və ya ləğv sorğusu yoxlanılır. Ödəniş dayandırılıb.",
                );
              } else if (openRequest) {
                icon = <Wallet size={26} />;
                title = t(
                  `Payment requested: ${amount(openRequest.amount_minor)}`,
                  `Запрошена оплата: ${amount(openRequest.amount_minor)}`,
                  `Ödəniş tələb olunur: ${amount(openRequest.amount_minor)}`,
                );
                text = t(
                  "See what is requested and how our team will confirm your payment.",
                  "Посмотрите, что запрошено и как команда подтвердит платёж.",
                  "Nə tələb olunduğuna və komandanın ödənişi necə təsdiq edəcəyinə baxın.",
                );
                action = (
                  <button className="tp-cta" onClick={() => go("/trips/" + b.id + "/payments")}>
                    {t("Go to payments", "К оплате", "Ödənişlərə keç")}
                    <ArrowRight size={18} />
                  </button>
                );
              } else if (contractSent) {
                icon = <FileText size={26} />;
                title = t("Please confirm the contract", "Подтвердите договор", "Müqaviləni təsdiqləyin");
                text = t(
                  "Read the contract below and confirm it. No payment is taken at this step.",
                  "Прочитайте договор ниже и подтвердите. На этом шаге оплата не берётся.",
                  "Aşağıdakı müqaviləni oxuyun və təsdiqləyin. Bu addımda ödəniş tutulmur.",
                );
                action = (
                  <button className="tp-cta" onClick={() => go2("cc-contract")}>
                    {t("Open the contract", "Открыть договор", "Müqaviləyə keç")}
                    <ArrowRight size={18} />
                  </button>
                );
              } else if (currentOffer && !contractAccepted) {
                icon = <FileText size={26} />;
                title = offerStatus(l);
                text = t(
                  "Review the itinerary and prices below. The contract follows when our team sends it.",
                  "Изучите маршрут и цены ниже. Договор придёт после отправки командой.",
                  "Aşağıda marşrut və qiymətlərə baxın. Müqavilə komanda göndərəndə gələcək.",
                );
                action = (
                  <button className="tp-cta" onClick={() => go2("cc-offer")}>
                    {t("View the offer", "Открыть предложение", "Təklifə bax")}
                    <ArrowRight size={18} />
                  </button>
                );
              } else if (contractAccepted) {
                icon = <Check size={26} />;
                title = depositPaid
                  ? t("Everything is in order", "Всё в порядке", "Hər şey qaydasındadır")
                  : t("Contract confirmed", "Договор подтверждён", "Müqavilə təsdiqlənib");
                text = depositPaid
                  ? t(
                      "Your payment is recorded. You will see new payment requests here and in your notifications.",
                      "Платёж записан. Новые запросы оплаты появятся здесь и в уведомлениях.",
                      "Ödənişiniz qeyd olunub. Yeni ödəniş tələbləri burada və bildirişlərdə görünəcək.",
                    )
                  : t(
                      "Our team will request the deposit. You will see it here.",
                      "Команда запросит депозит. Вы увидите его здесь.",
                      "Komanda behi tələb edəcək. Burada görəcəksiniz.",
                    );
              } else {
                title = t("We are preparing your offer", "Готовим ваше предложение", "Təklifinizi hazırlayırıq");
                text = t(
                  "We check your route and availability. No payment is due.",
                  "Проверяем маршрут и доступность. Сейчас оплаты нет.",
                  "Marşrutu və mövcudluğu yoxlayırıq. Hazırda ödəniş tələb olunmur.",
                );
              }
              return (
                <>
                  <ol className="tp-stages" aria-label={t("Progress", "Ход", "Gedişat")}>
                    {stages.map((st, i) => (
                      <li key={st.label} className={(st.done ? "done " : "") + (i === current ? "current" : "")}>
                        <b>{st.done ? <Check size={14} /> : i + 1}</b>
                        {st.label}
                      </li>
                    ))}
                  </ol>
                  <div className="tp-next">
                    <span className="tp-next-icon">{icon}</span>
                    <div>
                      <h2>{title}</h2>
                      <p>{text}</p>
                    </div>
                    {action}
                    <button
                      className="tp-refresh"
                      disabled={refreshing || busy}
                      onClick={() => {
                        void load();
                        void loadTripExtras(b.id);
                      }}
                      aria-label={t("Refresh", "Обновить", "Yenilə")}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </>
              );
            })()}
            <div className="cc-detail-grid">
              <div>
                {currentOffer && (
                  <>
                    <CustomerOfferView offer={currentOffer} locale={l} />
                    <section id="cc-contract" className="cc-contract-block">
                      <h2>{t("Contract", "Договор", "Müqavilə")}</h2>
                      <CustomerContract
                        key={b.id}
                        bookingId={b.id}
                        locale={l}
                        onChange={() => void loadTripExtras(b.id)}
                      />
                    </section>
                  </>
                )}
                {(tripContract?.state === "ACCEPTED" || !!tripPayments?.requests.length) && (
                <section id="cc-payments" className="tp-pay">
                  <h2>{t("Payments", "Платежи", "Ödənişlər")}</h2>
                  {(() => {
                    const totalNow = currentOffer ? currentOffer.total : b.total;
                    const paidNow = tripPayments ? tripPayments.paidMinor / 100 : b.paid;
                    const openCount = tripPayments
                      ? tripPayments.requests.filter(
                          (r) => r.status === "OPEN" && r.contract_id === tripPayments.contract?.id,
                        ).length
                      : 0;
                    return (
                      <div className="tp-pay-card">
                        <div>
                          <small>{t("Paid", "Оплачено", "Ödənilib")}</small>
                          <strong>{money(paidNow, b.currency, l)}</strong>
                        </div>
                        <div>
                          <small>{t("Remaining", "Остаток", "Qalıq")}</small>
                          <strong>{money(Math.max(0, totalNow - paidNow), b.currency, l)}</strong>
                        </div>
                        <div>
                          <small>{t("Waiting for payment", "Ожидает оплаты", "Ödəniş gözləyən")}</small>
                          <strong>{openCount}</strong>
                        </div>
                        <button className="cc-primary" onClick={() => go("/trips/" + b.id + "/payments")}>
                          <CreditCard size={18} />
                          {t("Open payments", "Открыть оплату", "Ödənişlərə bax")}
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    );
                  })()}
                </section>
                )}
                {!currentOffer && Array.isArray(q?.input.plan) && q && (
                  <section id="cc-route">
                    <h2>{t("Your trip", "Ваша поездка", "Səfərin")}</h2>
                    <div className="cc-plan">
                      <div className="cc-plan-end">
                        <strong>
                          {t("Start", "Старт", "Başlanğıc")}, {cityName(q.input.startCity || "Baku")}
                        </strong>
                      </div>
                      {q.input.plan.map((day, di) => (
                        <div className="cc-plan-day" key={di}>
                          <strong>
                            {t("Day", "День", "Gün")} {di + 1}
                          </strong>
                          {day.places.map((place, pi) => (
                            <div className="cc-plan-place" key={pi}>
                              <b>{cityName(place.city)}</b>
                              <ul>
                                {place.services.length ? (
                                  place.services.map((k) => (
                                    <li key={k}>{planLabels[k] || k}</li>
                                  ))
                                ) : (
                                  <li>{t("No services chosen", "Услуги не выбраны", "Xidmət seçilməyib")}</li>
                                )}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="cc-plan-end">
                        <strong>
                          {t("Return", "Возвращение", "Qayıdış")}, {cityName(q.input.endCity || "Baku")}
                        </strong>
                      </div>
                    </div>
                    <div className="cc-service cc-service-total">
                      <strong>{t("Estimated total", "Примерная сумма", "Təxmini cəm")}</strong>
                      <strong>{money(b.total, b.currency, l)}</strong>
                    </div>
                    <p className="cc-caption">
                      {t(
                        "Our team prepares an offer with the final services and prices.",
                        "Команда подготовит предложение с итоговыми услугами и ценами.",
                        "Komandamız yekun xidmət və qiymətlərlə təklif hazırlayacaq.",
                      )}
                    </p>
                  </section>
                )}
                {!currentOffer && !Array.isArray(q?.input.plan) && (
                  <>
                <section id="cc-route">
                  <h2>
                    {t("Your route", "Ваш маршрут", "Marşrutun")}
                  </h2>
                  <div className="cc-day-list">
                    {route.map((city, i) => (
                      <details key={i} open={route.length <= 2}>
                        <summary>
                          {t("Day", "День", "Gün")} {i + 1}, {cityName(city)}
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
                  </>
                )}
                <section>
                  <h2>
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
                       ,{" "}
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
                  <div className="cc-request-actions">
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
                    <button
                      className="cc-outline"
                      onClick={() => go("/trips/" + b.id + "/cancellation")}
                    >
                      {t(
                        "Cancellation & refund details",
                        "Отмена и возврат",
                        "Ləğv və geri ödəniş",
                      )}
                    </button>
                    <button
                      className="cc-text"
                      onClick={() => go("/trips/" + b.id + "/changes")}
                    >
                      {t(
                        "Review change proposals",
                        "Предложения по изменению",
                        "Dəyişiklik təkliflərinə bax",
                      )}
                    </button>
                  </div>
                  <p className="cc-caption">{cancellation}</p>
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
                    <dd>{q?.input.pax ? travellerCount(q.input.pax, l) : "—"}</dd>
                  </dl>
                  <dl className="cc-money">
                    <dt>
                      {currentOffer
                        ? t("Offer total", "Сумма предложения", "Təklifin cəmi")
                        : t("Estimated total", "Примерная сумма", "Təxmini cəm")}
                    </dt>
                    <dd>{money(currentOffer ? currentOffer.total : b.total, b.currency, l)}</dd>
                    <dt>{t("Paid", "Оплачено", "Ödənilib")}</dt>
                    <dd>{money(tripPayments ? tripPayments.paidMinor / 100 : b.paid, b.currency, l)}</dd>
                    <dt>{t("Remaining", "Остаток", "Qalıq")}</dt>
                    <dd>
                      {money(
                        Math.max(
                          0,
                          (currentOffer ? currentOffer.total : b.total) -
                            (tripPayments ? tripPayments.paidMinor / 100 : b.paid),
                        ),
                        b.currency,
                        l,
                      )}
                    </dd>
                  </dl>
                  {b.status === "CANCELLED" && b.paid > 0 && (
                    <p className="cc-caption">
                      {t(
                        "Any refund is handled manually by the team.",
                        "Возврат обрабатывает команда вручную.",
                        "Geri ödənişi komanda manual idarə edir.",
                      )}
                    </p>
                  )}
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
          aria-label={t(
            "Change or cancellation request",
            "Изменение или отмена",
            "Dəyişiklik və ya ləğv sorğusu",
          )}
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
        </dialog>
      )}
    </section>
  );
}
