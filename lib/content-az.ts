export const tourAz: Record<
  string,
  { name: string; description: string; difficulty: string; plans: string[] }
> = {
  "quba-khinalug": {
    name: "Dağlara doğru",
    description:
      "Kənd cığırları, geniş dərələr və gündəlikdən uzaq bir gecə. Sizə uyğun ritmlə şimala doğru yola çıxın.",
    difficulty: "Orta",
    plans: ["Şəhərdən dağlara", "Sakit səhər. Mənzərəli qayıdış."],
  },
  "sheki-gabala": {
    name: "İpək yolu boyunca",
    description:
      "Həyətlər, sənətkarlıq və bir az da qalmaq istədən qonaqpərvərlik. Azərbaycanın fərqli tərəfinə üç günlük səfər.",
    difficulty: "Asan",
    plans: ["Qəbələyə gedən yol", "Şəkidə bir gün", "Son çay. Bakıya qayıdış."],
  },
  "baku-discovery": {
    name: "Təzadlar şəhəri",
    description:
      "Köhnə daş küçələr və gələcəyə baxan şəhər. Yerli gidin hekayələri ilə Bakını yenidən kəşf edin.",
    difficulty: "Asan",
    plans: ["Keçmişlə gələcək arasında"],
  },
};
export const placeAz: Record<string, { name: string; text: string }> = {
  mountains: { name: "Dağlar", text: "Tələsməyən yolla gedin." },
  sheki: { name: "İpək yolu", text: "Hər döngədə bir hekayə." },
  baku: { name: "Şəhər və dəniz", text: "Qədim ruh. Yeni baxışlar." },
};
export const faqAz: [string, string][] = [
  [
    "Rezervasiya necə edilir?",
    "Qeydiyyatdan keçin, səfəri seçin və operator yoxlamasına göndərin. Təsdiqdən sonra demo depozit açılır. Real ödəniş edilmir.",
  ],
  [
    "Hazır turu dəyişə bilərəm?",
    "Bəli. Tur səhifəsində “Bu turu özünə uyğunlaşdır” seçimi ilə marşrutu açın. Oteli, gidi, fəaliyyəti və transferi dəyişə bilərsiniz.",
  ],
  [
    "Qiymətə nə daxildir?",
    "Qiymətdə seçdiyiniz hər xidmət, ümumi məbləğ, depozit və qalıq ayrıca göstərilir. Əlavə xidmətləri sorğu yaratmazdan əvvəl görəcəksiniz.",
  ],
  [
    "Qalıq məbləğ nə vaxt ödənilir?",
    "Hazırkı demo qaydasında qalıq 70% səfərdən 7 gün əvvəl ödənilir. Yekun ödəniş qaydaları turizm komandası ilə təsdiqlənəcək.",
  ],
  [
    "Viza lazımdır?",
    "Viza tələbləri vətəndaşlığınızdan asılıdır. Rezervasiyadan əvvəl Azərbaycanın rəsmi elektron viza portalını yoxlayın.",
  ],
  [
    "Bunlar fərdi səfərlərdir?",
    "Nümunə turlar 1–12 nəfərlik fərdi səfərlərdir. Daha böyük qrup üçün fərdi təklif istəyə bilərsiniz.",
  ],
  [
    "Uşaqlarla gəlmək olar?",
    "Bəli. İlk versiyada bütün yaşlar üçün eyni qiymət modeli istifadə olunur. Uşaqlar və xüsusi ehtiyaclar haqqında rezervasiya qeydlərində yazın.",
  ],
  [
    "Hansı dillər mövcuddur?",
    "Sayt ingilis, rus və Azərbaycan dillərindədir. Gidin dilini marşrut qurucusunda ayrıca seçin.",
  ],
  [
    "Nə qədər əvvəl rezervasiya etmək olar?",
    "Bu gündən ən azı 3 gün, ən çoxu 12 ay sonrakı tarixi seçin. Fərdi səfərlər 14 günədək ola bilər.",
  ],
  [
    "Qiymət görünmürsə nə edim?",
    "Seçimlərinizlə fərdi təklif sorğusu göndərə bilərsiniz. Ümumi əlaqə forması hələ önbaxış rejimindədir və mesaj göndərmir.",
  ],
  [
    "Özümlə nə götürüm?",
    "Rahat ayaqqabı və mövsümə uyğun geyim götürün. Dağlarda hava Bakıdan fərqlənir; səfər tarixinizə uyğun proqnozu yoxlayın.",
  ],
  [
    "Səfəri dəyişmək və ya ləğv etmək olar?",
    "Hesabınızdakı “Səfərlərim” bölməsindən sorğu yaradın. Dəyişiklik və ləğvi ofis əməkdaşı nəzərdən keçirir. Yekun hüquqi şərtlər istifadədən əvvəl təsdiqlənəcək.",
  ],
];
