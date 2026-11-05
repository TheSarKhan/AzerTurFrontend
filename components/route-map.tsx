import { useId } from "react";
import { cityPoints, outline } from "@/lib/route-geo";

export type RouteStop = { city: string; days: number };
// Crop to the north of the country, where every destination sits.
const view = { x: 135, y: 24, width: 262, height: 150 };
// Where each label sits relative to its dot so close neighbours do not collide.
const anchor: Record<
  string,
  { dx: number; dy: number; align: "start" | "end" | "middle" }
> = {
  Baku: { dx: -12, dy: 4, align: "end" },
  Quba: { dx: 11, dy: -8, align: "start" },
  Khinalug: { dx: 11, dy: 3, align: "start" },
  Gabala: { dx: 0, dy: 22, align: "middle" },
  Sheki: { dx: 0, dy: -13, align: "middle" },
};

/** The route drawn over Azerbaijan: numbered stops joined by arrows in travel order. */
export function RouteMap({
  stops,
  name,
  label,
}: {
  stops: RouteStop[];
  name: (city: string) => string;
  label: string;
}) {
  const marker = useId().replace(/:/g, "");
  const order = new Map<string, number[]>();
  stops.forEach((s, i) =>
    order.set(s.city, [...(order.get(s.city) || []), i + 1]),
  );
  const legs = stops
    .slice(1)
    .map((s, i) => ({ from: stops[i].city, to: s.city, i }));
  return (
    <svg
      className="tpx-map"
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="#b54126" />
        </marker>
      </defs>
      <path d={outline} className="tpx-map-land" />
      {Object.entries(cityPoints).map(([city, p]) => (
        <g key={city}>
          {!order.has(city) && (
            <circle cx={p.x} cy={p.y} r={2.5} className="tpx-map-idle" />
          )}
          <text
            x={p.x + anchor[city].dx}
            y={p.y + anchor[city].dy}
            textAnchor={anchor[city].align}
            className={order.has(city) ? "tpx-map-label on" : "tpx-map-label"}
          >
            {name(city)}
          </text>
        </g>
      ))}
      {legs.map(({ from, to, i }) => {
        const a = cityPoints[from],
          b = cityPoints[to];
        const dx = b.x - a.x,
          dy = b.y - a.y,
          len = Math.hypot(dx, dy) || 1;
        // Stop short of both dots; bow alternate legs so out-and-back trips stay readable.
        const sx = a.x + (dx / len) * 7,
          sy = a.y + (dy / len) * 7,
          ex = b.x - (dx / len) * 8.5,
          ey = b.y - (dy / len) * 8.5,
          bow = (i % 2 ? -1 : 1) * Math.min(14, len / 5);
        const cx = (sx + ex) / 2 - (dy / len) * bow,
          cy = (sy + ey) / 2 + (dx / len) * bow;
        return (
          <path
            key={i}
            d={`M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`}
            className="tpx-map-leg"
            markerEnd={`url(#${marker})`}
          />
        );
      })}
      {[...order.entries()].map(([city, n]) => {
        const p = cityPoints[city];
        const text = n.join("·");
        return (
          <g key={city}>
            <circle
              cx={p.x}
              cy={p.y}
              r={text.length > 1 ? 8 : 6.5}
              className="tpx-map-stop"
            />
            <text
              x={p.x}
              y={p.y + 2.9}
              textAnchor="middle"
              className="tpx-map-number"
            >
              {text}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
