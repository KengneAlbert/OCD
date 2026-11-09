import { paymentCountries } from "@/config/payment-methods";
import { cn } from "@/lib/utils";

/**
 * Pastilles des moyens de paiement couverts par Swinmo (voir config/payment-methods.ts).
 * Dessinées en CSS aux couleurs des marques : pour utiliser les logos officiels,
 * déposer les fichiers dans public/paiement/ et renseigner `src` ci-dessous.
 */
const BRANDS: { id: string; label: string; src?: string; className: string; content: React.ReactNode }[] = [
  {
    id: "tmoney",
    label: "T-Money",
    className: "bg-[#FFD200] text-[#00387B]",
    content: <span className="font-black tracking-tight">T-Money</span>,
  },
  {
    id: "moov",
    label: "Moov Money",
    className: "bg-[#0063AF] text-white",
    content: (
      <span className="font-black tracking-tight">
        moov<span className="text-[#F28E1C]">money</span>
      </span>
    ),
  },
  {
    id: "orange",
    label: "Orange Money",
    className: "bg-black text-white",
    content: (
      <span className="flex items-center gap-1 font-bold">
        <span aria-hidden className="size-2.5 bg-[#FF7900]" />
        Orange Money
      </span>
    ),
  },
  {
    id: "mtn",
    label: "MTN Mobile Money",
    className: "bg-[#FFCB05] text-black",
    content: <span className="font-black tracking-tight">MTN MoMo</span>,
  },
  {
    id: "wave",
    label: "Wave",
    className: "bg-[#1DC8F2] text-white",
    content: <span className="font-black tracking-tight lowercase">wave</span>,
  },
  {
    id: "visa",
    label: "Visa",
    className: "bg-white text-[#1A1F71] ring-1 ring-black/10",
    content: <span className="font-black tracking-tight italic">VISA</span>,
  },
  {
    id: "mastercard",
    label: "Mastercard",
    className: "bg-white ring-1 ring-black/10",
    content: (
      <span aria-hidden className="flex">
        <span className="size-3.5 rounded-full bg-[#EB001B]" />
        <span className="-ml-1.5 size-3.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    ),
  },
];

export function PaymentLogos({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <ul aria-label="Moyens de paiement acceptés" className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      {BRANDS.map((b) => (
        <li
          key={b.id}
          title={b.label}
          className={cn(
            "inline-flex items-center justify-center rounded-md shadow-sm",
            size === "sm" ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-[11px]",
            b.className,
          )}
        >
          {b.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.src} alt={b.label} className="h-4 w-auto" />
          ) : (
            <>
              {b.content}
              <span className="sr-only">{b.label}</span>
            </>
          )}
        </li>
      ))}
      <li className={cn("text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs")}>{paymentCountries.length} pays</li>
    </ul>
  );
}
