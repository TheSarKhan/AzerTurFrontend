"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import CustomerRevisedPlan from "./customer-revised-plan";
import {
  ArrowLeft,
  Car,
  BedDouble,
  Users,
  Plane,
  Flower2,
  FileText,
} from "lucide-react";
import { customerApi, type Booking } from "@/lib/customer-api";
import {
  cabinetPhoto,
  cabinetDates,
  cabinetRoute,
} from "@/lib/customer-cabinet";
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
        (!data.paymentBlocked || r.status === "PAID"),
    ) || [];
  const deposit = active.find((r) => r.kind === "DEPOSIT"),
    icons = {
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
    guide: t("Local guide", "Местный гид", "Yerli gid"),
    transfer: t("Airport transfer", "Трансфер", "Hava limanı transferi"),
    activity: t("Local experience", "Впечатление", "Yerli təcrübə"),
  };
  const status = (r?: Request) =>
    !r
      ? t("Not requested yet", "Ещё не запрошено", "Hələ tələb olunmayıb")
      : r.status === "PAID"
        ? t("Paid", "Оплачено", "Ödənilib")
        : t("Awaiting payment", "Ожидает оплаты", "Ödəniş gözlənilir");
  return (
    <section className="cc-container pay-page">
      <button className="pay-back" onClick={() => go("/trips/" + booking.id)}>
        <ArrowLeft size={17} />
        {t("Back to my trip", "К поездке", "Səfərə qayıt")}
      </button>
      <h1>
        {t(
          "Payments for your journey",
          "Оплата поездки",
          "Səfərinizin ödənişləri",
        )}
      </h1>
      <p>
        #{booking.id.slice(0, 8)} · {cabinetDates(booking, l)}
      </p>
      <div className="pay-photo">
        <Image
          src={"/images/homepage-v3/" + cabinetPhoto(booking) + ".png"}
          alt={cabinetRoute(booking).join(" · ")}
          fill
          sizes="100vw"
        />
      </div>
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
        <div className="pay-grid">
          <div>
            <div className="pay-notice">
              <FileText />
              <div>
                <strong>
                  {t(
                    "Contract approved",
                    "Договор подтверждён",
                    "Müqavilə təsdiqlənib",
                  )}{" "}
                  · v{data.contract.version}
                </strong>
                <p>
                  {t(
                    "Your team will request payments as needed.",
                    "Команда запросит оплату по мере необходимости.",
                    "Komanda ödənişləri ehtiyac olduqda tələb edəcək.",
                  )}
                </p>
              </div>
            </div>
            {data.paymentBlocked && (
              <p className="pay-notice">
                {t(
                  "Payment requests are paused while your team reviews changes or cancellation.",
                  "Запросы оплаты приостановлены на время проверки.",
                  "Dəyişiklik və ya ləğv yoxlanılarkən ödəniş tələbləri dayandırılıb.",
                )}
              </p>
            )}
            {data.receivedMinor !== undefined &&
              data.receivedMinor !== data.paidMinor && (
                <p className="pay-notice">
                  {t(
                    "The payment history includes your original deposit. The revised balance covers funds allocated to active services after service changes.",
                    "История содержит первоначальный депозит. Новый остаток учитывает средства на действующие услуги после изменений услуг.",
                    "Ödəniş tarixçəsində ilkin beh də var. Yenilənmiş qalıq xidmət dəyişikliklərindən sonra aktiv xidmətlərə ayrılan məbləği nəzərə alır.",
                  )}
                </p>
              )}
            <div className="pay-card">
              <h2>
                {t(
                  "Deposit and payments",
                  "Депозит и платежи",
                  "Beh və ödənişlər",
                )}
              </h2>
              {deposit ? (
                <div className="pay-due">
                  <div>
                    <strong>
                      {t(
                        "Deposit for your journey",
                        "Депозит за поездку",
                        "Səfəriniz üçün beh",
                      )}
                    </strong>
                    <h2>{fmt(deposit.amount_minor)}</h2>
                    <p>{status(deposit)}</p>
                    {deposit.customer_message && (
                      <p>{deposit.customer_message}</p>
                    )}
                  </div>
                  {deposit.status !== "PAID" && (
                    <div>
                      <p>
                        {t(
                          "Our team provides the payment details. Once we receive your payment, this request is marked as paid here.",
                          "Реквизиты для оплаты предоставляет наша команда. Как только мы получим платёж, запрос будет отмечен здесь как оплаченный.",
                          "Ödəniş rekvizitlərini komandamız təqdim edir. Ödənişi aldıqdan sonra bu sorğu burada ödənilmiş kimi qeyd olunacaq.",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p>
                  {t(
                    "No deposit has been requested yet.",
                    "Депозит ещё не запрошен.",
                    "Hələ beh tələb olunmayıb.",
                  )}
                </p>
              )}
              <h3>
                {t(
                  "Trip total and balance",
                  "Сумма и остаток",
                  "Səfərin cəmi və qalıq",
                )}
              </h3>
              <div className="pay-row">
                <span>{t("Trip total", "Сумма поездки", "Səfərin cəmi")}</span>
                <strong>{fmt(data.offer.total * 100)}</strong>
              </div>
              <div className="pay-row">
                <span>
                  {data.receivedMinor !== undefined &&
                  data.receivedMinor !== data.paidMinor
                    ? t(
                        "Received for active services",
                        "Получено за действующие услуги",
                        "Aktiv xidmətlər üzrə alınıb",
                      )
                    : t("Paid", "Оплачено", "Ödənilib")}
                </span>
                <strong>{fmt(data.paidMinor)}</strong>
              </div>
              <div className="pay-row">
                <span>{t("Remaining", "Остаток", "Qalıq")}</span>
                <strong>
                  {fmt(Math.max(0, data.offer.total * 100 - data.paidMinor))}
                </strong>
              </div>
            </div>
            <div className="pay-card">
              <h2>
                {t(
                  "Later service payments",
                  "Последующие платежи",
                  "Sonrakı xidmət ödənişləri",
                )}
              </h2>
              <p>
                {t(
                  "Your operator will request individual services when needed.",
                  "Оператор запросит оплату услуг по мере необходимости.",
                  "Operator ehtiyac olduqda xidmətlər üzrə ayrıca ödəniş tələb edəcək.",
                )}
              </p>
              {data.offer.services.map((s) => {
                const Icon = icons[s.key as keyof typeof icons] || Car;
                const r =
                  active.find(
                    (x) =>
                      x.kind === "SERVICE" &&
                      x.service_key === s.key &&
                      x.status === "OPEN",
                  ) ||
                  active.find(
                    (x) => x.kind === "SERVICE" && x.service_key === s.key,
                  );
                return (
                  <div className="pay-service" key={s.key}>
                    <Icon size={24} />
                    <strong>{names[s.key] || s.name}</strong>
                    <span>{fmt(s.total * 100)}</span>
                    <span>
                      {status(r)}
                      {r && r.status === "OPEN"
                        ? " · " + fmt(r.amount_minor)
                        : ""}
                    </span>
                    {r?.customer_message && <p>{r.customer_message}</p>}
                  </div>
                );
              })}
            </div>
            <div className="pay-card">
              <h2>
                {t("Payment activity", "История платежей", "Ödəniş tarixçəsi")}
              </h2>
              {active.some((r) => r.status === "PAID") ? (
                active
                  .filter((r) => r.status === "PAID")
                  .map((r) => (
                    <div className="pay-row" key={r.id}>
                      <span>
                        {r.kind === "DEPOSIT"
                          ? t("Deposit", "Депозит", "Beh")
                          : names[r.service_key || ""] || r.service_key}
                      </span>
                      <strong>{fmt(r.amount_minor)}</strong>
                    </div>
                  ))
              ) : (
                <p>
                  {t(
                    "No payments yet.",
                    "Платежей пока нет.",
                    "Hələ ödəniş yoxdur.",
                  )}
                </p>
              )}
            </div>
          </div>
          <aside>
            <div className="pay-card">
              <h2>{t("Your journey", "Ваша поездка", "Səfəriniz")}</h2>
              <p>{cabinetRoute(booking).join(" → ")}</p>
              <p>
                {cabinetDates(booking, l)} · {data.offer.travelers}{" "}
                {t("travelers", "чел.", "nəfər")}
              </p>
              <h3>{t("Payment summary", "Итог оплаты", "Ödəniş xülasəsi")}</h3>
              <div className="pay-row">
                <span>{t("Total", "Итого", "Cəm")}</span>
                <strong>{fmt(data.offer.total * 100)}</strong>
              </div>
              <div className="pay-row">
                <span>
                  {data.receivedMinor !== undefined &&
                  data.receivedMinor !== data.paidMinor
                    ? t(
                        "Received for active services",
                        "Получено за действующие услуги",
                        "Aktiv xidmətlər üzrə alınıb",
                      )
                    : t("Paid", "Оплачено", "Ödənilib")}
                </span>
                <strong>{fmt(data.paidMinor)}</strong>
              </div>
              <div className="pay-row">
                <span>{t("Remaining", "Остаток", "Qalıq")}</span>
                <strong>
                  {fmt(Math.max(0, data.offer.total * 100 - data.paidMinor))}
                </strong>
              </div>
            </div>
            <div className="pay-card">
              <h2>{t("Need help?", "Нужна помощь?", "Kömək lazımdır?")}</h2>
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
      )}
    </section>
  );
}
