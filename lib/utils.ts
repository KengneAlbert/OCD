import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 15000 → « 15 000 » (espace insécable). */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 15000 → « 15 000 FCFA ». */
export function formatPrice(value: number, currency = "FCFA"): string {
  return `${formatNumber(value)} ${currency}`;
}

/** Garde uniquement les chiffres d'un numéro saisi. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Lien WhatsApp générique (bouton flottant, contact). */
export function whatsappLink(number: string, text?: string): string {
  const base = `https://wa.me/${digitsOnly(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
