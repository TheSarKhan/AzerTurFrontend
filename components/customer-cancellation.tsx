"use client";
import { refundState } from "./refund-state";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Car,
  BedDouble,
  Users,
  Plane,
  Flower2,
  Clock,
  Check,
  ArrowLeft,
  Download,
  RefreshCw,
} from "lucide-react";
import { customerApi, ApiError, type Booking } from "@/lib/customer-api";
import {
  cabinetPhoto,
  cabinetDates,
  cabinetRoute,
} from "@/lib/customer-cabinet";
import type { Locale } from "@/lib/travel";
type Service = { key: string; name: string; total: number; policy: string };
type Context = {
  contractId: string | null;
  paidMinor: number;
  allocatableMinor: number;
  services: Service[];
  offer: {
    currency: string;
    travelers: number;
    title: string;
    date: string;
    services: Service[];
  };
  bookingStatus: string;
};
type Line = {
  serviceKey: string;
  policyText: string;
  calculation: {
    paidMinor: number;
    retainedMinor: number;
    refundMinor: number;
  };
};
type Update = {
  id: string;
  status: string;
  message: string;
  created_at: string;
  approved_at: string | null;
  customer_explanation: string | null;
  currency?: string;
  paidMinor?: number;
  retainedMinor?: number;
  refundMinor?: number;
  unaffectedMinor?: number;
  lines?: Line[];
  refundStatus?: string;
  refundMessage?: string;
};
const icons = {
  transport: Car,
  hotel: BedDouble,
  guide: Users,
  transfer: Plane,
  activity: Flower2,
};
export default function CustomerCancellation({
  booking,
  locale: l,
  go,
}: {
  booking: Booking;
  locale: Locale;
  go: (path: string) => void;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [context, setContext] = useState<Context | null>(null),
    [updates, setUpdates] = useState<Update[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selection, setSelection] = useState<string[]>([]),
    [scope, setScope] = useState("all"),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [consent, setConsent] = useState(false),
    [compose, setCompose] = useState(false),
    [activeUpdate, setActiveUpdate] = useState<string | null>(null);
  const path = "bookings/" + booking.id;
  const fmt = (
    n: number,
    currency = context?.offer.currency || booking.currency,
  ) =>
    new Intl.NumberFormat(l === "az" ? "az-AZ" : l, {
      style: "currency",
      currency,
    }).format(n / 100);
  const date = (s: string) =>
    new Date(s).toLocaleString(
      l === "az" ? "az-AZ" : l === "ru" ? "ru-RU" : "en-GB",
    );
  const names: Record<string, string> = {
    transport: t(
      "Private car & driver",
      "Авто с водителем",
      "Şəxsi avtomobil və sürücü",
    ),
    hotel: t("Comfort stay", "Проживание", "Oteldə qalma"),
    guide: t("Local guide", "Местный гид", "Yerli gid"),
    transfer: t("Airport transfer", "Трансфер", "Hava limanı transferi"),
    activity: t(
      "Local craft experience",
      "Местное впечатление",
      "Yerli təcrübə",
    ),
  };
  function problem(e: unknown) {
    const code = e instanceof ApiError ? e.code : "";
    return code === "REQUEST_PENDING" || code === "CONFLICT"
      ? t(
          "A request is already being reviewed. Refresh for the latest status.",
          "Запрос уже рассматривается. Обновите статус.",
          "Sorğu artıq yoxlamadadır. Statusu yeniləyin.",
        )
      : code === "STALE_CONTRACT"
        ? t(
            "Your contract changed. Refresh and review the terms again.",
            "Договор изменился. Обновите страницу.",
            "Müqavilə dəyişib. Yeniləyib şərtləri yenidən yoxlayın.",
          )
        : code === "ACCEPTED_CONTRACT_REQUIRED"
          ? t(
              "The office must verify your contract and payment records before proceeding. Please contact the team.",
              "Офис должен проверить договор и оплату. Свяжитесь с командой.",
              "Ofis müqavilə və ödəniş məlumatlarını yoxlamalıdır. Komanda ilə əlaqə saxlayın.",
            )
          : t(
              "Could not load or submit this request. Please retry.",
              "Не удалось выполнить запрос. Повторите.",
              "Sorğu alınmadı. Yenidən yoxlayın.",
            );
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      const u = await customerApi<Update[]>(path + "/cancellation-updates");
      setUpdates(u);
      const c = await customerApi<Context>(path + "/cancellation");
      setContext(c);
      setSelection(c.services.map((s) => s.key));
      setScope("all");
      setConsent(false);
    } catch (e) {
      setError(problem(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [booking.id]);
  const pending = updates.some((u) => u.status === "PENDING"),
    latest = updates.find((u) => u.id === activeUpdate) || updates[0];
  const result = !!latest && !compose;
  async function submit() {
    if (!context || !consent || !reason || !selection.length || busy) return;
    setBusy(true);
    setError("");
    try {
      await customerApi(path + "/cancellation", {
        contractId: context.contractId,
        serviceKeys: selection,
        reason,
        message,
      });
      setCompose(false);
      setConsent(false);
      setActiveUpdate(null);
      await load();
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  }
  async function download(update: Update) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/customer/" + path + "/cancellation-updates/" + update.id + "/pdf",
        {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        },
      );
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/pdf")
      )
        throw Error();
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "cancellation-" + update.id.slice(0, 8) + ".pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="cc-container cancel-customer">
      <button
        className="cancel-back"
        onClick={() => go("/trips/" + booking.id)}
      >
        <ArrowLeft size={17} />
        {t("Back to my trip", "К поездке", "Səfərə qayıt")}
      </button>
      <header className="cancel-customer-heading">
        <div>
          <h1>
            {result
              ? t(
                  "Your cancellation update",
                  "Статус отмены",
                  "Ləğv sorğusunun nəticəsi",
                )
              : t(
                  "Request a cancellation",
                  "Запросить отмену",
                  "Ləğv sorğusu göndər",
                )}
          </h1>
          <p>
            #{booking.id.slice(0, 8)} · {cabinetDates(booking, l)} ·{" "}
            {context?.offer.travelers || ""} {t("travelers", "чел.", "nəfər")}
          </p>
        </div>
        <button
          aria-label={t("Refresh", "Обновить", "Yenilə")}
          disabled={busy || loading}
          onClick={() => void load()}
        >
          <RefreshCw size={18} />
        </button>
      </header>
      <div className="cancel-photo">
        <Image
          src={"/images/homepage-v3/" + cabinetPhoto(booking) + ".png"}
          alt={cabinetRoute(booking).join(" · ")}
          fill
          sizes="(max-width: 700px) 100vw, 1200px"
          priority
        />
      </div>
      {error && (
        <p className="cc-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">{t("Loading…", "Загрузка…", "Yüklənir…")}</p>
      ) : result ? (
        <>
          <div className="cancel-status">
            <Clock size={24} />
            <div>
              <strong>
                {latest.status === "PENDING"
                  ? t(
                      "Waiting for office review",
                      "Ожидает проверки офиса",
                      "Ofis yoxlaması gözlənilir",
                    )
                  : latest.status === "DECLINED"
                    ? t(
                        "Cancellation declined",
                        "Отмена отклонена",
                        "Ləğv sorğusu qəbul edilməyib",
                      )
                    : t(
                        "Cancellation approved",
                        "Отмена одобрена",
                        "Ləğv təsdiqlənib",
                      )}
              </strong>
              <p>
                {latest.status === "ACCEPTED" &&
                latest.refundMinor !== undefined
                  ? t(
                      "The cancellation is approved. See the refund summary below.",
                      "Отмена одобрена. Итог возврата указан ниже.",
                      "Ləğv təsdiqlənib. Geri ödəniş xülasəsi aşağıdadır.",
                    )
                  : t(
                      "Our team checks the applicable terms for each service.",
                      "Команда проверяет условия каждой услуги.",
                      "Komandamız hər xidmətin şərtlərini yoxlayır.",
                    )}
              </p>
            </div>
          </div>
          <div className="cancel-customer-grid">
            <div className="cancel-main">
              <h2>
                {t(
                  "01 · Cancellation details",
                  "01 · Детали отмены",
                  "01 · Ləğvin detalları",
                )}
              </h2>
              <p>
                {t("Request received", "Запрос получен", "Sorğu daxil olub")}:{" "}
                {date(latest.created_at)}
              </p>
              <p>{latest.message}</p>
              {latest.customer_explanation && (
                <p className="cancel-customer-note">
                  {latest.customer_explanation}
                </p>
              )}
              {latest.lines && (
                <>
                  <h2>
                    {t(
                      "02 · Service breakdown",
                      "02 · По услугам",
                      "02 · Xidmətlər üzrə hesablama",
                    )}
                  </h2>
                  <div className="cancel-column-labels">
                    <span>{t("Service", "Услуга", "Xidmət")}</span>
                    <span>{t("Paid", "Оплачено", "Ödənilib")}</span>
                    <span>{t("Retained", "Удержано", "Saxlanılır")}</span>
                    <span>{t("Refund", "Возврат", "Qaytarılacaq")}</span>
                  </div>
                  {latest.lines.map((line) => {
                    const Icon =
                      icons[line.serviceKey as keyof typeof icons] || Car;
                    return (
                      <article
                        className="cancel-refund-line"
                        key={line.serviceKey}
                      >
                        <div>
                          <Icon size={26} />
                          <strong>
                            {names[line.serviceKey] || line.serviceKey}
                          </strong>
                          <span data-label={t("Paid", "Оплачено", "Ödənilib")}>
                            {fmt(line.calculation.paidMinor, latest.currency)}
                          </span>
                          <span
                            data-label={t("Retained", "Удержано", "Saxlanılır")}
                          >
                            {fmt(
                              line.calculation.retainedMinor,
                              latest.currency,
                            )}
                          </span>
                          <strong
                            data-label={t("Refund", "Возврат", "Qaytarılacaq")}
                          >
                            {fmt(line.calculation.refundMinor, latest.currency)}
                          </strong>
                        </div>
                        <details>
                          <summary>
                            {t(
                              "Why this amount?",
                              "Почему эта сумма?",
                              "Niyə bu məbləğ?",
                            )}
                          </summary>
                          <p>{line.policyText}</p>
                          <p>
                            {fmt(line.calculation.paidMinor, latest.currency)} −{" "}
                            {fmt(
                              line.calculation.retainedMinor,
                              latest.currency,
                            )}{" "}
                            ={" "}
                            {fmt(line.calculation.refundMinor, latest.currency)}
                          </p>
                        </details>
                      </article>
                    );
                  })}
                </>
              )}
              <h2>{t("Next step", "Следующий шаг", "Növbəti addım")}</h2>
              <p>
                {latest.status === "PENDING"
                  ? t(
                      "The office will review your request. Confirmed services remain active until the team approves cancellation.",
                      "Офис проверит запрос. До подтверждения услуги остаются активными.",
                      "Ofis sorğunu yoxlayacaq. Komanda ləğvi təsdiqləyənədək xidmətlər aktiv qalır.",
                    )
                  : latest.status === "DECLINED"
                    ? t(
                        "Contact the team if you would like to discuss the decision.",
                        "Свяжитесь с командой, чтобы обсудить решение.",
                        "Qərarı müzakirə etmək üçün komanda ilə əlaqə saxlayın.",
                      )
                    : latest.refundMinor === 0
                      ? t(
                          "No refund is due. The cancellation decision is complete.",
                          "Возврат не предусмотрен. Решение по отмене принято.",
                          "Geri ödəniş nəzərdə tutulmur. Ləğv qərarı tamamlanıb.",
                        )
                      : refundState(l, latest.refundStatus)}
              </p>
              {updates.length > 1 && (
                <details>
                  <summary>
                    {t(
                      "Request history",
                      "История запросов",
                      "Sorğu tarixçəsi",
                    )}
                  </summary>
                  {updates.map((u) => (
                    <p key={u.id}>
                      <button
                        className="cancel-secondary"
                        onClick={() => setActiveUpdate(u.id)}
                      >
                        {date(u.created_at)} · {u.status}
                      </button>{" "}
                      {u.message}
                    </p>
                  ))}
                </details>
              )}
              {!pending &&
                context &&
                context.services.length > 0 &&
                !["CANCELLED", "REJECTED"].includes(context.bookingStatus) && (
                  <button
                    className="cancel-secondary"
                    onClick={() => {
                      setCompose(true);
                      setConsent(false);
                    }}
                  >
                    {t(
                      "Request another cancellation",
                      "Запросить ещё одну отмену",
                      "Başqa ləğv sorğusu göndər",
                    )}
                  </button>
                )}
            </div>
            <aside>
              <div className="cancel-sidecard">
                <h2>
                  {t(
                    "Your refund summary",
                    "Итог возврата",
                    "Geri ödəniş xülasəsi",
                  )}
                </h2>
                {latest.refundMinor !== undefined ? (
                  <>
                    <dl>
                      <dt>
                        {t(
                          "Assessed paid amount",
                          "Распределённая оплата",
                          "Hesablanan ödəniş",
                        )}
                      </dt>
                      <dd>{fmt(latest.paidMinor || 0, latest.currency)}</dd>
                      <dt>{t("Retained", "Удержано", "Saxlanılan")}</dt>
                      <dd>{fmt(latest.retainedMinor || 0, latest.currency)}</dd>
                      {!!latest.unaffectedMinor && (
                        <>
                          <dt>
                            {t(
                              "Kept for active services",
                              "На активные услуги",
                              "Aktiv xidmətlər üçün qalan",
                            )}
                          </dt>
                          <dd>
                            {fmt(latest.unaffectedMinor, latest.currency)}
                          </dd>
                        </>
                      )}
                      <dt className="cancel-total">
                        {t("Refund due", "К возврату", "Qaytarılacaq")}
                      </dt>
                      <dd className="cancel-total">
                        {fmt(latest.refundMinor, latest.currency)}
                      </dd>
                    </dl>
                    <p>
                      {latest.refundMinor > 0
                        ? refundState(l, latest.refundStatus)
                        : t(
                            "No refund is due for this cancellation.",
                            "Возврат по этой отмене не предусмотрен.",
                            "Bu ləğv üzrə geri ödəniş nəzərdə tutulmur.",
                          )}
                    </p>
                  </>
                ) : (
                  <p>
                    {t(
                      "To be assessed by our team",
                      "Будет рассчитано командой",
                      "Komandamız tərəfindən hesablanacaq",
                    )}
                  </p>
                )}
              </div>
              <div className="cancel-sidecard">
                <h2>
                  {t("Refund progress", "Ход возврата", "Geri ödənişin gedişi")}
                </h2>
                {latest.refundMessage && <p>{latest.refundMessage}</p>}
                <ol className="cancel-timeline">
                  <li className="done">
                    {t("Request received", "Запрос получен", "Sorğu alınıb")}
                    <small>{date(latest.created_at)}</small>
                  </li>
                  <li className={latest.status !== "PENDING" ? "done" : ""}>
                    {t("Office decision", "Решение офиса", "Ofisin qərarı")}
                    <small>
                      {latest.approved_at
                        ? date(latest.approved_at)
                        : t(
                            "Awaiting review",
                            "Ожидает проверки",
                            "Yoxlama gözləyir",
                          )}
                    </small>
                  </li>
                  {latest.status !== "DECLINED" && latest.refundMinor !== 0 && (
                    <>
                      <li>
                        {t(
                          "Refund processing",
                          "Обработка возврата",
                          "Geri ödənişin emalı",
                        )}
                        <small>{refundState(l, latest.refundStatus)}</small>
                      </li>
                      <li>
                        {t(
                          "Funds returned",
                          "Деньги возвращены",
                          "Pul qaytarılıb",
                        )}
                        <small>{refundState(l, latest.refundStatus)}</small>
                      </li>
                    </>
                  )}
                </ol>
                {latest.lines && (
                  <button
                    className="cancel-primary"
                    disabled={busy}
                    onClick={() => void download(latest)}
                  >
                    <Download size={18} />
                    {t(
                      "Download cancellation summary",
                      "Скачать сводку",
                      "Ləğv xülasəsini yüklə",
                    )}
                  </button>
                )}
                <a href={"/" + l + "/contact"}>
                  {t(
                    "Contact our team →",
                    "Связаться с командой →",
                    "Komandamızla əlaqə →",
                  )}
                </a>
              </div>
            </aside>
          </div>
        </>
      ) : context ? (
        <>
          <div className="cancel-customer-grid">
            <div className="cancel-main">
              <h2>
                {t(
                  "01 · What would you like to cancel?",
                  "01 · Что отменить?",
                  "01 · Nəyi ləğv etmək istəyirsiniz?",
                )}
              </h2>
              <label
                className={
                  "cancel-option " + (scope === "all" ? "selected" : "")
                }
              >
                <input
                  type="radio"
                  name="cancel-scope"
                  checked={scope === "all"}
                  onChange={() => {
                    setScope("all");
                    setSelection(context.services.map((s) => s.key));
                    setConsent(false);
                  }}
                />
                <span>
                  <strong>
                    {t("Entire trip", "Всю поездку", "Bütöv səfər")}
                  </strong>
                  <small>
                    {t(
                      "Cancel all remaining services.",
                      "Все оставшиеся услуги.",
                      "Qalan bütün xidmətləri ləğv et.",
                    )}
                  </small>
                </span>
              </label>
              <label
                className={
                  "cancel-option " + (scope === "selected" ? "selected" : "")
                }
              >
                <input
                  type="radio"
                  name="cancel-scope"
                  checked={scope === "selected"}
                  disabled={!context.contractId}
                  onChange={() => {
                    setScope("selected");
                    setSelection([]);
                    setConsent(false);
                  }}
                />
                <span>
                  <strong>
                    {t(
                      "Selected services",
                      "Выбранные услуги",
                      "Seçilmiş xidmətlər",
                    )}
                  </strong>
                  <small>
                    {context.contractId
                      ? t(
                          "Choose the services to cancel.",
                          "Выберите услуги для отмены.",
                          "Ləğv ediləcək xidmətləri seçin.",
                        )
                      : t(
                          "Available after contract confirmation.",
                          "Доступно после принятия договора.",
                          "Müqavilə təsdiqindən sonra mümkündür.",
                        )}
                  </small>
                </span>
              </label>
              <h2>
                {t(
                  "02 · Services included in your trip",
                  "02 · Услуги поездки",
                  "02 · Səfərdəki xidmətlər",
                )}
              </h2>
              {context.services.map((s) => {
                const Icon = icons[s.key as keyof typeof icons] || Car;
                return (
                  <article className="cancel-service-choice" key={s.key}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selection.includes(s.key)}
                        disabled={!context.contractId || busy}
                        onChange={(e) => {
                          setScope("selected");
                          setSelection((old) =>
                            e.target.checked
                              ? [...old, s.key]
                              : old.filter((k) => k !== s.key),
                          );
                          setConsent(false);
                        }}
                      />
                      <Icon size={28} />
                      <span>
                        <strong>{names[s.key] || s.name}</strong>
                        <small>{fmt(s.total * 100)}</small>
                      </span>
                    </label>
                    <details>
                      <summary>
                        {t(
                          "View cancellation terms",
                          "Условия отмены",
                          "Ləğv şərtlərinə bax",
                        )}
                      </summary>
                      <p>
                        {s.policy ||
                          t(
                            "No contract has been accepted yet. The team will check the request.",
                            "Договор ещё не принят. Офис проверит запрос.",
                            "Müqavilə hələ təsdiqlənməyib. Ofis sorğunu yoxlayacaq.",
                          )}
                      </p>
                    </details>
                  </article>
                );
              })}
              <h2>
                {t(
                  "03 · Tell us why you're cancelling",
                  "03 · Причина отмены",
                  "03 · Ləğvin səbəbini bildirin",
                )}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <label>
                  {t(
                    "Reason for cancellation",
                    "Причина отмены",
                    "Ləğvin səbəbi",
                  )}
                  <select
                    required
                    value={reason}
                    disabled={busy}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="">
                      {t("Select a reason", "Выберите причину", "Səbəb seçin")}
                    </option>
                    {[
                      [
                        "Change of plans",
                        t(
                          "Change of plans",
                          "Изменение планов",
                          "Planların dəyişməsi",
                        ),
                      ],
                      [
                        "Personal reasons",
                        t(
                          "Personal reasons",
                          "Личные причины",
                          "Şəxsi səbəblər",
                        ),
                      ],
                      ["Other", t("Other", "Другое", "Digər")],
                    ].map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t(
                    "Additional message (optional)",
                    "Комментарий (необязательно)",
                    "Əlavə qeyd (istəyə bağlı)",
                  )}
                  <textarea
                    value={message}
                    maxLength={1500}
                    rows={4}
                    disabled={busy}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </label>
                <div className="cancel-info">
                  {t(
                    "Our team checks each service with its supplier. Refunds depend on the agreed terms and the time of your request.",
                    "Команда проверит каждую услугу с поставщиком. Возврат зависит от согласованных условий и времени запроса.",
                    "Komandamız hər xidməti təchizatçı ilə yoxlayır. Geri ödəniş razılaşdırılmış şərtlərdən və sorğunun vaxtından asılıdır.",
                  )}
                </div>
                <h2>
                  {t(
                    "04 · Review and submit",
                    "04 · Проверить и отправить",
                    "04 · Yoxla və göndər",
                  )}
                </h2>
                <p>
                  {t(
                    "Sending a request does not cancel confirmed services immediately.",
                    "Отправка запроса не отменяет услуги немедленно.",
                    "Sorğunu göndərmək təsdiqlənmiş xidmətləri dərhal ləğv etmir.",
                  )}
                </p>
                <label className="cancel-consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    disabled={busy}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  {t(
                    "I want the team to review this cancellation request.",
                    "Прошу команду рассмотреть запрос отмены.",
                    "Komandanın bu ləğv sorğusunu yoxlamasını istəyirəm.",
                  )}
                </label>
                <div className="cancel-submit">
                  <button
                    className="cancel-primary"
                    disabled={
                      busy ||
                      !consent ||
                      !reason ||
                      !selection.length ||
                      pending ||
                      !context.services.length ||
                      ["CANCELLED", "REJECTED"].includes(context.bookingStatus)
                    }
                    type="submit"
                  >
                    {busy
                      ? t("Submitting…", "Отправка…", "Göndərilir…")
                      : t(
                          "Submit cancellation request",
                          "Отправить запрос",
                          "Ləğv sorğusunu göndər",
                        )}
                  </button>
                  <button
                    type="button"
                    className="cancel-secondary"
                    disabled={busy}
                    onClick={() => go("/trips/" + booking.id)}
                  >
                    {t("Keep my trip", "Сохранить поездку", "Səfərimi saxla")}
                  </button>
                </div>
              </form>
            </div>
            <aside>
              <div className="cancel-sidecard">
                <h2>{t("Your trip", "Ваша поездка", "Səfəriniz")}</h2>
                <p>{cabinetRoute(booking).join(" → ")}</p>
                <p>{cabinetDates(booking, l)}</p>
                <dl>
                  <dt>
                    {t("Total trip value", "Цена поездки", "Səfərin qiyməti")}
                  </dt>
                  <dd>
                    {fmt(
                      context.offer.services.reduce(
                        (n, s) => n + s.total * 100,
                        0,
                      ),
                    )}
                  </dd>
                  <dt>{t("Amount paid", "Оплачено", "Ödənilib")}</dt>
                  <dd>{fmt(context.paidMinor)}</dd>
                </dl>
                <hr />
                <strong>
                  {t(
                    "Potential refund",
                    "Возможный возврат",
                    "Mümkün geri ödəniş",
                  )}
                </strong>
                <p>
                  {t(
                    "To be assessed by our team",
                    "Будет рассчитано командой",
                    "Komandamız tərəfindən hesablanacaq",
                  )}
                </p>
              </div>
              <div className="cancel-sidecard">
                <h2>
                  {t(
                    "How cancellation works",
                    "Как проходит отмена",
                    "Ləğv necə işləyir",
                  )}
                </h2>
                {latest.refundMessage && <p>{latest.refundMessage}</p>}
                <ol className="cancel-timeline">
                  <li>
                    {t("Request received", "Запрос получен", "Sorğu alınır")}
                  </li>
                  <li>
                    {t("Office review", "Проверка офисом", "Ofis yoxlayır")}
                  </li>
                  <li>
                    {t(
                      "Decision & refund update",
                      "Решение и статус возврата",
                      "Qərar və geri ödəniş statusu",
                    )}
                  </li>
                </ol>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}
