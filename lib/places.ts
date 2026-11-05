// Destination names and one-line notes for the route features (planner, tour pages, map).
export const places: Record<string, { name: [string, string, string]; note: [string, string, string] }> = {
  Baku: {
    name: ["Baku", "Баку", "Bakı"],
    note: ["The capital and its Old City", "Столица и Старый город", "Paytaxt və İçərişəhər"],
  },
  Quba: {
    name: ["Quba", "Куба", "Quba"],
    note: ["Forests, orchards and the Caucasus foothills", "Леса, сады и предгорья Кавказа", "Meşələr, bağlar və Qafqaz ətəkləri"],
  },
  Khinalug: {
    name: ["Khinalug", "Хыналыг", "Xınalıq"],
    note: ["One of the highest villages in Europe", "Одно из самых высокогорных сёл Европы", "Avropanın ən hündürdə yerləşən kəndlərindən"],
  },
  Gabala: {
    name: ["Gabala", "Габала", "Qəbələ"],
    note: ["Mountain lakes, forests and fresh air", "Горные озёра, леса и свежий воздух", "Dağ gölləri, meşələr və təmiz hava"],
  },
  Sheki: {
    name: ["Sheki", "Шеки", "Şəki"],
    note: ["Silk Road caravanserais and the Khan's Palace", "Караван-сараи и Дворец ханов", "İpək yolu karvansaraları və Xan sarayı"],
  },
};
export type PlaceLocale = "en" | "ru" | "az";
export const cityName = (city: string, locale: PlaceLocale) =>
  places[city]?.name[locale === "az" ? 2 : locale === "ru" ? 1 : 0] ?? city;
