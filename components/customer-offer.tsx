"use client";
import { FileText } from "lucide-react";
import { money, type Locale } from "@/lib/travel";
import type { CustomerOffer } from "@/lib/customer-api";
export const offerStatus = (l: Locale) =>
  ({
    en: "Offer ready for review",
    ru: "Предложение готово к просмотру",
    az: "Təklif baxış üçün hazırdır",
  })[l];
export const originalEstimate = (l: Locale) =>
  ({
    en: "Original request estimate",
    ru: "Исходная оценка заявки",
    az: "İlkin sorğu hesablaması",
  })[l];
export default function CustomerOfferView({
  offer,
  locale: l,
  compact = false,
}: {
  offer: CustomerOffer;
  locale: Locale;
  compact?: boolean;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const unitMoney = (value: number) =>
    new Intl.NumberFormat(l === "az" ? "en" : l, {
      style: "currency",
      currency: offer.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(value);
  const units: Record<string, string> = {
    day: t("days", "дн.", "gün"),
    room: t("room(s)", "ном.", "otaq"),
    person: t("travelers", "чел.", "nəfər"),
    transfer: t("transfer", "трансфер", "transfer"),
  };
  if (compact)
    return (
      <div className="cc-sage">
        <FileText size={24} />
        <div>
          <strong>
            {offerStatus(l)} · v{offer.revision}
          </strong>
          <p>
            {t(
              "Offer group total",
              "Сумма предложения",
              "Təklif üzrə qrup cəmi",
            )}
            : {money(offer.total, offer.currency, l)}.{" "}
            {t(
              "Open the request to review the offer. No payment is requested.",
              "Откройте заявку для просмотра. Оплата не запрашивается.",
              "Təklifə baxmaq üçün sorğunu aç. Ödəniş tələb olunmur.",
            )}
          </p>
        </div>
      </div>
    );
  return (
    <section id="cc-offer" className="cc-confirmed-offer">
      <h2>
        <FileText size={24} />
        {t("Your offer", "Ваше предложение", "Təklifin")} · v{offer.revision}
      </h2>
      <h3>{offer.title}</h3>
      <p>
        {offer.date} · {offer.travelers} {t("travelers", "чел.", "nəfər")}
      </p>
      {offer.itinerary.map((day, i) => (
        <div className="cc-offer-day" key={i}>
          <strong>
            {t("Day", "День", "Gün")} {i + 1} · {day.city}
          </strong>
          <p>{day.description}</p>
        </div>
      ))}
      <p>{offer.returnRoute}</p>
      {offer.services.map((line) => (
        <details key={line.key} className="cc-offer-service">
          <summary>
            <strong>{line.name}</strong>
            <strong>{money(line.total, offer.currency, l)}</strong>
          </summary>
          <p>
            {line.quantity} {units[line.unit] || line.unit}
            {line.unit === "room"
              ? ` × ${line.nights} ${t("night(s)", "ноч.", "gecə")}`
              : ""}{" "}
            × {unitMoney(line.unitPrice)}
          </p>
          <h3>{t("Cancellation terms", "Условия отмены", "Ləğv şərtləri")}</h3>
          <p>{line.policy}</p>
        </details>
      ))}
      <div className="cc-service cc-service-total">
        <strong>
          {t("Offer group total", "Сумма предложения", "Təklif üzrə qrup cəmi")}
        </strong>
        <strong>{money(offer.total, offer.currency, l)}</strong>
      </div>
      <p className="cc-notes">{offer.message}</p>
      <p>
        {t(
          "No payment is requested. PDF contract approval and staged payments are planned next steps.",
          "Оплата не запрашивается. PDF-договор и поэтапная оплата — следующие этапы.",
          "Ödəniş tələb olunmur. PDF müqavilə təsdiqi və mərhələli ödənişlər sonrakı planlaşdırılan addımlardır.",
        )}
      </p>
    </section>
  );
}
