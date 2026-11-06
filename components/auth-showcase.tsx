"use client";
import Image from "next/image";
import type { Locale } from "@/lib/travel";

const slides = [
  { src: "/images/homepage-v3/khinalug.webp", place: ["Khinalug", "Хыналуг", "Xınalıq"] },
  { src: "/images/homepage-v3/baku.webp", place: ["Baku", "Баку", "Bakı"] },
  { src: "/images/homepage-v3/sheki.webp", place: ["Sheki", "Шеки", "Şəki"] },
  { src: "/images/homepage-v3/hiking.webp", place: ["Caucasus trails", "Тропы Кавказа", "Qafqaz cığırları"] },
] as const;
const pick = (l: Locale, v: readonly [string, string, string]) =>
  l === "az" ? v[2] : l === "ru" ? v[1] : v[0];

/** Slow cross-fading photographs with a gentle pan and zoom; CSS only, no video weight. */
export function AuthShowcase({ locale: l }: { locale: Locale }) {
  return (
    <aside className="auth-showcase" aria-hidden="true">
      {slides.map((s, i) => (
        <figure key={s.src} className="auth-slide" style={{ animationDelay: `${i * 7}s` }}>
          <Image
            src={s.src}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            quality={75}
            priority={i === 0}
            style={{ animationDelay: `${i * 7}s` }}
          />
          <figcaption>{pick(l, s.place)}</figcaption>
        </figure>
      ))}
      <p className="auth-quote">
        {l === "az"
          ? "Azərbaycanı öz tempinizdə kəşf edin."
          : l === "ru"
            ? "Откройте Азербайджан в своём темпе."
            : "Discover Azerbaijan at your own pace."}
      </p>
    </aside>
  );
}
