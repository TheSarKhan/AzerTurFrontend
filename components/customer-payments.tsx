"use client";
import { useEffect, useState } from "react";
import CustomerRevisedPlan from "./customer-revised-plan";
import {
  ArrowLeft,
  BedDouble,
  Car,
  Check,
  Clock,
  CreditCard,
  FileText,
  Flower2,
  Plane,
  Users,
  Wallet,
} from "lucide-react";
import { customerApi, type Booking } from "@/lib/customer-api";
import { cabinetDates, cabinetRoute } from "@/lib/customer-cabinet";
import type { Locale } from "@/lib/travel";
type Request = {
  id: string;
  contract_id: string;
  kind: string;
  service_key: string | null;
  amount_minor: number;
  currency: string;
  status: string;
  customer_message: string;
  paid_at?: string | null;
};
type Service = { key: string; name: string; total: number };
type Context = {
  contract: { id: string; version: number } | null;
  offer: {
    title: string;
    currency: string;
    total: number;
    travelers: number;
    services: Service[];
  } | null;
  requests: Request[];
  paidMinor: number;
  receivedMinor?: number;
  paymentBlocked: boolean;
};
export default function CustomerPayments({
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
  const [data, setData] = useState<Context | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setLoading(true);
    customerApi<Context>("bookings/" + booking.id + "/payment-context")
      .then((x) => {
        if (live) setData(x);
      })
      .catch(() => {
        if (live)
          setError(
            t(
              "Could not load payments.",
              "Не удалось загрузить оплату.",
              "Ödənişləri yükləmək olmadı.",
            ),
          );
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [booking.id]);
  const fmt = (n: number) =>
    new Intl.NumberFormat(l === "az" ? "az-AZ" : l, {
      style: "currency",
      currency: data?.offer?.currency || booking.currency,
    }).format(n / 100);
  const active =
    data?.requests.filter(
      (r) =>
        (r.status === "PAID" || r.contract_id === data.contract?.id) &&
        r.status !== "CANCELLED" &&
        r.status !== "FAILED" &&
        (!data.paymentBlocked || r.status === "PAID"),
    ) || [];
  const icons = {
    transport: Car,
    hotel: BedDouble,
    guide: Users,
    transfer: Plane,
    activity: Flower2,
  };
  const names: Record<string, string> = {
    transport: t(
      "Private car & driver",
      "Авто с водителем",
      "Şəxsi avtomobil və sürücü",
    ),
    hotel: t("Comfort stay", "Проживание", "Oteldə qalma"),
    guide: t("Local guide", "Местный гид", "Yerli bələdçi"),
    transfer: t("Airport transfer", "Трансфер", "Hava limanı transferi"),
    activity: t("Local experience", "Впечатление", "Yerli təcrübə"),
  };
  const baseKey = (k: string | null) => (k || "").split("-")[0];
  const title = (r: Request) =>
    r.kind === "DEPOSIT"
      ? t("Deposit", "Депозит", "Beh")
      : names[baseKey(r.service_key)] ||
        data?.offer?.services.find((x) => x.key === r.service_key)?.name ||
        r.service_key ||
        "";
  const day = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const two = (n: number) => String(n).padStart(2, "0");
    return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`;
  };
  const open = active.filter((r) => r.status === "OPEN");
  const total = data?.offer ? Math.round(data.offer.total * 100) : 0;
  const paid = data?.paidMinor ?? 0;
  const left = Math.max(0, total - paid);
  const share = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <section className="cc-container pay-page">
      <button className="pay-back" onClick={() => go("/trips/" + booking.id)}>
        <ArrowLeft size={17} />
        {t("Back to my trip", "К поездке", "Səfərə qayıt")}
      </button>
      <h1>{t("Payments", "Оплата", "Ödənişlər")}</h1>
      <p className="pp-sub">
        {cabinetRoute(booking).join(" → ")}, {cabinetDates(booking, l)}
      </p>
      <CustomerRevisedPlan
        bookingId={booking.id}
        locale={l}
        onAccepted={() => {
          customerApi<Context>("bookings/" + booking.id + "/payment-context")
            .then(setData)
            .catch(() => setError("Please refresh payments."));
        }}
      />
      {loading ? (
        <p role="status">{t("Loading…", "Загрузка…", "Yüklənir…")}</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !data?.contract || !data.offer ? (
        <div className="pay-notice">
          <FileText />
          <div>
            <strong>
              {t(
                "Contract confirmation required",
                "Необходимо подтвердить договор",
                "Müqavilə təsdiqi tələb olunur",
              )}
            </strong>
            <p>
              {t(
                "Payment requests appear after the current contract is accepted.",
                "Запросы оплаты появятся после принятия договора.",
                "Cari müqavilə təsdiqləndikdən sonra ödəniş tələbləri görünəcək.",
              )}
            </p>
            <button
              className="pay-link"
              onClick={() => go("/trips/" + booking.id)}
            >
              {t(
                "View your documents →",
                "Открыть документы →",
                "Sənədlərə bax →",
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="pp">
          <div className="pp-summary">
            <div>
              <small>{t("Trip total", "Сумма поездки", "Səfərin cəmi")}</small>
              <strong>{fmt(total)}</strong>
            </div>
            <div className="ok">
              <small>{t("Paid", "Оплачено", "Ödənilib")}</small>
              <strong>{fmt(paid)}</strong>
            </div>
            <div>
              <small>{t("Remaining", "Остаток", "Qalıq")}</small>
              <strong>{fmt(left)}</strong>
            </div>
            <div
              className="pp-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={share}
            >
              <span style={{ width: share + "%" }} />
            </div>
          </div>
          {data.receivedMinor !== undefined &&
            data.receivedMinor !== data.paidMinor && (
              <p className="pp-note">
                {t(
                  "The payment history includes your original deposit. The revised balance covers funds allocated to active services after service changes.",
                  "История содержит первоначальный депозит. Новый остаток учитывает средства на действующие услуги после изменений услуг.",
                  "Ödəniş tarixçəsində ilkin beh də var. Yenilənmiş qalıq xidmət dəyişikliklərindən sonra aktiv xidmətlərə ayrılan məbləği nəzərə alır.",
                )}
              </p>
            )}

          {data.paymentBlocked && (
            <div className="pp-wait">
              <Clock size={22} aria-hidden="true" />
              <p>
                {t(
                  "Payment requests are paused while your team reviews changes or cancellation.",
                  "Запросы оплаты приостановлены на время проверки.",
                  "Dəyişiklik və ya ləğv yoxlanılarkən ödəniş tələbləri dayandırılıb.",
                )}
              </p>
            </div>
          )}

          <h2>{t("What is asked of you", "Что требуется от вас", "Sizdən nə tələb olunur")}</h2>
          {open.length ? (
            open.map((r) => (
              <div className="pp-due" key={r.id}>
                <span className="pp-due-icon">
                  <Wallet size={26} aria-hidden="true" />
                </span>
                <div className="pp-due-body">
                  <small>{t("Payment requested", "Запрошена оплата", "Ödəniş tələb olunur")}</small>
                  <strong>{title(r)}</strong>
                  {r.customer_message && <p className="pp-msg">{r.customer_message}</p>}
                  <p>
                    {t(
                      "Our team provides the payment details. Once we receive your payment, this request is marked as paid here.",
                      "Реквизиты для оплаты предоставляет наша команда. Как только мы получим платёж, запрос будет отмечен здесь как оплаченный.",
                      "Ödəniş rekvizitlərini komandamız təqdim edir. Ödənişi aldıqdan sonra bu sorğu burada ödənilmiş kimi qeyd olunacaq.",
                    )}
                  </p>
                  <a className="pp-contact" href={"/" + l + "/contact"}>
                    {t("Contact our team →", "Связаться с командой →", "Komandamızla əlaqə →")}
                  </a>
                </div>
                <b className="pp-due-amount">{fmt(r.amount_minor)}</b>
              </div>
            ))
          ) : (
            <div className={"pp-clear" + (left === 0 && total > 0 ? " done" : "")}>
              <span>
                {left === 0 && total > 0 ? <Check size={22} aria-hidden="true" /> : <CreditCard size={22} aria-hidden="true" />}
              </span>
              <p>
                {left === 0 && total > 0
                  ? t("Everything is paid.", "Всё оплачено.", "Hər şey ödənilib.")
                  : t(
                      "No payment is requested from you right now. Your team will request the next one when needed.",
                      "Сейчас оплата не запрашивается. Команда запросит следующую, когда потребуется.",
                      "Hazırda sizdən ödəniş tələb olunmur. Komanda növbəti ödənişi lazım olanda tələb edəcək.",
                    )}
              </p>
            </div>
          )}

          <h2>{t("Payment history", "История платежей", "Ödəniş tarixçəsi")}</h2>
          {active.length ? (
            <ul className="pp-list">
              {active.map((r) => (
                <li key={r.id}>
                  <span className="pp-ico">
                    {r.kind === "DEPOSIT" ? (
                      <Wallet size={20} aria-hidden="true" />
                    ) : (
                      (() => {
                        const Icon = icons[baseKey(r.service_key) as keyof typeof icons] || CreditCard;
                        return <Icon size={20} aria-hidden="true" />;
                      })()
                    )}
                  </span>
                  <span className="pp-li-main">
                    <strong>{title(r)}</strong>
                    {r.status === "PAID" && r.paid_at && (
                      <small>{day(r.paid_at)}</small>
                    )}
                  </span>
                  <span className={"pp-badge " + (r.status === "PAID" ? "ok" : "wait")}>
                    {r.status === "PAID"
                      ? t("Paid", "Оплачено", "Ödənilib")
                      : t("Awaiting payment", "Ожидает оплаты", "Ödəniş gözlənilir")}
                  </span>
                  <b>{fmt(r.amount_minor)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pp-empty">
              {t("No payments yet.", "Платежей пока нет.", "Hələ ödəniş yoxdur.")}
            </p>
          )}

          <h2>{t("Services in your trip", "Услуги в поездке", "Səfərinizə daxil olan xidmətlər")}</h2>
          <ul className="pp-list plain">
            {data.offer.services.map((s) => {
              const Icon = icons[baseKey(s.key) as keyof typeof icons] || Car;
              return (
                <li key={s.key}>
                  <span className="pp-ico">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="pp-li-main">
                    <strong>{names[baseKey(s.key)] || s.name}</strong>
                  </span>
                  <b>{fmt(s.total * 100)}</b>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
