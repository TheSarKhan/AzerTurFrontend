"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type Pin = {
  slug: string;
  latitude: number;
  longitude: number;
  image: string | null;
  title: string;
  venue: string;
  when: string;
};
type Point = { x: number; y: number };
type Group = Point & { pins: Pin[] };
type Translate = (en: string, ru: string, az: string) => string;
const MAX_ZOOM = 19;
const SPACING = 58;
const PER_RING = 8;

function groupPins(map: LeafletMap, pins: Pin[]) {
  const { x: width, y: height } = map.getSize();
  const groups: Group[] = [];
  for (const pin of pins) {
    const { x, y } = map.latLngToContainerPoint([pin.latitude, pin.longitude]);
    if (x < -30 || y < -30 || x > width + 30 || y > height + 30) continue;
    const nearby = groups.find((group) => Math.hypot(x - group.x, y - group.y) < SPACING);
    if (nearby) nearby.pins.push(pin);
    else groups.push({ x, y, pins: [pin] });
  }
  return groups;
}

export function EventsMap({ pins, position, t, href, open }: {
  pins: Pin[];
  position: { lat: number; lng: number } | null;
  t: Translate;
  href: (slug: string) => string;
  open: (slug: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [, setRevision] = useState(0);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Pin | null>(null);
  const [expanded, setExpanded] = useState<{ pins: Pin[]; page: number } | null>(null);

  useEffect(() => {
    let live = true;
    let cleanup: (() => void) | undefined;
    void import("leaflet").then((leaflet) => {
      if (!live || !element.current) return;
      const instance = leaflet.map(element.current, {
        minZoom: 5, maxZoom: MAX_ZOOM, scrollWheelZoom: false,
      }).setView([40.45, 48.1], 7);
      leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(instance);
      const redraw = () => setRevision((value) => value + 1);
      const dismiss = () => { setSelected(null); setExpanded(null); };
      instance.on("move zoom resize", redraw);
      instance.on("dragstart zoomstart click", dismiss);
      const observer = new ResizeObserver(() => instance.invalidateSize());
      observer.observe(element.current);
      setMap(instance);
      cleanup = () => { observer.disconnect(); instance.remove(); };
    }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; cleanup?.(); };
  }, []);

  useEffect(() => {
    if (!map) return;
    setExpanded(null);
    setSelected(null);
    if (position) map.setView([position.lat, position.lng], 12, { animate: false });
    else if (pins.length) map.fitBounds(
      pins.map((pin) => [pin.latitude, pin.longitude]),
      { padding: [54, 54], maxZoom: 13, animate: false },
    );
  }, [map, pins, position]);

  // Leaflet updates its viewport outside React.
  const groups = map ? groupPins(map, pins) : [];
  function activate(group: Group) {
    if (!map) return;
    if (group.pins.length === 1) {
      setSelected(group.pins[0]);
      return;
    }
    setSelected(null);
    if (map.getZoom() < MAX_ZOOM) {
      map.setView(map.containerPointToLatLng([group.x, group.y]),
        Math.min(MAX_ZOOM, map.getZoom() + 3), { animate: false });
      return;
    }
    map.panTo(map.containerPointToLatLng([group.x, group.y]), { animate: false });
    setExpanded({ pins: group.pins, page: 0 });
  }

  const page = expanded?.pins.slice(expanded.page * PER_RING, (expanded.page + 1) * PER_RING) ?? [];
  const totalPages = expanded ? Math.ceil(expanded.pins.length / PER_RING) : 0;
  const marker = (pin: Pin, point: Point, action: () => void, count?: number) => (
    <button
      type="button"
      key={pin.slug}
      className="ev-map-pin"
      style={{ left: point.x, top: point.y }}
      aria-label={count ? t(`${count} events here`, `${count} событий здесь`, `Burada ${count} tədbir`) : pin.title}
      aria-pressed={count ? undefined : selected?.slug === pin.slug}
      onClick={action}
    >
      <CalendarDays size={20} aria-hidden />
      {pin.image && <img src={pin.image} alt="" draggable={false} onError={(event) => { event.currentTarget.hidden = true; }} />}
      {count ? <span>{count}</span> : null}
    </button>
  );

  return (
    <div className="ev-map">
      <div ref={element} className="ev-map-surface" aria-label={t("Event map", "Карта событий", "Tədbirlər xəritəsi")} />
      {failed && <p role="alert">{t("Could not open the map.", "Не удалось открыть карту.", "Xəritəni açmaq olmadı.")}</p>}
      {map && (
        <div className="ev-map-pins">
          {position && (() => {
            const point = map.latLngToContainerPoint([position.lat, position.lng]);
            return <span className="ev-map-you" style={{ left: point.x, top: point.y }} aria-hidden />;
          })()}
          {!expanded && groups.map((group) => marker(group.pins[0], group, () => activate(group),
            group.pins.length > 1 ? group.pins.length : undefined))}
          {expanded && (
            <div className="ev-map-ring">
              {page.map((pin, index) => {
                const angle = -Math.PI / 2 + index * 2 * Math.PI / page.length;
                const { x, y } = map.getSize();
                return marker(pin, { x: x / 2 + Math.cos(angle) * 82, y: y / 2 + Math.sin(angle) * 82 },
                  () => setSelected(pin));
              })}
              <button className="ev-map-ring-close" type="button" onClick={() => { setExpanded(null); setSelected(null); }} aria-label={t("Close group", "Закрыть группу", "Qrupu bağla")}><X size={18} /></button>
              {totalPages > 1 && (
                <div className="ev-map-ring-pages">
                  <button type="button" disabled={expanded.page === 0} onClick={() => { setSelected(null); setExpanded({ ...expanded, page: expanded.page - 1 }); }} aria-label={t("Previous", "Назад", "Əvvəlki")}><ChevronLeft size={18} /></button>
                  <span>{expanded.page + 1} / {totalPages}</span>
                  <button type="button" disabled={expanded.page + 1 === totalPages} onClick={() => { setSelected(null); setExpanded({ ...expanded, page: expanded.page + 1 }); }} aria-label={t("Next", "Дальше", "Növbəti")}><ChevronRight size={18} /></button>
                </div>
              )}
            </div>
          )}
          {selected && (
            <div className="ev-map-popover">
              <button type="button" onClick={() => setSelected(null)} aria-label={t("Close", "Закрыть", "Bağla")}><X size={18} /></button>
              <strong>{selected.title}</strong>
              <span>{selected.venue}, {selected.when}</span>
              <a href={href(selected.slug)} onClick={(event) => { event.preventDefault(); open(selected.slug); }}>{t("Details", "Подробнее", "Ətraflı")}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
