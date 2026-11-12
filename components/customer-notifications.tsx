"use client";
import { useEffect, useState } from "react";
import { Bell, ArrowRight } from "lucide-react";
import { customerApi } from "@/lib/customer-api";
import type { Locale } from "@/lib/travel";
type Notice = {
  id: string;
  booking_id: string | null;
  event: string;
  read_at: string | null;
  created_at: string;
};
export default function CustomerNotifications({
  locale: l,
  go,
  onUnreadChange,
}: {
  locale: Locale;
  go: (path: string) => void;
  onUnreadChange?: (count: number) => void;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [data, setData] = useState<{ unread: number; items: Notice[] } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load() {
    try {
      const next = await customerApi<{ unread: number; items: Notice[] }>(
        "bookings/notifications",
      );
      setData(next);
      onUnreadChange?.(next.unread);
    } catch {
      setError(
        t(
          "Could not load notifications.",
          "Не удалось загрузить уведомления.",
          "Bildirişlər yüklənmədi.",
        ),
      );
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const names: Record<string, string> = {
    AMENDMENT_SENT: t(
      "A change proposal is ready",
      "Предложение изменения готово",
      "Dəyişiklik təklifi hazırdır",
    ),
    AMENDMENT_ACCEPTED: t(
      "Your changes are confirmed",
      "Изменения подтверждены",
      "Dəyişikliklər təsdiqlənib",
    ),
    AMENDMENT_DECLINED: t(
      "Change proposal declined",
      "Предложение отклонено",
      "Dəyişiklik təklifi rədd edilib",
    ),
    AMENDMENT_REFUND_UPDATED: t(
      "Refund tracking updated",
      "Статус возврата обновлён",
      "Geri qaytarılmanın vəziyyəti yenilənib",
    ),
    OFFER_SENT: t(
      "Your travel offer is ready",
      "Предложение поездки готово",
      "Səfər təklifiniz hazırdır",
    ),
    CONTRACT_SENT: t(
      "A contract is ready for your review",
      "Договор готов к просмотру",
      "Müqavilə baxışınız üçün hazırdır",
    ),
    PAYMENT_REQUESTED: t(
      "A payment has been requested",
      "Запрошена оплата",
      "Ödəniş tələbi göndərilib",
    ),
    PAYMENT_RECEIVED: t(
      "Your payment was received",
      "Ваш платёж получен",
      "Ödənişiniz qəbul edildi",
    ),
    REVISED_PLAN_SENT: t(
      "Review your revised payment plan",
      "Проверьте обновлённый план оплаты",
      "Yenilənmiş ödəniş planını yoxlayın",
    ),
    REFUND_UPDATED: t(
      "Your refund tracking was updated",
      "Статус возврата обновлён",
      "Geri qaytarılmanın vəziyyəti yenilənib",
    ),
  };
  return (
    <section className="cn">
      <div className="cn-heading">
        <div>
          <Bell size={26} />
          <h1>{t("Notifications", "Уведомления", "Bildirişlər")}</h1>
          <p>
            {data?.unread ?? "—"} {t("unread", "непрочитанных", "oxunmamış")}
          </p>
        </div>
        <button
          disabled={busy || !data?.unread}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await customerApi("bookings/notifications/read-all", {});
              await load();
            } catch {
              setError(
                t(
                  "Could not mark notifications as read.",
                  "Не удалось отметить прочитанными.",
                  "Oxunmuş kimi qeyd edilmədi.",
                ),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("Mark all as read", "Прочитать все", "Hamısını oxunmuş et")}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {data?.items.map((n) => (
        <article key={n.id} className={n.read_at ? "cn-read" : ""}>
          <span className="cn-dot" />
          <div>
            <h3>
              {names[n.event] ||
                t(
                  "Your journey has an update",
                  "Ваша поездка обновлена",
                  "Səfərinizdə yenilik var",
                )}
            </h3>
            <p>
              {new Date(n.created_at).toLocaleString(l)}
              {n.booking_id ? " · #" + n.booking_id.slice(0, 8) : ""}
            </p>
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await customerApi(
                  "bookings/notifications/" + n.id + "/read",
                  {},
                );
                if (n.booking_id)
                  go(
                    "/trips/" +
                      n.booking_id +
                      (n.event.startsWith("AMENDMENT_")
                        ? "/changes"
                        : n.event === "REVISED_PLAN_SENT" ||
                            n.event === "PAYMENT_REQUESTED"
                          ? "/payments"
                          : n.event === "REFUND_UPDATED"
                            ? "/cancellation"
                            : ""),
                  );
                else await load();
              } catch {
                setError(
                  t(
                    "Could not open this update.",
                    "Не удалось открыть обновление.",
                    "Yenilik açılmadı.",
                  ),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("View", "Открыть", "Bax")}
            <ArrowRight size={16} />
          </button>
        </article>
      ))}
      {data && !data.items.length && (
        <p>
          {t(
            "Your journey updates will appear here.",
            "Здесь будут обновления ваших поездок.",
            "Səfər yenilikləri burada görünəcək.",
          )}
        </p>
      )}
      <button onClick={() => go("/trips")}>
        {t("Back to my trips", "К моим поездкам", "Səfərlərimə qayıt")}
      </button>
    </section>
  );
}
