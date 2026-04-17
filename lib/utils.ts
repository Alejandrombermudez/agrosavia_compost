import type { Stats } from "@/types";

export function toFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n =
    typeof v === "string" ? parseFloat(v.replace(",", ".")) : Number(v);
  return isNaN(n) ? null : n;
}

export function calcStats(
  values: (number | null | undefined)[],
  filterZero = false
): Stats | null {
  const clean = values.filter(
    (v): v is number =>
      v !== null && v !== undefined && !isNaN(v) && (!filterZero || v > 0.01)
  );
  if (!clean.length) return null;
  const avg = clean.reduce((a, b) => a + b, 0) / clean.length;
  const variance =
    clean.length > 1
      ? clean.reduce((a, b) => a + (b - avg) ** 2, 0) / (clean.length - 1)
      : 0;
  return {
    avg,
    min: Math.min(...clean),
    max: Math.max(...clean),
    std: Math.sqrt(variance),
    count: clean.length,
  };
}

export function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined) return "N/A";
  return n.toFixed(decimals);
}

export function normalizeDate(fecha: string): string {
  if (!fecha) return fecha;
  const match = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return fecha;
}

export function fmtDateLabel(fecha: string): string {
  const normalized = normalizeDate(fecha);
  const parts = normalized.split("-");
  if (parts.length !== 3) return fecha;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
}
