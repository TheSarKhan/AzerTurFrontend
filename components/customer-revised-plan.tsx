"use client";
import { useEffect, useState } from "react";
import { customerApi } from "@/lib/customer-api";
import type { Locale } from "@/lib/travel";
type Plan = {
  id: string;
  version: number;
  payload: string;
  state: string;
  accepted_at: string | null;
};
export default function CustomerRevisedPlan({
  bookingId,
  locale: l,
  onAccepted,
}: {
  bookingId: string;
  locale: Locale;
  onAccepted: () => void;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [plan, setPlan] = useState<Plan | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [checked, setChecked] = useState(false);
  useEffect(() => {
    customerApi<Plan | null>("bookings/" + bookingId + "/revised-plan")
      .then(setPlan)
      .catch(() =>
        setError(
          t(
            "Could not load the revised plan. Refresh before making a payment.",
            "Не удалось загрузить план. Обновите перед оплатой.",
            "Yenilənmiş plan yüklənmədi. Ödənişdən əvvəl yeniləyin.",
          ),
        ),
      );
  }, [bookingId]);
  if (error && !plan)
    return (
      <p role="alert" className="pay-notice">
        {error}
      </p>
    );
  if (!plan) return null;
  const p = JSON.parse(plan.payload) as {
    currency: string;
    services: { key: string; name: string; total: number }[];
    totalMinor: number;
    paidMinor: number;
    remainingMinor: number;
  };
  const fmt = (n: number) =>
    new Intl.NumberFormat(l, {
      style: "currency",
      currency: p.currency,
    }).format(n / 100);
  return (
    <section className="crp">
      <h2>
        {t(
          "Revised plan after cancellation",
          "Обновлённый план после отмены",
          "Ləğvdən sonra yenilənmiş plan",
        )}{" "}
        · v{plan.version}
      </h2>
      <p>
        {t(
          "The cancelled services have been removed. Review the remaining services and balance below.",
          "Отменённые услуги исключены. Проверьте оставшиеся услуги и остаток.",
          "Ləğv edilən xidmətlər çıxarılıb. Qalan xidmətləri və məbləği yoxlayın.",
        )}
      </p>
      {p.services.map((s) => (
        <div className="crp-row" key={s.key}>
          <span>{s.name}</span>
          <strong>{fmt(s.total * 100)}</strong>
        </div>
      ))}
      <dl>
        <dt>{t("Revised total", "Обновлённая сумма", "Yenilənmiş cəm")}</dt>
        <dd>{fmt(p.totalMinor)}</dd>
        <dt>
          {t(
            "Received for active services",
            "Получено за действующие услуги",
            "Aktiv xidmətlər üzrə alınıb",
          )}
        </dt>
        <dd>{fmt(p.paidMinor)}</dd>
        <dt>{t("Remaining", "Осталось", "Qalıq")}</dt>
        <dd>{fmt(p.remainingMinor)}</dd>
      </dl>
      {plan.state === "ACCEPTED" ? (
        <p>
          {t(
            "You accepted this version.",
            "Вы приняли эту версию.",
            "Bu versiyanı təsdiqləmisiniz.",
          )}
        </p>
      ) : plan.state === "SUPERSEDED" ? (
        <p>
          {t(
            "This version is outdated. The office will send an updated plan.",
            "Версия устарела. Офис отправит новый план.",
            "Bu versiya köhnəlib. Ofis yeni plan göndərəcək.",
          )}
        </p>
      ) : (
        <>
          <label>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            {t(
              "I reviewed and accept the remaining services and revised payment plan.",
              "Я проверил и принимаю оставшиеся услуги и обновлённый план оплаты.",
              "Qalan xidmətləri və yenilənmiş ödəniş planını yoxladım və təsdiqləyirəm.",
            )}
          </label>
          <button
            disabled={busy || !checked}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                setPlan(
                  await customerApi("bookings/" + bookingId + "/revised-plan", {
                    planId: plan.id,
                    version: plan.version,
                  }),
                );
                onAccepted();
              } catch {
                setError(
                  t(
                    "Could not accept. The plan may have changed or a request is pending. Refresh to review the latest version.",
                    "Не удалось принять. Обновите последнюю версию плана.",
                    "Təsdiqlənmədi. Plan dəyişmiş və ya sorğu gözləmədə ola bilər. Son versiyanı yeniləyin.",
                  ),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {t(
              "Accept this revised plan",
              "Принять обновлённый план",
              "Yenilənmiş planı təsdiqlə",
            )}
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
