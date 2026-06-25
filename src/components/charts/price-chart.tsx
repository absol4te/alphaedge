"use client";

import { useMemo, useState } from "react";
import { Candle } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

type ChartType = "area" | "candle";

interface Props {
  candles: Candle[];
  type?: ChartType;
  height?: number;
  showVolume?: boolean;
  showGrid?: boolean;
  /** Overlay moving-average series, e.g. [20, 50] */
  smaPeriods?: number[];
}

const PAD = { top: 16, right: 56, bottom: 24, left: 8 };
const SMA_COLORS = ["#FFB020", "#3B82F6", "#A855F7"];

function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    return sum / period;
  });
}

export function PriceChart({
  candles,
  type = "area",
  height = 360,
  showVolume = true,
  showGrid = true,
  smaPeriods = [],
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 900; // viewBox width; scales responsively
  const volH = showVolume ? 56 : 0;
  const chartH = height - PAD.top - PAD.bottom - volH;
  const innerW = width - PAD.left - PAD.right;

  const { min, max, closes } = useMemo(() => {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    return {
      min: Math.min(...lows),
      max: Math.max(...highs),
      closes: candles.map((c) => c.close),
    };
  }, [candles]);

  const range = max - min || 1;
  const maxVol = Math.max(...candles.map((c) => c.volume));
  const n = candles.length;
  const stepX = innerW / Math.max(1, n - 1);
  const candleW = Math.max(1.5, (innerW / n) * 0.62);

  const xOf = (i: number) => PAD.left + i * stepX;
  const yOf = (p: number) => PAD.top + chartH - ((p - min) / range) * chartH;

  const areaLine = closes.map((c, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(c).toFixed(1)}`).join(" ");
  const areaFill = `${areaLine} L${xOf(n - 1)},${PAD.top + chartH} L${PAD.left},${PAD.top + chartH} Z`;

  const up = closes[n - 1] >= closes[0];
  const lineColor = up ? "#00C853" : "#FF3B5C";

  const smaSeries = smaPeriods.map((p) => ({ period: p, data: sma(closes, p) }));

  // Gridlines (price)
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const p = min + (range * i) / gridSteps;
    return { p, y: yOf(p) };
  });

  const hovered = hover != null ? candles[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * width - PAD.left;
          const idx = Math.round(x / stepX);
          setHover(Math.max(0, Math.min(n - 1, idx)));
        }}
      >
        {/* Grid */}
        {showGrid &&
          gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={g.y}
                y2={g.y}
                stroke="#2A2A2A"
                strokeWidth="0.5"
                strokeDasharray="2 4"
              />
              <text x={width - PAD.right + 6} y={g.y + 3} fill="#A0A0A0" fontSize="10" className="tabular">
                {g.p.toFixed(g.p > 1000 ? 0 : 2)}
              </text>
            </g>
          ))}

        {/* Area mode */}
        {type === "area" && (
          <>
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaFill} fill="url(#area-grad)" />
            <path d={areaLine} fill="none" stroke={lineColor} strokeWidth="1.8" strokeLinejoin="round" />
          </>
        )}

        {/* Candle mode */}
        {type === "candle" &&
          candles.map((c, i) => {
            const x = xOf(i);
            const bull = c.close >= c.open;
            const color = bull ? "#00C853" : "#FF3B5C";
            const yHigh = yOf(c.high);
            const yLow = yOf(c.low);
            const yOpen = yOf(c.open);
            const yClose = yOf(c.close);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyH = Math.max(1, Math.abs(yClose - yOpen));
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth="1" />
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyH}
                  fill={color}
                  rx="0.5"
                />
              </g>
            );
          })}

        {/* SMA overlays */}
        {smaSeries.map((s, si) => {
          const d = s.data
            .map((v, i) => (v == null ? "" : `${i === 0 || s.data[i - 1] == null ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`))
            .join(" ");
          return <path key={si} d={d} fill="none" stroke={SMA_COLORS[si % SMA_COLORS.length]} strokeWidth="1.2" opacity="0.9" />;
        })}

        {/* Volume */}
        {showVolume &&
          candles.map((c, i) => {
            const vH = (c.volume / maxVol) * (volH - 6);
            const bull = c.close >= c.open;
            return (
              <rect
                key={i}
                x={xOf(i) - candleW / 2}
                y={height - PAD.bottom - vH}
                width={candleW}
                height={vH}
                fill={bull ? "#00C853" : "#FF3B5C"}
                opacity="0.28"
              />
            );
          })}

        {/* Crosshair */}
        {hovered && hover != null && (
          <g>
            <line
              x1={xOf(hover)}
              x2={xOf(hover)}
              y1={PAD.top}
              y2={height - PAD.bottom}
              stroke="#A0A0A0"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
            <circle cx={xOf(hover)} cy={yOf(hovered.close)} r="3" fill={lineColor} stroke="#0A0A0A" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {/* Tooltip / OHLC readout */}
      {hovered && (
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-x-4 gap-y-0.5 rounded-lg border border-border bg-card/95 px-3 py-1.5 text-[11px] backdrop-blur">
          <Reading label="O" value={hovered.open} />
          <Reading label="H" value={hovered.high} />
          <Reading label="L" value={hovered.low} />
          <Reading label="C" value={hovered.close} highlight={lineColor} />
          <span className="text-muted">
            Vol <span className="tabular text-foreground">{(hovered.volume / 1e6).toFixed(1)}M</span>
          </span>
        </div>
      )}
    </div>
  );
}

function Reading({ label, value, highlight }: { label: string; value: number; highlight?: string }) {
  return (
    <span className="text-muted">
      {label}{" "}
      <span className="tabular font-medium" style={{ color: highlight ?? "#fff" }}>
        {formatPrice(value)}
      </span>
    </span>
  );
}
