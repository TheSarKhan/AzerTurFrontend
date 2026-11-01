import { type Booking, type BookingRequest } from "./customer-api";
import { type Quote, type Locale, tours } from "./travel";
export function bookingQuote(booking: Booking): Quote | null {
  try {
    const q = JSON.parse(booking.quotePayload);
    return q?.input && Array.isArray(q.lines) ? (q as Quote) : null;
  } catch {
    return null;
  }
}
export function cabinetTitle(booking: Booking, locale: Locale) {
  const q = bookingQuote(booking);
  if (q?.input.customDays)
    return {
      en: "Your custom journey",
      ru: "Ваш маршрут",
      az: "Fərdi səfəriniz",
    }[locale];
  return (
    tours.find((t) => t.slug === q?.input.slug)?.name[
      locale === "az" ? 2 : locale === "ru" ? 1 : 0
    ] || booking.title
  );
}
export function cabinetRoute(booking: Booking) {
  const q = bookingQuote(booking);
  if (q?.input.cities?.length) return q.input.cities;
  return q?.input.slug === "baku-discovery"
    ? ["Baku"]
    : q?.input.slug === "sheki-gabala"
      ? ["Baku", "Gabala", "Sheki"]
      : q?.input.slug === "quba-khinalug"
        ? ["Quba", "Khinalug"]
        : [];
}
export function cabinetPhoto(booking: Booking) {
  const end = cabinetRoute(booking).at(-1);
  return end === "Baku"
    ? "baku"
    : end === "Sheki"
      ? "sheki"
      : end === "Gabala"
        ? "gabala"
        : "khinalug";
}
export function tripEnd(booking: Booking) {
  const q = bookingQuote(booking);
  const days =
    q?.input.customDays ||
    tours.find((t) => t.slug === q?.input.slug)?.days ||
    1;
  const date = new Date(booking.departure + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days - 1);
  return date.toISOString().slice(0, 10);
}
export function filterTrips(
  bookings: Booking[],
  filter: string,
  today: string,
) {
  return bookings.filter(
    (b) =>
      filter === "all" ||
      (filter === "past"
        ? tripEnd(b) < today || ["CANCELLED", "REJECTED"].includes(b.status)
        : tripEnd(b) >= today && !["CANCELLED", "REJECTED"].includes(b.status)),
  );
}
export function paymentAvailable(booking: Booking, requests: BookingRequest[]) {
  return (
    !requests.some(
      (r) => r.bookingId === booking.id && r.status === "PENDING",
    ) &&
    (booking.status === "AWAITING_PAYMENT" ||
      (booking.status === "CONFIRMED" && booking.paid < booking.total))
  );
}
export function cabinetDates(booking: Booking, locale: Locale) {
  const start = booking.departure.split("-").map(Number),
    end = tripEnd(booking).split("-").map(Number);
  const months = {
    en: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    ru: [
      "янв.",
      "февр.",
      "мар.",
      "апр.",
      "мая",
      "июн.",
      "июл.",
      "авг.",
      "сен.",
      "окт.",
      "нояб.",
      "дек.",
    ],
    az: [
      "yan",
      "fev",
      "mar",
      "apr",
      "may",
      "iyn",
      "iyl",
      "avq",
      "sen",
      "okt",
      "noy",
      "dek",
    ],
  }[locale];
  const full = (date: number[]) =>
    `${date[2]} ${months[date[1] - 1]} ${date[0]}`;
  if (start[0] !== end[0]) return `${full(start)} – ${full(end)}`;
  if (start[1] !== end[1])
    return `${start[2]} ${months[start[1] - 1]} – ${full(end)}`;
  return `${start[2]}${start[2] === end[2] ? "" : "–" + end[2]} ${months[start[1] - 1]} ${start[0]}`;
}
export function cabinetCity(city: string, locale: Locale) {
  const names: Record<string, [string, string, string]> = {
    Baku: ["Baku", "Баку", "Bakı"],
    Quba: ["Quba", "Губа", "Quba"],
    Khinalug: ["Khinalug", "Хыналыг", "Xınalıq"],
    Gabala: ["Gabala", "Габала", "Qəbələ"],
    Sheki: ["Sheki", "Шеки", "Şəki"],
  };
  return names[city]?.[locale === "az" ? 2 : locale === "ru" ? 1 : 0] || city;
}
