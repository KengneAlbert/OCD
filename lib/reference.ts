/** Alphabet sans caractères ambigus (0/O, 1/I/L) pour dicter la référence au téléphone. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const RESERVATION_REF_RE = /^OCD-[A-Z0-9]{6}$/;
export const CANDIDATURE_REF_RE = /^CAND-[A-Z0-9]{6}$/;

function defaultRandomValues(length: number): Uint32Array {
  const values = new Uint32Array(length);
  globalThis.crypto.getRandomValues(values);
  return values;
}

/** Génère une référence unique, ex. « OCD-7KQ2MX ». */
export function generateReference(
  prefix = "OCD",
  length = 6,
  random: (length: number) => ArrayLike<number> = defaultRandomValues,
): string {
  const values = random(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[(values[i] ?? 0) % ALPHABET.length];
  }
  return `${prefix}-${code}`;
}
