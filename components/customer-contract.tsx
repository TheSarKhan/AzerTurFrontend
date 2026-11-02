"use client";
import { useEffect, useState } from "react";
import { customerApi } from "@/lib/customer-api";
import type { Locale } from "@/lib/travel";

type Contract = { id: string; version: number; filename: string; sha256: string; state: string; accepted_at: string | null };
export default function CustomerContract({ bookingId, locale }: { bookingId: string; locale: Locale }) {
  const t = (en: string, ru: string, az: string) => locale === "az" ? az : locale === "ru" ? ru : en;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdf, setPdf] = useState("");
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const path = "bookings/" + bookingId + "/contract";
  useEffect(() => {
    let live = true;
    setLoading(true); setError(""); setContract(null); setOpen(false); setChecked(false);
    customerApi<Contract | null>(path).then(x => { if (live) setContract(x); }).catch(() => { if (live) setError(t("Could not load documents.", "Не удалось загрузить документы.", "Sənədləri yükləmək olmadı.")); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [bookingId]);
  useEffect(() => {
    if (!open || !contract) return;
    const abort = new AbortController(); let url = "";
    fetch("/api/customer/" + path + "/" + contract.id + "/pdf", { cache: "no-store", credentials: "same-origin", signal: abort.signal })
      .then(r => { if (!r.ok || !r.headers.get("content-type")?.includes("application/pdf")) throw Error(); return r.blob(); })
      .then(blob => { if (abort.signal.aborted) return; url = URL.createObjectURL(blob); setPdf(url); })
      .catch(() => { if (!abort.signal.aborted) setError(t("Could not open the PDF.", "Не удалось открыть PDF.", "PDF-i açmaq olmadı.")); });
    return () => { abort.abort(); if (url) URL.revokeObjectURL(url); setPdf(""); };
  }, [open, contract?.id, bookingId]);
  async function accept() {
    if (!contract || !checked || !pdf) return;
    setBusy(true); setError("");
    try { setContract(await customerApi<Contract>(path + "/" + contract.id + "/accept", { sha256: contract.sha256 })); setChecked(false); }
    catch { setError(t("Could not confirm. The contract or offer may have changed; refresh and review again.", "Не удалось подтвердить. Договор или предложение могли измениться; обновите страницу.", "Təsdiq alınmadı. Müqavilə və ya təklif dəyişmiş ola bilər; səhifəni yeniləyib yenidən yoxlayın.")); }
    finally { setBusy(false); }
  }
  if (loading) return <p>{t("Loading documents…","Загрузка документов…","Sənədlər yüklənir…")}</p>;
  if (!contract) return <p>{error || t("No documents yet.","Документов пока нет.","Hələ sənəd yoxdur.")}</p>;
  return <div className="contract-review">
    <div className="cc-sage"><strong>{contract.state === "ACCEPTED" ? t("Contract confirmed","Договор подтверждён","Müqavilə təsdiqlənib") : t("Awaiting your confirmation","Ожидает вашего подтверждения","Təsdiqinizi gözləyir")}</strong></div>
    <p><strong>{contract.filename}</strong> · v{contract.version}</p>
    {contract.accepted_at && <p>{t("Confirmed on", "Подтверждено", "Təsdiq tarixi")}: {new Date(contract.accepted_at).toLocaleString(locale === "az" ? "az-AZ" : locale === "ru" ? "ru-RU" : "en-GB")}</p>}
    <p>{t("Review your contract before confirming. No payment is requested here.", "Изучите договор перед подтверждением. Оплата здесь не запрашивается.", "Təsdiqdən əvvəl müqaviləyə baxın. Burada ödəniş tələb olunmur.")}</p>
    <button className="cc-outline" onClick={() => { setChecked(false); setOpen(!open); }}>{open ? t("Close preview","Закрыть просмотр","Baxışı bağla") : t("Review PDF","Посмотреть PDF","PDF-ə bax")}</button>
    {error && <p role="alert">{error}</p>}
    {open && pdf && <><p><a href={pdf} download={contract.filename}>{t("Download PDF","Скачать PDF","PDF-i yüklə")}</a></p><iframe title={t("Contract PDF","PDF договора","Müqavilə PDF-i")} src={pdf} style={{width:"100%",height:"min(70vh, 720px)",border:"1px solid #ddd"}} /></>}
    {open && contract.state === "SENT" && <div><p><label><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} disabled={!pdf || busy} /> {t("I have reviewed and accept this contract","Я ознакомился и принимаю договор","Müqaviləni oxudum və qəbul edirəm")}</label></p><button className="cc-outline" onClick={() => void accept()} disabled={!checked || !pdf || busy}>{t("Confirm contract","Подтвердить договор","Müqaviləni təsdiqlə")}</button></div>}
  </div>;
}
