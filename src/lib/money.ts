// Money is stored as INTEGER minor units (e.g. centimes DZD) everywhere.
// These helpers convert between user-facing decimal strings and minor units.

export const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Parse a user-entered decimal string (e.g. "1500.50") into minor units
 * (e.g. 150050). Returns null on invalid input.
 */
export function parseMoney(input: string | number): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    return Math.round(input * MINOR_UNITS_PER_MAJOR);
  }
  const trimmed = input.trim().replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return null;
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const parts = trimmed.split(".");
  const whole = parseInt(parts[0] ?? "0", 10);
  const fracStr = (parts[1] ?? "").padEnd(2, "0");
  const frac = parseInt(fracStr, 10);
  const sign = whole < 0 || parts[0]?.startsWith("-") ? -1 : 1;
  return sign * (Math.abs(whole) * MINOR_UNITS_PER_MAJOR + frac);
}

/**
 * Format minor units as a decimal string with 2 decimals, no currency symbol.
 * E.g. 150050 → "1500.50".
 */
export function formatMoneyMinor(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / MINOR_UNITS_PER_MAJOR);
  const frac = abs % MINOR_UNITS_PER_MAJOR;
  return `${sign}${whole}.${frac.toString().padStart(2, "0")}`;
}

/**
 * Format minor units as a locale-aware currency string.
 * Defaults to DZD but is overridable per deployment.
 */
export function formatCurrency(
  minor: number,
  locale: string = "fr-DZ",
  currency: string = "DZD",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / MINOR_UNITS_PER_MAJOR);
}
