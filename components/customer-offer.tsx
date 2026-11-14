"use client";
import { FileText } from "lucide-react";
import { money, type Locale } from "@/lib/travel";
import { places } from "@/lib/places";
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
            {offerStatus(l)}, v{offer.revision}
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
        {t("Your offer", "Ваше предложение", "Təklifin")}, v{offer.revision}
      </h2>
      <h3>{offer.title}</h3>
      <p>
        {offer.date}, {offer.travelers} {t("travelers", "чел.", "nəfər")}
      </p>
      {(() => {
        // The trip as the customer planned it: start, every day with its places, end, and under each place
        // the services that belong to it.
        const count = offer.itinerary.length;
        const rowOf = (line: CustomerOffer["services"][number]) =>
          Math.min(
            Math.max(line.row ?? (line.key.replace(/-\d+$/, "").startsWith("transfer") ? 0 : 1), 0),
            count + 1,
          );
        const days: { day: number; rows: number[] }[] = [];
        offer.itinerary.forEach((d, i) => {
          const day = d.day ?? i + 1;
          const last = days[days.length - 1];
          if (last && last.day === day) last.rows.push(i + 1);
          else days.push({ day, rows: [i + 1] });
        });
        const city = (c: string) => places[c]?.name[l === "az" ? 2 : l === "ru" ? 1 : 0] ?? c;
        const services = (row: number) =>
          offer.services
            .filter((line) => rowOf(line) === row)
            .map((line) => (
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
            ));
        return (
          <div className="cc-offer-route">
            <div className="cc-offer-day cc-offer-end">
              <strong>
                {t("Start", "Старт", "Başlanğıc")}, {city(offer.startCity || "Baku")}
              </strong>
              {services(0)}
            </div>
            {days.map((g) => (
              <div className="cc-offer-day" key={g.day}>
                <strong>
                  {t("Day", "День", "Gün")} {g.day}
                </strong>
                {g.rows.map((row) => {
                  const d = offer.itinerary[row - 1];
                  return (
                    <div className="cc-offer-place" key={row}>
                      <b>{city(d.city)}</b>
                      {d.description.trim() &&
                        d.description.trim().toLowerCase() !== d.city.toLowerCase() && (
                          <p>{d.description}</p>
                        )}
                      {services(row)}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="cc-offer-day cc-offer-end">
              <strong>
                {t("Return", "Возвращение", "Qayıdış")}, {city(offer.endCity || "Baku")}
              </strong>
              {services(count + 1)}
            </div>
          </div>
        );
      })()}
      <div className="cc-service cc-service-total">
        <strong>
          {t("Offer group total", "Сумма предложения", "Təklif üzrə qrup cəmi")}
        </strong>
        <strong>{money(offer.total, offer.currency, l)}</strong>
      </div>
      <p className="cc-notes">{offer.message}</p>
    </section>
  );
}
