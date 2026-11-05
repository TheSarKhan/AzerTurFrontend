"use client";
import { useEffect, useRef, useState } from "react";
import CustomerCabinet from "./customer-cabinet";
import { AuthShowcase } from "./auth-showcase";
import { ArrowUpRight } from "lucide-react";
import {
  customerApi,
  ApiError,
  type Customer,
  type Booking,
  type BookingRequest,
} from "@/lib/customer-api";
import { type Locale, type Quote, tours } from "@/lib/travel";
type Props = { locale: Locale; go: (path: string) => void };
const serviceName = (key: string, l: Locale) => {
  const names: Record<string, [string, string, string]> = {
    transport: ["Private driver", "Личный водитель", "Şəxsi sürücü"],
    hotel: ["Hotel stay", "Проживание", "Oteldə qalma"],
    guide: ["Local guide", "Гид", "Gid"],
    transfer: ["Airport transfer", "Трансфер", "Transfer"],
    activity: ["Local experience", "Впечатление", "Yerli təcrübə"],
  };
  const n = names[key];
  return n ? text(l, ...n) : key;
};
const text = (l: Locale, en: string, ru: string, az: string) =>
  l === "az" ? az : l === "ru" ? ru : en;
function errorMessage(error: unknown, l: Locale) {
  const code = error instanceof ApiError ? error.code : "";
  const messages: Record<string, [string, string, string]> = {
    INVALID_GOOGLE_TOKEN: [
      "Google sign-in could not be verified. Please try again.",
      "Не удалось подтвердить вход через Google. Повторите попытку.",
      "Google ilə giriş təsdiqlənmədi. Yenidən cəhd edin.",
    ],
    GOOGLE_EMAIL_NOT_VERIFIED: [
      "Your Google email address is not verified.",
      "Email в вашем аккаунте Google не подтверждён.",
      "Google hesabınızın email ünvanı təsdiqlənməyib.",
    ],
    GOOGLE_UNAVAILABLE: [
      "Google is not reachable right now. Try again shortly or use your password.",
      "Google сейчас недоступен. Повторите позже или войдите по паролю.",
      "Google hazırda əlçatmazdır. Bir az sonra cəhd edin və ya şifrə ilə daxil olun.",
    ],
    EMAIL_VERIFICATION_REQUIRED: [
      "Verify your email in Account before continuing.",
      "Подтвердите email в аккаунте.",
      "Davam etmək üçün Hesab bölməsində email ünvanını təsdiqlə.",
    ],
    INVALID_CREDENTIALS: [
      "Email or password is incorrect.",
      "Неверный email или пароль.",
      "Email və ya şifrə yanlışdır.",
    ],
    ACCOUNT_UNAVAILABLE: [
      "This account cannot be created. Try signing in.",
      "Не удалось создать аккаунт. Попробуйте войти.",
      "Hesab yaradıla bilmədi. Daxil olmağı yoxlayın.",
    ],
    TOO_MANY_ATTEMPTS: [
      "Too many attempts. Please try later.",
      "Слишком много попыток. Попробуйте позже.",
      "Çox sayda cəhd edildi. Bir qədər sonra yenidən yoxlayın.",
    ],
    QUOTE_EXPIRED: [
      "This price expired. Calculate a new quote.",
      "Срок цены истёк. Получите новый расчёт.",
      "Qiymətin müddəti bitib. Yenidən hesablayın.",
    ],
    REQUEST_PENDING: [
      "The office is reviewing a change or cancellation. Payment will reopen after their response.",
      "Офис проверяет изменение или отмену. Оплата откроется после ответа.",
      "Ofis dəyişiklik və ya ləğv sorğusunu yoxlayır. Ödəniş cavabdan sonra yenidən açılacaq.",
    ],
    DEMO_PAYMENT_FAILED: [
      "Demo payment failed. Nothing was charged.",
      "Демо-платёж не прошёл. Списания не было.",
      "Demo ödəniş alınmadı. Məbləğ tutulmadı.",
    ],
    CONFLICT: [
      "A request already exists. Refresh your trips.",
      "Запрос уже существует. Обновите поездки.",
      "Sorğu artıq mövcuddur. Səfərlərinizi yeniləyin.",
    ],
    PAYMENT_NOT_ALLOWED: [
      "Payment is not available in this state. Refresh the booking.",
      "Оплата сейчас недоступна. Обновите бронирование.",
      "Hazırkı statusda ödəniş mümkün deyil. Rezervasiyanı yeniləyin.",
    ],
  };
  const m = messages[code];
  return m
    ? text(l, ...m)
    : text(
        l,
        "Could not complete this request. Check your details and try again.",
        "Не удалось выполнить запрос. Проверьте данные и повторите.",
        "Sorğu tamamlanmadı. Məlumatları yoxlayıb yenidən cəhd edin.",
      );
}
type GoogleConfig = { enabled: boolean; webClientId: string };
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: {
            client_id: string;
            callback: (r: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
        };
      };
    };
  }
}
/** Hidden until the API reports a configured Google client ID. */
function GoogleButton({
  locale: l,
  onCredential,
}: {
  locale: Locale;
  onCredential: (credential: string) => void;
}) {
  const [config, setConfig] = useState<GoogleConfig | null>(null),
    [node, setNode] = useState<HTMLDivElement | null>(null),
    callback = useRef(onCredential);
  callback.current = onCredential;
  useEffect(() => {
    let active = true;
    customerApi<GoogleConfig>("auth/google/config")
      .then((c) => active && c.enabled && c.webClientId && setConfig(c))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!config || !node) return;
    let cancelled = false;
    const render = () => {
      const gsi = window.google?.accounts.id;
      if (cancelled || !gsi) return;
      gsi.initialize({
        client_id: config.webClientId,
        callback: (r) => callback.current(r.credential),
      });
      gsi.renderButton(node, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.min(400, Math.max(240, node.clientWidth)),
        locale: l,
      });
    };
    if (window.google?.accounts) render();
    else {
      let script =
        document.querySelector<HTMLScriptElement>("script[data-gsi]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client?hl=" + l;
        script.async = true;
        script.dataset.gsi = "1";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
      return () => {
        cancelled = true;
        script.removeEventListener("load", render);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [config, node, l]);
  if (!config) return null;
  return (
    <div className="auth-google">
      <div ref={setNode} className="auth-google-button" />
      <p className="auth-or">
        <span>{text(l, "or", "или", "və ya")}</span>
      </p>
    </div>
  );
}
export function CustomerAuth({
  locale: l,
  go,
  next = "/trips",
}: Props & { next?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = (en: string, ru: string, az: string) => text(l, en, ru, az);
  const finish = (to: string) => window.location.assign("/" + l + to);
  return (
    <section className="auth-split">
      <div className="auth-panel customer-auth">
        <h1>
          {mode === "login"
            ? t("Welcome back.", "С возвращением.", "Xoş gəlmisiniz.")
            : t(
                "Your journey starts here.",
                "Ваше путешествие начинается здесь.",
                "Səyahətiniz buradan başlayır.",
              )}
        </h1>
        <p>
          {t(
            "An account is required to request and manage a reservation.",
            "Для запроса и управления бронированием нужен аккаунт.",
            "Rezervasiya sorğusu yaratmaq və idarə etmək üçün qeydiyyat vacibdir.",
          )}
        </p>
        <GoogleButton
          locale={l}
          onCredential={async (credential) => {
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await customerApi("auth/google", { credential, locale: l });
              finish(next);
            } catch (e) {
              setError(errorMessage(e, l));
              setBusy(false);
            }
          }}
        />
        <div className="auth-tabs">
          <button
            aria-pressed={mode === "login"}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            {t("Sign in", "Войти", "Daxil ol")}
          </button>
          <button
            aria-pressed={mode === "register"}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            {t("Create account", "Создать аккаунт", "Qeydiyyat")}
          </button>
        </div>
        <form
          key={mode}
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await customerApi("auth/" + mode, {
                email: String(f.get("email")),
                password: String(f.get("password")),
                ...(mode === "register"
                  ? { name: String(f.get("name")), locale: l }
                  : {}),
              });
              window.location.assign("/" + l + next);
            } catch (e) {
              setError(errorMessage(e, l));
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "register" && (
            <label>
              {t("Full name", "Имя и фамилия", "Ad və soyad")}
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            {t("Email address", "Email", "Email ünvanı")}
            <input
              name="email"
              required
              type="email"
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label>
            {t("Password", "Пароль", "Şifrə")}
            <input
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 12 : 1}
              maxLength={72}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
            />
          </label>
          {mode === "register" && (
            <p className="field-help">
              {t(
                "At least 12 characters; maximum 72 UTF-8 bytes.",
                "Не менее 12 символов; максимум 72 байта UTF-8.",
                "Ən azı 12 simvol; maksimum 72 UTF-8 baytı.",
              )}
            </p>
          )}
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? t("Please wait…", "Подождите…", "Gözləyin…")
              : mode === "login"
                ? t("Sign in", "Войти", "Daxil ol")
                : t("Create account", "Создать аккаунт", "Qeydiyyatdan keç")}
            <ArrowUpRight size={18} />
          </button>
        </form>
      </div>
      <AuthShowcase locale={l} />
    </section>
  );
}
export function BookingCheckout({
  locale: l,
  go,
  quoteId,
}: Props & { quoteId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null),
    [ready, setReady] = useState(false),
    [plannerNote, setPlannerNote] = useState(""),
    [quote, setQuote] = useState<Quote | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const t = (en: string, ru: string, az: string) => text(l, en, ru, az);
  useEffect(() => {
    let active = true;
    try {
      setPlannerNote(
        sessionStorage.getItem("azertur-planner-notes-" + quoteId) || "",
      );
      const raw = sessionStorage.getItem("azertur-quote-" + quoteId);
      if (raw) setQuote(JSON.parse(raw));
    } catch {}
    customerApi<Customer>("auth/me")
      .then((c) => {
        if (active) setCustomer(c);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [quoteId]);
  if (!ready)
    return (
      <section className="container page-content" role="status">
        {t("Loading…", "Загрузка…", "Yüklənir…")}
      </section>
    );
  if (!customer)
    return <CustomerAuth locale={l} go={go} next={"/checkout/" + quoteId} />;
  if (!quote || Date.parse(quote.expires) < Date.now())
    return (
      <section className="container page-content">
        <h1>
          {t("Refresh your price.", "Обновите цену.", "Qiyməti yeniləyin.")}
        </h1>
        <p>
          {t(
            "This quote is unavailable or expired.",
            "Расчёт недоступен или истёк.",
            "Qiymət mövcud deyil və ya müddəti bitib.",
          )}
        </p>
        <button className="button" onClick={() => go("/plan")}>
          {t("Build your trip", "Создать маршрут", "Səfərini planla")}
        </button>
      </section>
    );
  return (
    <section className="container page-content checkout">
      <h1>
        {t(
          "Let’s check the details.",
          "Проверим детали.",
          "Detalları dəqiqləşdirək.",
        )}
      </h1>
      <p className="lead">
        {t(
          "Your operator reviews availability before any payment.",
          "Оператор проверит доступность до оплаты.",
          "Ödənişdən əvvəl operator mövcudluğu yoxlayacaq.",
        )}
      </p>
      <div className="checkout-grid">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await customerApi<Booking>("bookings", {
                quoteId: quote.id,
                note: String(f.get("note")),
              });
              go("/trips");
            } catch (e) {
              setError(errorMessage(e, l));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>{customer.name}</h3>
          <p>{customer.email}</p>
          <label>
            {t(
              "Travel notes and special requests",
              "Пожелания к поездке",
              "Səfər qeydləri və xüsusi istəklər",
            )}
            <textarea
              name="note"
              defaultValue={plannerNote}
              rows={5}
              maxLength={2000}
              placeholder={t(
                "Arrival, children, dietary or access needs…",
                "Прибытие, дети, питание, доступность…",
                "Gəliş, uşaqlar, qidalanma və əlçatanlıq ehtiyacları…",
              )}
            />
          </label>
          <p className="field-help">
            {t(
              "Your request will be saved in your account. No payment is taken now.",
              "Запрос сохранится в аккаунте. Сейчас оплаты нет.",
              "Sorğu hesabınızda saxlanılacaq. İndi ödəniş edilmir.",
            )}
          </p>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <button disabled={busy} className="button">
            {busy
              ? t("Submitting…", "Отправка…", "Göndərilir…")
              : t(
                  "Send for operator review",
                  "На проверку оператору",
                  "Operator yoxlamasına göndər",
                )}
            <ArrowUpRight size={18} />
          </button>
        </form>
        <aside className="order-summary">
          <h3>
            {quote.input.customDays
              ? t("Your custom journey", "Ваш маршрут", "Fərdi səfəriniz")
              : tours.find((t) => t.slug === quote.input.slug)?.name[
                  l === "ru" ? 1 : l === "az" ? 2 : 0
                ]}
          </h3>
          <p>
            {quote.input.date} · {quote.input.pax}{" "}
            {t("travellers", "чел.", "nəfər")}
          </p>
          {quote.input.cities && <p>{quote.input.cities.join(" → ")}</p>}
          <div className="summary-lines">
            {quote.lines.map((line) => (
              <div key={line.label}>
                <span>{serviceName(line.label, l)}</span>
              </div>
            ))}
          </div>
          <p>
            {t(
              "Our team checks availability and replies with a personal offer, including prices.",
              "Команда проверит доступность и пришлёт персональное предложение с ценами.",
              "Komandamız mövcudluğu yoxlayıb qiymətlərlə birlikdə fərdi təklif göndərəcək.",
            )}
          </p>
        </aside>
      </div>
    </section>
  );
}
export function CustomerTrips({
  locale,
  go,
  bookingId,
}: Props & { bookingId?: string }) {
  return (
    <CustomerCabinet
      locale={locale}
      go={go}
      bookingId={bookingId}
      renderAuth={(next) => (
        <CustomerAuth locale={locale} go={go} next={next} />
      )}
    />
  );
}
