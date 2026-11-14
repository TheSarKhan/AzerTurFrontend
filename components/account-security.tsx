"use client";
import { useEffect, useState } from "react";
import { ApiError, customerApi, type Customer } from "@/lib/customer-api";
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
    [error, setError] = useState(""),
    [cooldown, setCooldown] = useState(0),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
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
      if (path === "auth/email-verification/request") setCooldown(60);
      if (path === "auth/logout-all" || path === "auth/account-deletion")
        window.location.assign("/" + l + "/trips");
      else await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setCooldown(60);
        setNotice("");
        setError(
          t(
            "A verification email was just sent. You can request another in a minute.",
            "Письмо только что отправлено. Новое можно запросить через минуту.",
            "Təsdiq emaili indicə göndərilib. Yenisini bir dəqiqədən sonra istəyə bilərsən.",
          ),
        );
        return;
      }
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
          disabled={busy || cooldown > 0}
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
          {cooldown > 0
            ? t(
                `Send again in ${cooldown} s`,
                `Повторно через ${cooldown} с`,
                `${cooldown} san. sonra yenidən göndər`,
              )
            : t(
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
      <h3>{t("Delete account", "Удалить аккаунт", "Hesabı sil")}</h3>
      <p>
        {t(
          "You can ask us to delete your account. Our team processes the request. Bookings, contracts and payments may be kept where the law or an active trip requires it.",
          "Вы можете запросить удаление аккаунта. Команда обработает запрос. Бронирования, договоры и платежи могут сохраняться, если этого требует закон или активная поездка.",
          "Hesabının silinməsini tələb edə bilərsən. Sorğunu komandamız emal edir. Qanunun və ya aktiv səfərin tələb etdiyi hallarda rezervasiya, müqavilə və ödəniş məlumatları saxlanıla bilər.",
        )}
      </p>
      {!confirmDelete ? (
        <div className="security-actions">
          <button
            className="cc-text"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
          >
            {t("Delete account", "Удалить аккаунт", "Hesabı sil")}
          </button>
        </div>
      ) : (
        <div className="security-actions" role="group">
          <p role="alert">
            {t(
              "Send the deletion request? You will be signed out on every device.",
              "Отправить запрос на удаление? Вы выйдете на всех устройствах.",
              "Silinmə sorğusu göndərilsin? Bütün cihazlardan çıxış edəcəksən.",
            )}
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={() => act("auth/account-deletion", "")}
          >
            {t(
              "Yes, request deletion",
              "Да, запросить удаление",
              "Bəli, silinməsini istəyirəm",
            )}
          </button>
          <button
            className="cc-text"
            disabled={busy}
            onClick={() => setConfirmDelete(false)}
          >
            {t("Cancel", "Отмена", "Ləğv et")}
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
