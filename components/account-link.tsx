"use client";
import { useEffect, useRef, useState } from "react";
import { customerApi } from "@/lib/customer-api";
import type { Locale } from "@/lib/travel";
export default function AccountLink({
  locale: l,
  reset,
}: {
  locale: Locale;
  reset: boolean;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const token = useRef("");
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!token.current)
      token.current =
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(null, "", window.location.pathname);
    setReady(true);
  }, []);
  return (
    <section className="container page-content customer-auth">
      <h1>
        {reset
          ? t("Choose a new password", "Новый пароль", "Yeni şifrə seç")
          : t(
              "Verify your email",
              "Подтвердите email",
              "Email ünvanını təsdiqlə",
            )}
      </h1>
      {done ? (
        <>
          <p role="status">
            {reset
              ? t(
                  "Password changed. All devices have been signed out.",
                  "Пароль изменён. Все сеансы завершены.",
                  "Şifrə dəyişdirildi. Bütün cihazlardan çıxış edildi.",
                )
              : t(
                  "Email verified. You can continue your journey.",
                  "Email подтверждён. Можно продолжить.",
                  "Email təsdiqləndi. Səfərini planlamağa davam edə bilərsən.",
                )}
          </p>
          <a className="button" href={"/" + l + "/trips"}>
            {t("Continue", "Продолжить", "Davam et")}
          </a>
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              await customerApi(
                reset ? "auth/reset-password" : "auth/verify-email",
                {
                  token: token.current,
                  ...(reset
                    ? {
                        password: f.get("password"),
                        confirmation: f.get("confirmation"),
                      }
                    : {}),
                },
              );
              token.current = "";
              setDone(true);
            } catch {
              setError(
                t(
                  "This link may have expired or already been used. For passwords, also check both fields match and contain at least 12 characters (maximum 72 UTF-8 bytes). Request a new link if needed.",
                  "Ссылка могла истечь или уже использована. Пароли должны совпадать: не менее 12 символов, максимум 72 байта UTF-8. Запросите новую ссылку.",
                  "Linkin vaxtı bitmiş və ya istifadə edilmiş ola bilər. Şifrələr eyni, ən azı 12 simvol və maksimum 72 UTF-8 baytı olmalıdır. Lazım olsa yeni link istə.",
                ),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {reset && (
            <>
              <label>
                {t("New password", "Новый пароль", "Yeni şifrə")}
                <input
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </label>
              <label>
                {t("Repeat password", "Повторите пароль", "Şifrəni təkrarla")}
                <input
                  name="confirmation"
                  type="password"
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </label>
            </>
          )}
          {ready && !token.current && (
            <p role="alert">
              {t(
                "No valid link found. Request a new email from your account.",
                "Ссылка отсутствует. Запросите новое письмо.",
                "Link tapılmadı. Hesabından yeni email istə.",
              )}
            </p>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button
            className="button"
            disabled={!ready || !token.current || busy}
          >
            {busy
              ? t("Please wait…", "Подождите…", "Gözlə…")
              : reset
                ? t("Save password", "Сохранить пароль", "Şifrəni saxla")
                : t("Confirm email", "Подтвердить email", "Emaili təsdiqlə")}
          </button>
          <a className="cc-text" href={"/" + l + "/trips/account"}>
            {t("Return to account", "Вернуться в аккаунт", "Hesaba qayıt")}
          </a>
        </form>
      )}
    </section>
  );
}
