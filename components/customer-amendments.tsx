"use client";
import { useEffect, useState } from "react";
import { customerApi, ApiError, type Booking } from "@/lib/customer-api";
import type { Locale } from "@/lib/travel";
type Proposal = {
  title: string;
  currency: string;
  date: string;
  travelers: number;
  itinerary: { city: string; description: string }[];
  returnRoute: string;
  services: { key: string; name: string; total: number; policy: string }[];
  previousTerms: {
    serviceKey: string;
    name: string;
    policyText: string;
    retainedMinor: number;
  }[];
  message: string;
  paidMinor: number;
  retainedMinor: number;
  refundMinor: number;
  appliedMinor: number;
  totalMinor: number;
  remainingMinor: number;
  expiresAt: string;
};
type Amendment = {
  id: string;
  draft_version: number;
  state: string;
  pdf_sha256: string;
  sent_at: string;
  accepted_at: string | null;
  canAccept: boolean;
  proposal: Proposal;
  refundTracking: {
    state: string;
    customer_message: string;
    updated_at: string;
  } | null;
};
export default function CustomerAmendments({
  booking,
  locale: l,
  go,
}: {
  booking: Booking;
  locale: Locale;
  go: (path: string) => void;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const state = (value: string) =>
    (
      ({
        SENT: t(
          "Awaiting your review",
          "Ожидает вашего решения",
          "Qərarın gözlənilir",
        ),
        ACCEPTED: t("Accepted", "Принято", "Təsdiqlənib"),
        DECLINED: t("Declined", "Отклонено", "Rədd edilib"),
        SUPERSEDED: t("Replaced", "Заменено", "Əvəz edilib"),
        WITHDRAWN: t("Withdrawn", "Отозвано", "Geri çəkilib"),
        PROCESSING: t("Processing", "В обработке", "İcra edilir"),
        COMPLETED_MANUAL: t(
          "Transfer recorded by office",
          "Перевод зарегистрирован офисом",
          "Köçürmə ofis tərəfindən qeydə alınıb",
        ),
        FAILED: t("Failed", "Не выполнено", "Alınmayıb"),
        UNKNOWN: t(
          "Awaiting verification",
          "Ожидает проверки",
          "Yoxlama gözlənilir",
        ),
      }) as Record<string, string>
    )[value] || value;
  const [items, setItems] = useState<Amendment[]>([]),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState(""),
    [pdf, setPdf] = useState(""),
    [opened, setOpened] = useState(false),
    [agree, setAgree] = useState(false),
    [declining, setDeclining] = useState(false),
    [reason, setReason] = useState("");
  const base = "bookings/" + booking.id + "/amendments";
  async function load() {
    const data = await customerApi<Amendment[]>(base);
    setItems(data);
    setSelected((s) => (data.some((x) => x.id === s) ? s : data[0]?.id || ""));
    setReady(true);
  }
  useEffect(() => {
    load().catch(() => {
      setError(
        t(
          "Could not load change proposals.",
          "Не удалось загрузить предложения.",
          "Dəyişiklik təklifləri yüklənmədi.",
        ),
      );
      setReady(true);
    });
  }, [booking.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      if (pdf) URL.revokeObjectURL(pdf);
    },
    [pdf],
  );
  const a = items.find((x) => x.id === selected),
    p = a?.proposal;
  const fmt = (n: number) =>
    new Intl.NumberFormat(l, {
      style: "currency",
      currency: p?.currency || booking.currency,
    }).format(n / 100);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "EMAIL_VERIFICATION_REQUIRED"
          ? t(
              "Verify your email in Account first.",
              "Сначала подтвердите email в аккаунте.",
              "Əvvəl Hesab bölməsində emaili təsdiqlə.",
            )
          : t(
              "This proposal may have changed or expired. Refresh and check its latest version before trying again.",
              "Предложение могло измениться или истечь. Обновите и проверьте последнюю версию.",
              "Təklif dəyişmiş və ya vaxtı bitmiş ola bilər. Səhifəni yenilə, son versiyanı yoxlayıb yenidən cəhd et.",
            ),
      );
    } finally {
      setBusy(false);
    }
  }
  async function view(original: boolean) {
    if (!a) return;
    const r = await fetch(
      "/api/customer/" + base + "/" + a.id + (original ? "/base-pdf" : "/pdf"),
      {
        credentials: "same-origin",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!r.ok) throw Error("PDF_UNAVAILABLE");
    setPdf(URL.createObjectURL(await r.blob()));
    setOpened(!original);
    setAgree(false);
  }
  return (
    <section className="container page-content customer-changes">
      <button className="cc-text" onClick={() => go("/trips/" + booking.id)}>
        ← {t("Your journey", "Ваша поездка", "Səfərin")}
      </button>
      <header>
        <h1>
          {t(
            "Review your proposed changes.",
            "Предлагаемые изменения поездки.",
            "Səfərin üçün dəyişiklik təklifi.",
          )}
        </h1>
        <p>
          {t(
            "Your current booking stays in place until you accept a new proposal and its PDF contract.",
            "Текущее бронирование действует, пока вы не примете новое предложение и PDF договора.",
            "Yeni təklifi və PDF müqaviləsini təsdiqləyənə qədər cari sifarişin qüvvədə qalır.",
          )}
        </p>
      </header>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!ready && <p>{t("Loading…", "Загрузка…", "Yüklənir…")}</p>}
      {ready && !items.length && (
        <p>
          {t(
            "The office has not sent a change proposal yet. Your request remains with the team.",
            "Офис ещё не отправил предложение. Команда рассматривает запрос.",
            "Ofis hələ dəyişiklik təklifi göndərməyib. Komanda sorğunu nəzərdən keçirir.",
          )}
        </p>
      )}
      {items.length > 0 && (
        <label>
          {t("Proposal history", "История предложений", "Təklif tarixçəsi")}
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setPdf("");
              setAgree(false);
              setOpened(false);
              setDeclining(false);
              setNotice("");
            }}
          >
            {items.map((x) => (
              <option key={x.id} value={x.id}>
                v{x.draft_version} · {state(x.state)} ·{" "}
                {new Date(x.sent_at).toLocaleString(l)}
              </option>
            ))}
          </select>
        </label>
      )}
      {a && p && (
        <>
          <div className="change-layout">
            <div>
              <article className="change-card">
                <p>
                  {state(a.state)} · v{a.draft_version}
                </p>
                <h2>{p.title}</h2>
                <p>
                  {p.date} · {p.travelers} {t("travelers", "туристов", "nəfər")}
                </p>
                <p>{p.message}</p>
                <h3>{t("New itinerary", "Новый маршрут", "Yeni marşrut")}</h3>
                {p.itinerary.map((day, i) => (
                  <div className="change-day" key={i}>
                    <strong>
                      {i + 1}. {day.city}
                    </strong>
                    <p>{day.description}</p>
                  </div>
                ))}
                <p>
                  {t("Return", "Возвращение", "Qayıdış")}: {p.returnRoute}
                </p>
              </article>
              <article className="change-card">
                <h3>
                  {t("Your new services", "Новые услуги", "Yeni xidmətlərin")}
                </h3>
                {p.services.map((s) => (
                  <div className="change-day" key={s.key}>
                    <strong>{s.name}</strong>
                    <span>{fmt(s.total * 100)}</span>
                    <p>{s.policy}</p>
                  </div>
                ))}
              </article>
              <article className="change-card">
                <h3>
                  {t(
                    "Previous service terms and fees",
                    "Условия и сборы прежних услуг",
                    "Əvvəlki xidmətlərin şərtləri və tutulmaları",
                  )}
                </h3>
                {p.previousTerms.map((s) => (
                  <div className="change-day" key={s.serviceKey}>
                    <strong>{s.name}</strong>
                    <span>{fmt(s.retainedMinor)}</span>
                    <p>{s.policyText}</p>
                  </div>
                ))}
              </article>
            </div>
            <aside>
              <article className="change-card change-finance">
                <h3>
                  {t("The new balance", "Новый баланс", "Yeni hesablaşma")}
                </h3>
                {(
                  [
                    ["Paid funds", "Оплачено", "Ödənmiş məbləğ", p.paidMinor],
                    [
                      "Supplier fees",
                      "Сборы поставщиков",
                      "Təchizatçı tutulmaları",
                      p.retainedMinor,
                    ],
                    ["Refund due", "К возврату", "Qaytarılacaq", p.refundMinor],
                    [
                      "Carried to new journey",
                      "Зачтено в новый план",
                      "Yeni səfərə tətbiq edilir",
                      p.appliedMinor,
                    ],
                    [
                      "New total",
                      "Новая стоимость",
                      "Yeni yekun",
                      p.totalMinor,
                    ],
                    [
                      "Remaining to pay",
                      "Осталось оплатить",
                      "Qalıq ödəniş",
                      p.remainingMinor,
                    ],
                  ] as [string, string, string, number][]
                ).map((x) => (
                  <div key={x[0]}>
                    <span>{t(x[0], x[1], x[2])}</span>
                    <strong>{fmt(x[3])}</strong>
                  </div>
                ))}
                <p>
                  {t(
                    "Accepting does not charge your card or transfer a refund. The office will arrange payment requests and track any refund separately.",
                    "Принятие не списывает деньги и не переводит возврат. Офис отдельно оформит оплату и отслеживание возврата.",
                    "Təsdiq kartdan pul tutmur və geri qaytarma etmir. Ofis ödəniş tələblərini və geri qaytarılmanı ayrıca idarə edəcək.",
                  )}
                </p>
                <p>
                  {t("Valid until", "Действительно до", "Etibarlıdır")}:{" "}
                  {new Date(p.expiresAt).toLocaleString(l)}
                </p>
              </article>
              {a.refundTracking && (
                <article className="change-card">
                  <h3>
                    {t(
                      "Refund tracking",
                      "Статус возврата",
                      "Geri qaytarılmanın vəziyyəti",
                    )}
                  </h3>
                  <p>{state(a.refundTracking.state)}</p>
                  <p>{a.refundTracking.customer_message}</p>
                </article>
              )}
            </aside>
          </div>
          <article className="change-card">
            <h2>
              {t(
                "Review the contract",
                "Просмотрите договор",
                "Müqaviləni nəzərdən keçir",
              )}
            </h2>
            <div className="security-actions">
              <button
                className="button"
                disabled={busy}
                onClick={() => run(() => view(false))}
              >
                {t("Open new PDF", "Открыть новый PDF", "Yeni PDF-i aç")}
              </button>
              <button
                className="cc-text"
                disabled={busy}
                onClick={() => run(() => view(true))}
              >
                {t(
                  "View previous contract",
                  "Предыдущий договор",
                  "Əvvəlki müqaviləyə bax",
                )}
              </button>
            </div>
            {pdf && (
              <>
                <a href={pdf} target="_blank" rel="noreferrer">
                  {t(
                    "Open in a new tab",
                    "Открыть в новой вкладке",
                    "Yeni vərəqdə aç",
                  )}
                </a>
                <iframe
                  className="amendment-pdf"
                  src={pdf}
                  title={t(
                    "Contract preview",
                    "Просмотр договора",
                    "Müqaviləyə baxış",
                  )}
                />
              </>
            )}
            {a.canAccept ? (
              <>
                <label className="change-agree">
                  <input
                    type="checkbox"
                    checked={agree}
                    disabled={!opened || busy}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  {t(
                    "I reviewed the new PDF and accept the itinerary, service policies, fees, refund amount and remaining balance shown above.",
                    "Я просмотрел новый PDF и принимаю маршрут, условия услуг, сборы, сумму возврата и остаток оплаты.",
                    "Yeni PDF-i oxudum, yuxarıdakı marşrutu, xidmət şərtlərini, tutulmaları, qaytarılacaq məbləği və qalıq ödənişi təsdiqləyirəm.",
                  )}
                </label>
                <div className="security-actions">
                  <button
                    className="button"
                    disabled={!agree || busy}
                    onClick={() =>
                      run(async () => {
                        await customerApi(base + "/accept", {
                          amendmentId: a.id,
                          version: a.draft_version,
                          sha256: a.pdf_sha256,
                        });
                        setAgree(false);
                        setNotice(
                          t(
                            "Changes accepted. Your new contract and journey are now effective.",
                            "Изменения приняты. Новый договор и маршрут вступили в силу.",
                            "Dəyişiklik təsdiqləndi. Yeni müqavilə və səfər planı qüvvəyə mindi.",
                          ),
                        );
                        await load();
                      })
                    }
                  >
                    {t(
                      "Accept changes",
                      "Принять изменения",
                      "Dəyişiklikləri təsdiqlə",
                    )}
                  </button>
                  <button
                    className="cc-text"
                    disabled={busy}
                    onClick={() => setDeclining(!declining)}
                  >
                    {t(
                      "Decline proposal",
                      "Отклонить предложение",
                      "Təklifi rədd et",
                    )}
                  </button>
                </div>
                {declining && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(async () => {
                        await customerApi(base + "/decline", {
                          amendmentId: a.id,
                          version: a.draft_version,
                          message: reason,
                        });
                        setDeclining(false);
                        setNotice(
                          t(
                            "Proposal declined. Your previous booking stays effective.",
                            "Предложение отклонено. Предыдущее бронирование остаётся в силе.",
                            "Təklif rədd edildi. Əvvəlki sifariş qüvvədə qalır.",
                          ),
                        );
                        await load();
                      });
                    }}
                  >
                    <label>
                      {t(
                        "Reason (optional)",
                        "Причина (необязательно)",
                        "Səbəb (istəyə görə)",
                      )}
                      <textarea
                        value={reason}
                        maxLength={1000}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                    <button className="button" disabled={busy}>
                      {t(
                        "Confirm decline",
                        "Подтвердить отказ",
                        "Rədd etməni təsdiqlə",
                      )}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <p>
                {a.state === "ACCEPTED"
                  ? t(
                      "You accepted this version. It is stored in your contract history.",
                      "Вы приняли эту версию. Она сохранена в истории договоров.",
                      "Bu versiyanı təsdiqləmisən. Müqavilə tarixçəsində saxlanılır.",
                    )
                  : t(
                      "This version cannot be accepted. It may be expired, replaced, declined or awaiting an office update.",
                      "Эта версия недоступна для принятия. Она могла истечь, быть заменена или отклонена.",
                      "Bu versiyanı təsdiqləmək mümkün deyil. Vaxtı bitmiş, əvəz edilmiş, rədd olunmuş və ya ofis yeniləməsi gözləyən ola bilər.",
                    )}
              </p>
            )}
          </article>
        </>
      )}
    </section>
  );
}
