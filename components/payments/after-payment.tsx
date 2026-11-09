import { CalendarPlus, CheckCircle2, Clock, MapPin, Package, ReceiptText, Smartphone, Wifi } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatTimeFr, timeToMinutes, minutesToTime } from "@/lib/schedule";

interface AfterPaymentProps {
  token: string;
  firstName: string;
  liveType: "presentiel" | "distance";
  slotStart: string;
  reference: string;
}

/** Ce que le client voit une fois payé : agenda + ce qu'il faut préparer selon le type de live. */
export function AfterPayment({ token, firstName, liveType, slotStart, reference }: AfterPaymentProps) {
  const presentiel = liveType === "presentiel";
  const arrival = formatTimeFr(minutesToTime(Math.max(0, timeToMinutes(slotStart) - 30)));
  const address = [siteConfig.studio.street, siteConfig.studio.district, siteConfig.studio.city].join(", ");

  const prepare = presentiel
    ? [
        { icon: Clock, title: `Arrive à ${arrival}`, text: "30 minutes avant ton créneau, pour l'installation. Tout retard est décompté du live." },
        { icon: MapPin, title: siteConfig.studio.name, text: address },
        { icon: Package, title: "Apporte tes produits", text: "Propres, rangés, faciles à montrer à la caméra, avec tes prix et tes promos du jour." },
        { icon: ReceiptText, title: "Ton pitch", text: "3 phrases : qui tu es, ce que tu vends, pourquoi te choisir. Et ton numéro WhatsApp en grand." },
      ]
    : [
        { icon: Wifi, title: "Test de connexion", text: "L'équipe te contacte sur WhatsApp avant le jour J pour tester ta connexion avec toi." },
        { icon: Smartphone, title: "Téléphone prêt", text: "Chargé et branché, en 4G ou wifi stable, posé sur un support face à toi." },
        { icon: Package, title: "Tes produits à portée de main", text: "Rangés, avec tes prix et tes promos du jour. Mets-toi face à la lumière, jamais dos à une fenêtre." },
        { icon: ReceiptText, title: "Ton pitch", text: "3 phrases : qui tu es, ce que tu vends, pourquoi te choisir. Et ton numéro WhatsApp en grand." },
      ];

  return (
    <div className="space-y-6">
      <div role="status" className="rounded-3xl bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <p className="mt-3 text-xl font-semibold">Paiement reçu, ta réservation est validée</p>
        <p className="mt-1 text-muted-foreground">La confirmation t&apos;a été envoyée par email. Référence : {reference}.</p>
        <a
          href={`/api/agenda/${token}`}
          download
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-ocd-black px-6 font-semibold text-white transition hover:bg-ocd-orange hover:text-ocd-black dark:bg-white dark:text-ocd-black"
        >
          <CalendarPlus className="size-5" aria-hidden />
          Ajouter à mon agenda
        </a>
        <p className="mt-2 text-xs text-muted-foreground">Google Agenda, Calendrier (iPhone), Outlook · rappel la veille inclus</p>
      </div>

      <section aria-labelledby="preparer" className="rounded-3xl border border-border bg-card p-6">
        <h2 id="preparer" className="text-lg font-semibold">
          {firstName}, prépare ton live {presentiel ? "au studio" : "à distance"}
        </h2>
        <ul className="mt-4 space-y-4">
          {prepare.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-ocd-orange/15 text-ocd-orange-dark dark:text-ocd-orange">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
