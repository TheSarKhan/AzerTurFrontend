import type { Locale } from "./travel";
export type HomeText = readonly [string, string, string];
export const homeText = (text: HomeText, locale: Locale) =>
  text[locale === "en" ? 0 : locale === "ru" ? 1 : 2];
export const homeCopy = {
  title: ["Azerbaijan.", "Азербайджан.", "Azərbaycan."],
  headline: [
    "Your kind of journey.",
    "Путешествие в вашем стиле.",
    "Sənin seçdiyin səyahət.",
  ],
  intro: [
    "From mountain villages to city nights.",
    "От горных деревень до огней города.",
    "Dağ kəndlərindən şəhər gecələrinə.",
  ],
  intro2: [
    "Choose a ready-made tour or build your own.",
    "Выберите готовый тур или создайте свой.",
    "Hazır tur seç və ya öz səfərini yarat.",
  ],
  explore: ["Explore tours", "Посмотреть туры", "Turlara bax"],
  destination: ["Destination", "Направление", "İstiqamət"],
  where: [
    "Where would you like to go?",
    "Куда хотите отправиться?",
    "Hara getmək istəyirsən?",
  ],
  date: ["Travel dates", "Дата поездки", "Səfər tarixi"],
  travelers: ["Travelers", "Путешественники", "Səyahətçilər"],
  search: ["Find a journey", "Найти поездку", "Səfər tap"],
  availability: [
    "Availability and final price confirmed by our team.",
    "Наличие и окончательную цену подтверждает наша команда.",
    "Mövcudluğu və yekun qiyməti komandamız təsdiqləyir.",
  ],
  categories: [
    "How do you want to explore?",
    "Что хотите открыть для себя?",
    "Necə kəşf etmək istəyirsən?",
  ],
  destinations: [
    "One country. So much to discover.",
    "Одна страна. Столько открытий.",
    "Bir ölkə. Kəşf ediləsi çox şey.",
  ],
  destinationsLink: [
    "Explore destinations",
    "Все направления",
    "İstiqamətlərə bax",
  ],
  journeys: [
    "A few journeys to start with",
    "Несколько идей для начала",
    "Başlamaq üçün bir neçə səfər",
  ],
  journeysIntro: [
    "A starting point. Make it yours.",
    "Отправная точка. Сделайте её своей.",
    "Bir başlanğıc. Özünə uyğunlaşdır.",
  ],
  allTours: ["View all tours", "Все туры", "Bütün turlar"],
  itinerary: ["View itinerary", "Посмотреть маршрут", "Marşruta bax"],
  days: ["days", "дн.", "gün"],
  examples: [
    "Example itineraries — details to be confirmed.",
    "Примерные маршруты — детали требуют подтверждения.",
    "Nümunə marşrutlar — təfərrüatlar təsdiqlənməlidir.",
  ],
  builderTitle: [
    "Your trip. Your choices.",
    "Ваша поездка. Ваш выбор.",
    "Sənin səfərin. Sənin seçimin.",
  ],
  builderIntro: [
    "Choose your stays, transfers, guides and experiences. We bring the journey together.",
    "Выбирайте проживание, трансферы, гидов и впечатления. Мы свяжем всё в одну поездку.",
    "Otel, transfer, bələdçi və təcrübələrini seç. Biz səfərin hissələrini birləşdirək.",
  ],
  create: ["Create your trip", "Создать поездку", "Öz səfərini yarat"],
  process: [
    "A clear plan, from start to finish.",
    "Понятный план от начала до конца.",
    "Başdan sona aydın plan.",
  ],
  processNote: [
    "Current preview: operator review and demo payments. Contract approval and staged payments are being prepared.",
    "Сейчас доступны проверка оператором и демо-платежи. Подтверждение договора и поэтапная оплата готовятся.",
    "Hazırda operator yoxlaması və demo ödəniş işləyir. Müqavilə təsdiqi və mərhələli ödəniş hazırlanır.",
  ],
  local: [
    "Local knowledge. A journey that fits.",
    "Местные знания. Поездка для вас.",
    "Yerli bilik. Sənə uyğun səyahət.",
  ],
  faq: ["Before you set off", "Перед поездкой", "Yola çıxmazdan əvvəl"],
  person: ["traveler", "чел.", "nəfər"],
  people: ["travelers", "чел.", "nəfər"],
  day: ["day", "дн.", "gün"],
} satisfies Record<string, HomeText>;
export const homeCategories: {
  id: string;
  label: HomeText;
  description: HomeText;
  region?: string;
}[] = [
  {
    id: "history",
    label: ["History", "История", "Tarix"],
    description: [
      "Ancient sites and living heritage",
      "Древние места и живое наследие",
      "Qədim məkanlar və yaşayan irs",
    ],
  },
  {
    id: "culture",
    label: ["Culture", "Культура", "Mədəniyyət"],
    description: [
      "Art, traditions and local life",
      "Искусство, традиции и местная жизнь",
      "İncəsənət, ənənələr və yerli həyat",
    ],
  },
  {
    id: "medical",
    label: ["Medical", "Лечение", "Tibbi turizm"],
    description: [
      "Discuss your needs with our team",
      "Обсудите пожелания с командой",
      "İstəklərini komanda ilə dəqiqləşdir",
    ],
  },
  {
    id: "nature",
    label: ["Nature", "Природа", "Təbiət"],
    description: [
      "Mountains, lakes and open roads",
      "Горы, озёра и открытые дороги",
      "Dağlar, göllər və açıq yollar",
    ],
  },
  {
    id: "entertainment",
    label: ["Entertainment", "Развлечения", "Əyləncə"],
    description: [
      "City life and shared experiences",
      "Городская жизнь и впечатления",
      "Şəhər həyatı və yeni təcrübələr",
    ],
  },
  {
    id: "business",
    label: ["Business", "Бизнес", "Biznes"],
    description: [
      "Plan your business visit",
      "Спланируйте деловую поездку",
      "İşgüzar səfərini planla",
    ],
  },
];
export const homeDestinations: {
  name: HomeText;
  image: string;
  alt: HomeText;
  description: HomeText;
  region: string;
}[] = [
  {
    name: ["Baku", "Баку", "Bakı"],
    image: "baku.webp",
    alt: [
      "Baku skyline by the Caspian Sea",
      "Панорама Баку у Каспия",
      "Xəzər sahilində Bakı mənzərəsi",
    ],
    description: [
      "A modern city with a timeless soul.",
      "Современный город с древней душой.",
      "Qədim ruhlu müasir şəhər.",
    ],
    region: "baku",
  },
  {
    name: ["Sheki", "Шеки", "Şəki"],
    image: "sheki.webp",
    alt: ["Sheki Khan Palace", "Дворец шекинских ханов", "Şəki Xan sarayı"],
    description: [
      "Palaces, crafts and a proud history.",
      "Дворцы, ремёсла и богатая история.",
      "Saraylar, sənətkarlıq və zəngin tarix.",
    ],
    region: "sheki",
  },
  {
    name: ["Gabala", "Габала", "Qəbələ"],
    image: "gabala.jpg",
    alt: [
      "Nohur Lake in Gabala",
      "Озеро Нохур в Габале",
      "Qəbələdə Nohur gölü",
    ],
    description: [
      "Nature, adventure and fresh air.",
      "Природа, приключения и свежий воздух.",
      "Təbiət, macəra və təmiz hava.",
    ],
    region: "sheki",
  },
  {
    name: ["Khinalug", "Хыналыг", "Xınalıq"],
    image: "village.webp",
    alt: [
      "Stone houses in Khinalug",
      "Каменные дома Хыналыга",
      "Xınalıqda daş evlər",
    ],
    description: [
      "Village life high in the Caucasus.",
      "Жизнь высоко в горах Кавказа.",
      "Qafqazın yüksəkliklərində kənd həyatı.",
    ],
    region: "mountains",
  },
];
export const homeServices: HomeText[] = [
  ["Stays", "Проживание", "Otellər"],
  ["Transfers", "Трансферы", "Transferlər"],
  ["Guides", "Гиды", "Bələdçilər"],
  ["Experiences", "Впечатления", "Təcrübələr"],
];
export const homeSteps: { title: HomeText; description: HomeText }[] = [
  {
    title: ["Choose your journey", "Выберите поездку", "Səfərini seç"],
    description: [
      "Explore tours or tell us what you have in mind.",
      "Посмотрите туры или расскажите о своих планах.",
      "Turlara bax və ya planlarını bizə bildir.",
    ],
  },
  {
    title: [
      "We check the details",
      "Мы проверяем детали",
      "Detalları yoxlayırıq",
    ],
    description: [
      "Our team confirms availability and your final quote.",
      "Команда проверит наличие и подтвердит цену.",
      "Komandamız mövcudluğu və yekun qiyməti təsdiqləyir.",
    ],
  },
  {
    title: ["Review, then pay", "Проверьте и оплатите", "Yoxla və ödə"],
    description: [
      "Review the approved offer in your account. Payments in this preview are simulated.",
      "Проверьте одобренное предложение в аккаунте. В демо оплата имитируется.",
      "Təsdiqlənmiş təklifi hesabında yoxla. Bu versiyada ödəniş simulyasiya olunur.",
    ],
  },
];
export const homeBenefits: { title: HomeText; description: HomeText }[] = [
  {
    title: ["Made around you", "Под ваши планы", "Sənə uyğun"],
    description: [
      "Choose the services and pace that suit you.",
      "Выбирайте услуги и удобный темп.",
      "Sənə uyğun xidmətləri və tempi seç.",
    ],
  },
  {
    title: ["Coordinated locally", "Местная координация", "Yerli koordinasiya"],
    description: [
      "One team brings your travel arrangements together.",
      "Одна команда координирует вашу поездку.",
      "Bir komanda səfərinin hissələrini birləşdirir.",
    ],
  },
  {
    title: [
      "Clear before you commit",
      "Ясность до подтверждения",
      "Təsdiqdən əvvəl aydınlıq",
    ],
    description: [
      "Review the itinerary, services and final quote before payment.",
      "Проверьте маршрут, услуги и итоговую цену до оплаты.",
      "Ödənişdən əvvəl marşrutu, xidmətləri və yekun qiyməti yoxla.",
    ],
  },
];
export const homeFaq: { q: HomeText; a: HomeText }[] = [
  {
    q: [
      "Can I customize a ready-made tour?",
      "Можно изменить готовый тур?",
      "Hazır turu dəyişə bilərəm?",
    ],
    a: [
      "Yes. Start with a package, open the trip planner and adapt the route and services to your plans.",
      "Да. Выберите пакет, откройте конструктор и настройте маршрут и услуги под свои планы.",
      "Bəli. Paketdən başla, səfər qurucusunu aç və marşrutla xidmətləri planlarına uyğunlaşdır.",
    ],
  },
  {
    q: [
      "When is my booking confirmed?",
      "Когда подтвердят бронирование?",
      "Rezervasiyam nə vaxt təsdiqlənir?",
    ],
    a: [
      "Our team checks availability and the final price before approval. We aim to respond within 20–60 minutes; this is a target, not a guarantee.",
      "До одобрения команда проверяет наличие и цену. Цель — ответить за 20–60 минут; это ориентир, а не гарантия.",
      "Komandamız təsdiqdən əvvəl mövcudluğu və yekun qiyməti yoxlayır. 20–60 dəqiqədə cavab verməyi hədəfləyirik; bu, zəmanət deyil.",
    ],
  },
  {
    q: [
      "How do staged payments work?",
      "Как работает поэтапная оплата?",
      "Mərhələli ödəniş necə işləyəcək?",
    ],
    a: [
      "The planned flow starts with a deposit, followed by payment requests when services become due. It is not live yet: this preview simulates a deposit and balance without charging money.",
      "Планируется депозит и запросы на оплату по мере необходимости услуг. Сейчас доступны только демо-депозит и остаток без реальных списаний.",
      "Planlaşdırılan axında əvvəl beh, sonra xidmətlərin vaxtı çatdıqca ödəniş sorğuları olacaq. Hələ aktiv deyil: bu versiyada beh və qalıq real pul tutulmadan yoxlanılır.",
    ],
  },
  {
    q: [
      "What happens if I need to cancel?",
      "Что делать при отмене?",
      "Ləğv etmək istəsəm nə olacaq?",
    ],
    a: [
      "Submit a cancellation request from your account. Staff review each service according to its provider terms and cancellation time. Refunds are not automatic and no universal refund percentage applies.",
      "Отправьте запрос из аккаунта. Сотрудник проверит условия поставщика каждой услуги и время отмены. Возврат не автоматический; единого процента нет.",
      "Hesabından ləğv sorğusu göndər. Əməkdaş hər xidmətin partnyor şərtlərini və ləğv vaxtını yoxlayır. Geri ödəniş avtomatik deyil və vahid faiz tətbiq olunmur.",
    ],
  },
];
