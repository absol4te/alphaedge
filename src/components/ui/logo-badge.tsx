import { cn } from "@/lib/utils";

/** Colored monogram tile used in place of real company logos. */
export function LogoBadge({
  symbol,
  color,
  size = 36,
  className,
}: {
  symbol: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-bold text-black",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        fontSize: size * 0.36,
      }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}
