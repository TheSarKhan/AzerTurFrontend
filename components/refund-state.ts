import type { Locale } from "@/lib/travel";
export function refundState(l: Locale, state?: string) {
  const labels: Record<string, [string, string, string]> = {
    PENDING: [
      "The refund is awaiting processing.",
      "Возврат ожидает обработки.",
      "Geri ödəniş icranı gözləyir.",
    ],
    PROCESSING: [
      "Your refund is being processed.",
      "Ваш возврат обрабатывается.",
      "Geri ödənişiniz icradadır.",
    ],
    COMPLETED_MANUAL: [
      "The office recorded the transfer. Contact us if it has not reached your account.",
      "Офис отметил перевод. Свяжитесь с нами, если деньги не поступили.",
      "Ofis köçürməni qeyd edib. Hesabınıza çatmayıbsa bizimlə əlaqə saxlayın.",
    ],
    FAILED: [
      "The transfer needs further action from our team.",
      "Для перевода нужны дополнительные действия команды.",
      "Köçürmə üçün komandamızın əlavə tədbiri lazımdır.",
    ],
    UNKNOWN: [
      "The transfer result is being checked.",
      "Результат перевода проверяется.",
      "Köçürmənin nəticəsi yoxlanılır.",
    ],
    NOT_REQUIRED: [
      "No refund is due.",
      "Возврат не требуется.",
      "Geri ödəniş tələb olunmur.",
    ],
  };
  const text = labels[state || "PENDING"] || labels.PENDING;
  return text[l === "az" ? 2 : l === "ru" ? 1 : 0];
}
