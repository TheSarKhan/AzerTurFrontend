import { tourAz, placeAz, faqAz } from "./content-az";
export type Locale = "en" | "ru" | "az";
export type Currency = "EUR" | "USD" | "AZN";
export const rates: Record<Currency, number> = { EUR: 1, USD: 1.1, AZN: 1.87 };
export const tours = [
  {
    slug: "quba-khinalug",
    name: ["Into the highlands", "Навстречу горам"],
    region: "Quba · Khinalug",
    days: 2,
    base: 240,
    image: "mountains",
    difficulty: ["Moderate", "Средняя"],
    description: [
      "Village paths, wide-open valleys and a night away from the everyday. Follow the road north, at a pace that feels like yours.",
      "Горные тропы, широкие долины и ночь вдали от повседневности. Отправляйтесь на север в своём ритме.",
    ],
    stops: ["Baku", "Quba", "Khinalug"],
    plans: [
      ["From the city to the mountains", "Из города в горы"],
      [
        "A slow morning. A scenic return.",
        "Неспешное утро. Живописная дорога домой.",
      ],
    ],
  },
  {
    slug: "sheki-gabala",
    name: ["Along the Silk Road", "По Шёлковому пути"],
    region: "Sheki · Gabala",
    days: 3,
    base: 410,
    image: "sheki",
    difficulty: ["Easy", "Лёгкая"],
    description: [
      "Courtyards, craft and the kind of hospitality that makes you stay a little longer. A three-day journey through a different side of Azerbaijan.",
      "Дворики, ремёсла и гостеприимство, благодаря которому хочется остаться. Три дня в другой стороне Азербайджана.",
    ],
    stops: ["Baku", "Gabala", "Sheki"],
    plans: [
      ["The road to Gabala", "Дорога в Габалу"],
      ["A day in Sheki", "День в Шеки"],
      ["One last tea. Back to Baku.", "Чай на прощание. Возвращение в Баку."],
    ],
  },
  {
    slug: "baku-discovery",
    name: ["A city of contrasts", "Город контрастов"],
    region: "Baku · Old City",
    days: 1,
    base: 85,
    image: "baku",
    difficulty: ["Easy", "Лёгкая"],
    description: [
      "Old stone streets and a city looking to the future. Discover Baku with a local guide, one good story at a time.",
      "Старые каменные улочки и город, устремлённый в будущее. Откройте Баку с местным гидом — история за историей.",
    ],
    stops: ["Baku", "Old City", "Caspian coast"],
    plans: [["Between the old and the new", "Между прошлым и будущим"]],
  },
];
export type Tour = (typeof tours)[number];
export const places = [
  {
    id: "mountains",
    name: ["The highlands", "Горы"],
    region: "Quba · Khinalug",
    image: "mountains",
    text: [
      "Take the road less hurried.",
      "Дорога, на которой не нужно спешить.",
    ],
    tour: "quba-khinalug",
  },
  {
    id: "sheki",
    name: ["The Silk Road", "Шёлковый путь"],
    region: "Sheki · Gabala",
    image: "sheki",
    text: ["Stories around every corner.", "Истории за каждым поворотом."],
    tour: "sheki-gabala",
  },
  {
    id: "baku",
    name: ["The city & the sea", "Город и море"],
    region: "Baku · Caspian coast",
    image: "baku",
    text: ["Old soul. New perspectives.", "Старая душа. Новые перспективы."],
    tour: "baku-discovery",
  },
];
export const faqs = [
  [
    "How does booking work?",
    "Как забронировать?",
    "Create an account, choose a trip and send your request. Our team checks availability and sends an offer and a contract for you to approve. After that, we request a deposit.",
    "Создайте аккаунт, выберите поездку и отправьте запрос. Команда проверит доступность и пришлёт предложение и договор для согласования. После этого мы запросим депозит.",
  ],
  [
    "Can I customise a ready-made trip?",
    "Можно изменить готовый тур?",
    "Yes. Select “Make this trip yours” on any tour page to load its route into the planner. Adjust your stay, guide, activities and transfers.",
    "Да. Нажмите «Изменить этот тур», чтобы открыть маршрут в конструкторе. Выбирайте отель, гида, занятия и трансферы.",
  ],
  [
    "What is included in the price?",
    "Что включено в стоимость?",
    "Your quote lists each selected service and the total. Optional extras are shown separately before you send your request.",
    "В расчёте указаны все выбранные услуги и общая сумма. Дополнительные услуги показываются до отправки запроса.",
  ],
  [
    "When do I pay?",
    "Когда нужно платить?",
    "After you approve the contract, our team requests a deposit. Later payments are requested as each service becomes due. Every payment request shows its amount in your account and is marked as paid once we receive it.",
    "После согласования договора команда запрашивает депозит. Следующие платежи запрашиваются по мере наступления сроков услуг. Каждый запрос с суммой виден в аккаунте и помечается оплаченным после получения.",
  ],
  [
    "Do I need a visa?",
    "Нужна ли виза?",
    "Visa requirements depend on your nationality. Check the official Azerbaijan e-visa portal before booking; this website does not determine visa eligibility.",
    "Визовые требования зависят от гражданства. Перед бронированием проверьте официальный портал электронной визы Азербайджана.",
  ],
  [
    "Are these private trips?",
    "Это индивидуальные туры?",
    "The sample itineraries are private trips for 1–12 travellers. Larger groups can request a tailored offer.",
    "Примерные маршруты — индивидуальные поездки для 1–12 человек. Для больших групп можно запросить предложение.",
  ],
  [
    "Can children join?",
    "Можно с детьми?",
    "Yes. The first release uses the same per-person price for all ages. Tell the team about children and any special needs at checkout.",
    "Да. В первой версии цена за человека одинаковая для всех возрастов. Укажите детей и особые пожелания при оформлении.",
  ],
  [
    "Which languages are available?",
    "Какие языки доступны?",
    "The website supports English, Russian and Azerbaijani. Select your guide language in the planner.",
    "Сайт доступен на английском, русском и азербайджанском. Язык гида выбирается в конструкторе.",
  ],
  [
    "How far ahead can I book?",
    "За сколько дней можно бронировать?",
    "Choose a departure at least 3 days ahead and up to 12 months from today. Custom journeys can be up to 14 days long.",
    "Выбирайте отправление минимум через 3 дня и максимум через 12 месяцев. Индивидуальная поездка может длиться до 14 дней.",
  ],
  [
    "What if a price is unavailable?",
    "Что делать, если цены нет?",
    "Your choices stay saved. You can request a manual offer, and the planned response window is 24 hours.",
    "Ваши настройки сохранятся. Можно запросить индивидуальное предложение; планируемый срок ответа — 24 часа.",
  ],
  [
    "What should I pack?",
    "Что взять с собой?",
    "Bring comfortable footwear and layers suited to the season. Mountain weather can differ from Baku; check the forecast for your travel dates.",
    "Возьмите удобную обувь и одежду по сезону. Погода в горах отличается от Баку; проверьте прогноз на даты поездки.",
  ],
  [
    "Can I cancel or change my trip?",
    "Можно отменить или изменить поездку?",
    "Send a change or cancellation request from your trip. Our team reviews it; terms and refunds depend on the service, the provider and the time of cancellation.",
    "Отправьте запрос на изменение или отмену из раздела поездки. Команда рассмотрит его; условия и возврат зависят от услуги, поставщика и времени отмены.",
  ],
];
export interface QuoteInput {
  slug: string;
  date: string;
  pax: number;
  hotel: "standard" | "comfort" | "premium";
  driver?: boolean;
  stay?: boolean;
  guideLanguage?: Locale;
  guide: boolean;
  transfer: boolean;
  activity: boolean;
  currency: Currency;
  customDays?: number;
  cities?: string[];
}
export interface Quote {
  id: string;
  status: "PRICED" | "MANUAL_REVIEW";
  currency: Currency;
  total: number;
  perPerson: number;
  deposit: number;
  balance: number;
  due: string;
  expires: string;
  lines: { label: string; amount: number }[];
  input: QuoteInput;
}
export function money(n: number, c: Currency, l: Locale = "en") {
  if (!Number.isFinite(n)) return "—";
  const amount = String(Math.round(n)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    l === "en" ? "," : "\u00a0",
  );
  const symbol = { EUR: "€", USD: "$", AZN: "₼" }[c];
  return l === "en" ? symbol + amount : amount + "\u00a0" + symbol;
}
/**
 * Prices are never promised before an operator reviews a request, so customers see a range:
 * roughly 15% below to 15% above the calculated amount, rounded outward to a tidy step.
 */
export function priceRange(n: number, c: Currency, l: Locale = "en") {
  if (!Number.isFinite(n) || n <= 0) return "—";
  const step = n < 500 ? 10 : n < 2000 ? 50 : 100;
  const low = Math.floor((n * 0.85) / step) * step,
    high = Math.ceil((n * 1.15) / step) * step;
  return money(low, c, l) + " – " + money(high, c, l);
}
export function dateLimit(offset: number) {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Baku" }),
  );
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Any destination may follow any other; the team arranges the transfers between them.
const destinations = ["Baku", "Quba", "Khinalug", "Gabala", "Sheki"];
export const transitions: Record<string, string[]> = Object.fromEntries(
  destinations.map((city) => [city, [...destinations]]),
);

for (const tour of tours) {
  const az = tourAz[tour.slug];
  tour.name[2] = az.name;
  tour.description[2] = az.description;
  tour.difficulty[2] = az.difficulty;
  tour.plans.forEach((day, i) => {
    day[2] = az.plans[i];
  });
}
for (const place of places) {
  place.name[2] = placeAz[place.id].name;
  place.text[2] = placeAz[place.id].text;
}
faqs.forEach((faq, i) => {
  faq[4] = faqAz[i][0];
  faq[5] = faqAz[i][1];
});
