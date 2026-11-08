import { cn } from "@/lib/utils";
import { AFRICA_PATH, LOME_POINT, MADAGASCAR_PATH } from "./africa-glow";

/**
 * La carte vivante : des signaux partent des villes d'Afrique et convergent
 * vers le studio de Lomé — l'image du live à distance.
 * Animations en CSS / SMIL uniquement (aucun JavaScript).
 */
const CITIES: { name: string; x: number; y: number; lx: number; ly: number; anchor: "start" | "end" }[] = [
  { name: "Dakar", x: 3, y: 122.6, lx: 6, ly: -7, anchor: "start" },
  { name: "Casablanca", x: 59.4, y: 18.7, lx: -6, ly: -6, anchor: "end" },
  { name: "Abidjan", x: 77, y: 174.1, lx: -7, ly: 12, anchor: "end" },
  { name: "Douala", x: 152.4, y: 181.2, lx: 7, ly: 3, anchor: "start" },
  { name: "Kinshasa", x: 183.2, y: 227.2, lx: 7, ly: 3, anchor: "start" },
  { name: "Le Caire", x: 270.6, y: 38.5, lx: -6, ly: -7, anchor: "end" },
  { name: "Nairobi", x: 301.4, y: 210.7, lx: 7, ly: 3, anchor: "start" },
  { name: "Johannesburg", x: 253, y: 347.6, lx: 7, ly: 3, anchor: "start" },
];

/** Arc courbe d'une ville vers Lomé (point de contrôle décalé vers le haut). */
function arc(x: number, y: number): string {
  const { x: lx, y: ly } = LOME_POINT;
  const mx = (x + lx) / 2;
  const my = (y + ly) / 2;
  const dx = lx - x;
  const dy = ly - y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const k = len * 0.28;
  return `M${x} ${y} Q${(mx + nx * k).toFixed(1)} ${(my + ny * k).toFixed(1)} ${lx} ${ly}`;
}

export function AfricaNetwork({
  className,
  tone = "light",
  labels = true,
}: {
  className?: string;
  tone?: "light" | "dark";
  labels?: boolean;
}) {
  const land = tone === "light" ? { fill: "#ffffff", stroke: "#efdcc2" } : { fill: "#1b1a19", stroke: "#3a3330" };
  const ink = tone === "light" ? "#111111" : "#f5f2ee";

  return (
    <svg viewBox="-20 -14 420 424" className={cn("h-auto w-full overflow-visible", className)} role="img" aria-label="Carte de l'Afrique : des lives à distance reliés au studio de Lomé">
      <defs>
        <filter id={`land-shadow-${tone}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#ffd9a0" floodOpacity={tone === "light" ? 0.9 : 0.35} />
        </filter>
      </defs>

      <g filter={`url(#land-shadow-${tone})`} fill={land.fill} stroke={land.stroke} strokeWidth="1.5" strokeLinejoin="round">
        <path d={AFRICA_PATH} />
        <path d={MADAGASCAR_PATH} />
      </g>

      {CITIES.map((c, i) => {
        const d = arc(c.x, c.y);
        return (
          <g key={c.name}>
            <path
              d={d}
              pathLength={1}
              fill="none"
              stroke="#E8792B"
              strokeWidth="1.2"
              strokeLinecap="round"
              className="draw-path"
              style={{ animationDelay: `${0.6 + i * 0.12}s` }}
            />
            <circle r="2.6" fill="#E8792B">
              <animateMotion dur={`${2.6 + (i % 3) * 0.5}s`} begin={`${1.4 + i * 0.25}s`} repeatCount="indefinite" path={d} />
            </circle>
            <circle cx={c.x} cy={c.y} r="3" fill={ink} />
            {labels && (
              <text
                x={c.x + c.lx}
                y={c.y + c.ly}
                textAnchor={c.anchor}
                className="hidden fill-current font-mono text-[9px] tracking-wider uppercase opacity-60 sm:inline"
                style={{ color: ink }}
              >
                {c.name}
              </text>
            )}
          </g>
        );
      })}

      <g>
        <circle cx={LOME_POINT.x} cy={LOME_POINT.y} r="8" fill="#E8792B" opacity="0.35">
          <animate attributeName="r" values="6;22;6" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={LOME_POINT.x} cy={LOME_POINT.y} r="6" fill="#E8792B" stroke={land.fill} strokeWidth="2.5" />
        {labels && (
          <g className="font-mono" style={{ color: ink }}>
            <line x1={LOME_POINT.x - 5} y1={LOME_POINT.y + 6} x2={LOME_POINT.x - 30} y2={LOME_POINT.y + 44} stroke={ink} strokeWidth="0.8" />
            <rect x={LOME_POINT.x - 122} y={LOME_POINT.y + 44} width="96" height="20" rx="10" fill="#111111" />
            <text x={LOME_POINT.x - 74} y={LOME_POINT.y + 57.5} textAnchor="middle" fill="#ffffff" className="text-[8.5px] tracking-widest uppercase">
              Studio · Lomé
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
