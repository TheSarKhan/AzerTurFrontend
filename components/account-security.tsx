"use client";
import { useEffect, useState } from "react";
import { customerApi, type Customer } from "@/lib/customer-api";
import type { Locale } from "@/lib/travel";
type Session = {
  id: string;
  device: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  current: boolean;
};
export default function AccountSecurity({
  customer,
  locale: l,
}: {
  customer: Customer;
  locale: Locale;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [sessions, setSessions] = useState<Session[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const load = () => customerApi<Session[]>("auth/sessions").then(setSessions);
  useEffect(() => {
    load().catch(() =>
      setError(
        t(
          "Could not load sessions.",
          "Не удалось загрузить сеансы.",
          "Sessiyalar yüklənmədi.",
        ),
      ),
    );
  }, [l]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(path: string, message: string) {
    setBusy(true);
    setError("");
    try {
      await customerApi(path, {});
      setNotice(message);
      if (path === "auth/logout-all")
        window.location.assign("/" + l + "/trips");
      else await load();
    } catch {
      setError(
        t(
          "Could not complete this action. Please try again later.",
          "Не удалось выполнить действие. Повторите позже.",
          "Əməliyyat alınmadı. Bir qədər sonra yenidən yoxla.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="account-security"
      aria-label={t(
        "Account security",
        "Безопасность аккаунта",
        "Hesab təhlükəsizliyi",
      )}
    >
      <h2>
        {t("Account security", "Безопасность аккаунта", "Hesab təhlükəsizliyi")}
      </h2>
      <p>
        {customer.emailVerified
          ? t("Email verified", "Email подтверждён", "Email təsdiqlənib")
          : t(
              "Verify your email before sending requests or accepting changes. Open the link in your email, then refresh this page.",
              "Подтвердите email перед отправкой запросов или принятием изменений. Откройте ссылку из письма и обновите страницу.",
              "Sorğu göndərmək və dəyişiklikləri təsdiqləmək üçün email ünvanını təsdiqlə. Emaildəki linki aç, sonra bu səhifəni yenilə.",
            )}
      </p>
      {!customer.emailVerified && (
        <button
          className="button"
          disabled={busy}
          onClick={() =>
            act(
              "auth/email-verification/request",
              t(
                "Verification requested. Check your inbox and spam folder.",
                "Проверьте почту и спам.",
                "Təsdiq linki istənildi. Email və spam qovluğunu yoxla.",
              ),
            )
          }
        >
          {t(
            "Send verification email",
            "Отправить письмо",
            "Təsdiq emaili göndər",
          )}
        </button>
      )}
      <h3>{t("Active sessions", "Активные сеансы", "Aktiv sessiyalar")}</h3>
      <p>
        {t(
          "Revoke a device you no longer use. Password recovery signs out every device.",
          "Завершите ненужные сеансы. Сброс пароля завершает все сеансы.",
          "İstifadə etmədiyin cihazın girişini bağla. Şifrə bərpası bütün sessiyaları bağlayır.",
        )}
      </p>
      {sessions.map((s) => (
        <div className="security-session" key={s.id}>
          <div>
            <strong>
              {s.device}{" "}
              {s.current &&
                t("· This device", "· Это устройство", "· Bu cihaz")}
            </strong>
            <p>
              {t("Last active", "Последняя активность", "Son aktivlik")}:{" "}
              {new Date(s.last_seen_at).toLocaleString(l)}
            </p>
          </div>
          {!s.current && (
            <button
              className="cc-text"
              disabled={busy}
              onClick={() =>
                act(
                  "auth/sessions/" + s.id + "/revoke",
                  t("Session revoked.", "Сеанс завершён.", "Sessiya bağlandı."),
                )
              }
            >
              {t("Revoke", "Завершить", "Bağla")}
            </button>
          )}
        </div>
      ))}
      <div className="security-actions">
        <button
          className="cc-text"
          disabled={busy}
          onClick={() =>
            act(
              "auth/sessions/revoke-others",
              t(
                "Other sessions revoked.",
                "Другие сеансы завершены.",
                "Digər sessiyalar bağlandı.",
              ),
            )
          }
        >
          {t(
            "Sign out other devices",
            "Выйти на других устройствах",
            "Digər cihazlardan çıx",
          )}
        </button>
        <button
          className="cc-text"
          disabled={busy}
          onClick={() => act("auth/logout-all", "")}
        >
          {t("Sign out everywhere", "Выйти везде", "Bütün cihazlardan çıx")}
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
