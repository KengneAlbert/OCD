"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/shared/icons";
import { siteConfig } from "@/config/site";
import { cn, whatsappLink } from "@/lib/utils";

/** Bouton WhatsApp flottant, présent sur toutes les pages. */
export function WhatsAppFloat() {
  const pathname = usePathname();
  // Dans le tunnel, une barre d'action est collée en bas sur mobile : on remonte le bouton.
  const raised = pathname.startsWith("/reserver");

  return (
    <a
      href={whatsappLink(siteConfig.whatsappNumber, "Bonjour OCD Live 👋, j'ai une question sur les lives.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire à OCD Live sur WhatsApp"
      className={cn(
        "fixed right-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[0_12px_30px_-8px_rgb(22_163_74/0.7)] transition hover:scale-105 hover:bg-whatsapp sm:right-6 sm:bottom-6",
        raised ? "bottom-24" : "bottom-5",
      )}
    >
      <WhatsAppIcon className="size-7" />
      <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#16a34a]/30 [animation-duration:2.5s]" />
    </a>
  );
}
