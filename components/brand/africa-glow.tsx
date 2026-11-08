import { cn } from "@/lib/utils";

/**
 * Silhouette stylisée de l'Afrique (+ Madagascar), rétroéclairée par un halo
 * doré en douce pulsation — reprise du mur du studio OCD Live.
 */
export const AFRICA_PATH =
  "M66 6.6 L45.1 33 L27.5 52.3 L5.5 88 L2.8 122.7 L7.2 134.8 L16.5 143 L24.8 151.3 L30.3 162.3 L44 170.5 L57.8 179.3 L77 174.9 L93.5 176 L105.6 170 L112.8 168.9 L118.3 168.3 L132 179.9 L145.8 178.8 L151.3 182.6 L150.2 203.5 L163.9 225.5 L166.7 236.5 L171.6 253 L167.2 275 L163.9 297 L178.8 327.3 L182.6 352 L189.8 360.8 L200.2 390.5 L209 394.9 L236.5 390.5 L252.5 385 L269.5 367.4 L279.4 346.5 L294.3 335.5 L290.4 312.4 L302.5 299.8 L321.8 286 L321.8 264 L315.2 240.9 L317.4 225.5 L327.3 212.9 L348.2 192.5 L363 176 L379.5 145.8 L381.2 138.6 L336.6 140.3 L316.3 118.3 L304.2 99 L303.6 83.6 L294.3 71.5 L283.3 52.3 L277.8 38.5 L276.7 31.4 L263.5 31.9 L236.5 29.7 L209 27.5 L203.5 36.9 L184.3 30.3 L170.5 22.6 L159.5 19.3 L155.1 1 L152.9 0 L115.5 1.1 L95.7 7.2 L88 10.5 Z";

export const MADAGASCAR_PATH =
  "M370.2 269.5 L376.8 288.8 L371.3 297 L358.6 339.9 L347.6 343.8 L339.4 332.8 L338.3 321.8 L342.7 297 L354.8 290.4 L363 277.8 Z";

/** Position approximative de Lomé sur la silhouette. */
export const LOME_POINT = { x: 106, y: 171 };

export function AfricaGlow({
  className,
  showLome = true,
  animated = true,
}: {
  className?: string;
  showLome?: boolean;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="-8 -10 400 416"
      className={cn("h-auto w-full", animated && "animate-glow", className)}
      role="img"
      aria-label="Carte de l'Afrique lumineuse, avec Lomé mis en évidence"
    >
      <defs>
        <linearGradient id="africa-relief" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f6f1ea" />
        </linearGradient>
      </defs>
      <g stroke="#f3e3cc" strokeWidth="2.5" strokeLinejoin="round" fill="url(#africa-relief)">
        <path d={AFRICA_PATH} />
        <path d={MADAGASCAR_PATH} />
      </g>
      {showLome && (
        <g>
          <circle cx={LOME_POINT.x} cy={LOME_POINT.y} r="11" fill="#E8792B" opacity="0.25">
            <animate attributeName="r" values="6;16;6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0;0.45" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={LOME_POINT.x} cy={LOME_POINT.y} r="5" fill="#E8792B" stroke="#fff" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}
