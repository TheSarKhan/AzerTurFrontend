"use client";
import { useEffect, useState, useRef } from "react";
import { ArrowUpRight, Check, Clock, RefreshCw, LogOut } from "lucide-react";
import {
  customerApi,
  ApiError,
  type Customer,
  type Booking,
  type BookingRequest,
} from "@/lib/customer-api";
import { money, type Locale, type Quote, tours } from "@/lib/travel";
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
const bookingTitle = (b: Booking, l: Locale) => {
  try {
    const q = JSON.parse(b.quotePayload) as Quote;
    if (q.input.customDays)
      return text(l, "Your custom journey", "Ваш маршрут", "Fərdi səfəriniz");
    return (
      tours.find((t) => t.slug === q.input.slug)?.name[
        l === "az" ? 2 : l === "ru" ? 1 : 0
      ] || b.title
    );
  } catch {
    return b.title;
  }
};
const text = (l: Locale, en: string, ru: string, az: string) =>
  l === "az" ? az : l === "ru" ? ru : en;
function errorMessage(error: unknown, l: Locale) {
  const code = error instanceof ApiError ? error.code : "";
  const messages: Record<string, [string, string, string]> = {
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
export function CustomerAuth({
  locale: l,
  go,
  next = "/trips",
}: Props & { next?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = (en: string, ru: string, az: string) => text(l, en, ru, az);
  return (
    <section className="container page-content customer-auth">
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
      <p className="field-help">
        {t(
          "Email verification and password recovery will be enabled with the SMTP integration.",
          "Подтверждение почты и восстановление пароля будут включены после SMTP-интеграции.",
          "Email təsdiqi və şifrənin bərpası SMTP inteqrasiyası ilə aktivləşdiriləcək.",
        )}
      </p>
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
                <strong>{money(line.amount, quote.currency, l)}</strong>
              </div>
            ))}
            <div className="summary-total">
              <span>{t("Total", "Всего", "Cəmi")}</span>
              <strong>{money(quote.total, quote.currency, l)}</strong>
            </div>
          </div>
          <p>
            {t(
              "Demo prices. Deposit is available only after operator approval.",
              "Демо-цены. Депозит доступен после одобрения оператора.",
              "Demo qiymətlər. Depozit yalnız operator təsdiqindən sonra açılır.",
            )}
          </p>
        </aside>
      </div>
    </section>
  );
}
export function CustomerTrips({ locale: l, go }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null),
    [bookings, setBookings] = useState<Booking[]>([]),
    [requests, setRequests] = useState<BookingRequest[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [payment, setPayment] = useState<Booking | null>(null);
  const paymentDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (payment) paymentDialog.current?.showModal();
    else paymentDialog.current?.close();
  }, [payment]);
  const t = (en: string, ru: string, az: string) => text(l, en, ru, az);
  async function load() {
    setError("");
    try {
      const [c, b, r] = await Promise.all([
        customerApi<Customer>("auth/me"),
        customerApi<Booking[]>("bookings"),
        customerApi<BookingRequest[]>("bookings/requests"),
      ]);
      setCustomer(c);
      setBookings(b);
      setRequests(r);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setCustomer(null);
        setBookings([]);
        setRequests([]);
      } else setError(errorMessage(e, l));
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  if (!ready)
    return (
      <section className="container page-content" role="status">
        {t("Loading…", "Загрузка…", "Yüklənir…")}
      </section>
    );
  if (!customer)
    return (
      <>
        {error && (
          <p role="alert" className="container error-message">
            {error}
          </p>
        )}
        <CustomerAuth locale={l} go={go} />
      </>
    );
  const statuses: Record<string, string> = {
    PENDING_REVIEW: t(
      "Waiting for operator review",
      "На проверке у оператора",
      "Operator yoxlamasını gözləyir",
    ),
    AWAITING_PAYMENT: t(
      "Approved · deposit required",
      "Одобрено · ожидает депозита",
      "Təsdiqlənib · depozit gözlənilir",
    ),
    CONFIRMED: t("Confirmed", "Подтверждено", "Təsdiqlənib"),
    REJECTED: t("Not approved", "Не одобрено", "Təsdiqlənməyib"),
    CANCELLED: t("Cancelled", "Отменено", "Ləğv edilib"),
  };
  return (
    <section className="container page-content customer-trips">
      <div className="portal-heading">
        <div>
          <h1>{t("Your journeys.", "Ваши поездки.", "Səfərləriniz.")}</h1>
          <p>
            {customer.name} · {customer.email}
          </p>
        </div>
        <div className="receipt-actions">
          <button className="button secondary" onClick={() => void load()}>
            <RefreshCw size={16} />
            {t("Refresh", "Обновить", "Yenilə")}
          </button>
          <button
            className="text-link"
            onClick={async () => {
              try {
                await customerApi("auth/logout", {});
              } finally {
                setCustomer(null);
                setBookings([]);
                setRequests([]);
              }
            }}
          >
            <LogOut size={16} />
            {t("Sign out", "Выйти", "Çıxış")}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="trip-notice">
          {notice}
        </p>
      )}
      {!bookings.length && (
        <div className="empty">
          <h3>
            {t(
              "Your next journey is waiting.",
              "Вас ждёт новая поездка.",
              "Növbəti səfəriniz sizi gözləyir.",
            )}
          </h3>
          <button className="button" onClick={() => go("/tours")}>
            {t("Explore journeys", "Посмотреть туры", "Turlara bax")}
          </button>
        </div>
      )}
      {bookings.map((b) => (
        <article key={b.id} className="booking-card">
          <div className="booking-card-top">
            <div>
              <small>{b.id.slice(0, 8)}</small>
              <h2>{bookingTitle(b, l)}</h2>
              <p>
                {b.departure} · {money(b.total, b.currency, l)}
              </p>
            </div>
            <p className="booking-status">
              <Clock size={16} />
              {statuses[b.status]}
            </p>
          </div>
          {b.operatorNote && <p className="operator-note">{b.operatorNote}</p>}
          <div className="booking-money">
            <p>
              {t("Paid", "Оплачено", "Ödənilib")}:{" "}
              <strong>{money(b.paid, b.currency, l)}</strong>
            </p>
            <p>
              {t("Remaining", "Остаток", "Qalıq")}:{" "}
              <strong>{money(b.total - b.paid, b.currency, l)}</strong>
            </p>
          </div>
          {b.status === "PENDING_REVIEW" && (
            <p className="field-help">
              {t(
                "No payment is available until the operator approves availability.",
                "Оплата откроется после проверки доступности оператором.",
                "Operator mövcudluğu təsdiqləyənədək ödəniş açılmır.",
              )}
            </p>
          )}
          {(b.status === "AWAITING_PAYMENT" ||
            (b.status === "CONFIRMED" && b.paid < b.total)) &&
            !requests.some(
              (r) => r.bookingId === b.id && r.status === "PENDING",
            ) && (
              <button className="button" onClick={() => setPayment(b)}>
                {t(
                  "Try demo payment",
                  "Проверить демо-оплату",
                  "Demo ödənişi yoxla",
                )}{" "}
                ·{" "}
                {money(
                  b.status === "AWAITING_PAYMENT"
                    ? b.deposit
                    : b.total - b.paid,
                  b.currency,
                  l,
                )}
                <ArrowUpRight size={18} />
              </button>
            )}
          {b.status === "CANCELLED" && b.paid > 0 && (
            <p className="field-help">
              {t(
                "Any refund is handled manually by the team. No real money was charged in demo mode.",
                "Возврат обрабатывает сотрудник. В демо реальные деньги не списывались.",
                "Geri ödənişi əməkdaş idarə edir. Demo rejimində real pul tutulmayıb.",
              )}
            </p>
          )}
          <details className="price-breakdown">
            <summary>
              {t("Service breakdown", "Стоимость услуг", "Xidmətlərin qiyməti")}
            </summary>
            {(() => {
              try {
                const q = JSON.parse(b.quotePayload) as Quote;
                return q.lines.map((line) => (
                  <div key={line.label}>
                    <span>{serviceName(line.label, l)}</span>
                    <strong>{money(line.amount, b.currency, l)}</strong>
                  </div>
                ));
              } catch {
                return null;
              }
            })()}
          </details>
          {requests
            .filter((r) => r.bookingId === b.id)
            .map((r) => (
              <div key={r.id} className="booking-request">
                <strong>
                  {r.kind === "CANCEL"
                    ? t("Cancellation request", "Запрос отмены", "Ləğv sorğusu")
                    : t(
                        "Change request",
                        "Запрос изменения",
                        "Dəyişiklik sorğusu",
                      )}{" "}
                  ·{" "}
                  {r.status === "PENDING"
                    ? t(
                        "Waiting for a response",
                        "Ожидает ответа",
                        "Cavab gözlənilir",
                      )
                    : r.status === "ACCEPTED"
                      ? t("Accepted", "Принято", "Qəbul edilib")
                      : t("Declined", "Отклонено", "Qəbul edilməyib")}
                </strong>
                <p>{r.message}</p>
                {r.response && <p className="operator-note">{r.response}</p>}
              </div>
            ))}
          {!["CANCELLED", "REJECTED"].includes(b.status) &&
            !requests.some(
              (r) => r.bookingId === b.id && r.status === "PENDING",
            ) && (
              <details className="request-editor">
                <summary>
                  {t(
                    "Request a change or cancellation",
                    "Изменить или отменить",
                    "Dəyişiklik və ya ləğv sorğusu",
                  )}
                </summary>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (busy) return;
                    const form = e.currentTarget,
                      f = new FormData(form);
                    setBusy(true);
                    setError("");
                    try {
                      await customerApi("bookings/" + b.id + "/requests", {
                        kind: f.get("kind"),
                        message: f.get("message"),
                      });
                      form.reset();
                      setNotice(
                        t(
                          "Your request was sent to the office team.",
                          "Запрос отправлен сотрудникам офиса.",
                          "Sorğunuz ofis əməkdaşlarına göndərildi.",
                        ),
                      );
                      await load();
                    } catch (e) {
                      setError(errorMessage(e, l));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    {t("Request type", "Тип запроса", "Sorğunun növü")}
                    <select name="kind">
                      <option value="CHANGE">
                        {t("Change", "Изменение", "Dəyişiklik")}
                      </option>
                      <option value="CANCEL">
                        {t("Cancellation", "Отмена", "Ləğv")}
                      </option>
                    </select>
                  </label>
                  <label>
                    {t("Your message", "Сообщение", "Mesajınız")}
                    <textarea
                      name="message"
                      required
                      minLength={5}
                      maxLength={2000}
                      rows={3}
                    />
                  </label>
                  <button disabled={busy} className="button secondary">
                    {t("Send request", "Отправить", "Sorğunu göndər")}
                  </button>
                </form>
              </details>
            )}
        </article>
      ))}
      {payment && (
        <dialog
          ref={paymentDialog}
          onCancel={() => setPayment(null)}
          className="payment-overlay"
          aria-label={t("Demo payment", "Демо-оплата", "Demo ödəniş")}
        >
          <div className="mock-payment">
            <h2>{t("Demo payment", "Демо-оплата", "Demo ödəniş")}</h2>
            <p>
              {t(
                "No real money is charged. Test either outcome.",
                "Реальные деньги не списываются. Проверьте любой результат.",
                "Real pul tutulmur. Hər iki nəticəni yoxlaya bilərsiniz.",
              )}
            </p>
            <strong className="mock-amount">
              {money(
                payment.status === "AWAITING_PAYMENT"
                  ? payment.deposit
                  : payment.total - payment.paid,
                payment.currency,
                l,
              )}
            </strong>
            {[true, false].map((success) => (
              <button
                key={String(success)}
                className={"button " + (!success ? "secondary" : "")}
                disabled={busy}
                onClick={async () => {
                  if (busy) return;
                  setBusy(true);
                  setError("");
                  try {
                    await customerApi(
                      "bookings/" + payment.id + "/demo-payment",
                      {
                        kind:
                          payment.status === "AWAITING_PAYMENT"
                            ? "DEPOSIT"
                            : "BALANCE",
                        success,
                      },
                      { "Idempotency-Key": crypto.randomUUID() },
                    );
                    setNotice(
                      t(
                        "Demo payment recorded. No real money was charged.",
                        "Демо-оплата сохранена. Реального списания не было.",
                        "Demo ödəniş qeydə alındı. Real pul tutulmadı.",
                      ),
                    );
                    await load();
                  } catch (e) {
                    setError(errorMessage(e, l));
                  } finally {
                    setBusy(false);
                    setPayment(null);
                  }
                }}
              >
                {success
                  ? t(
                      "Simulate success",
                      "Успешная оплата",
                      "Uğurlu ödənişi yoxla",
                    )
                  : t(
                      "Simulate failure",
                      "Ошибка оплаты",
                      "Uğursuz ödənişi yoxla",
                    )}
              </button>
            ))}
            <button
              className="text-link"
              disabled={busy}
              onClick={() => setPayment(null)}
            >
              {t("Close", "Закрыть", "Bağla")}
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}
