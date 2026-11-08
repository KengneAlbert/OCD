import Link from "next/link";
import { AfricaGlow } from "@/components/brand/africa-glow";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <AfricaGlow className="mb-8 w-48" />
      <p className="font-display text-sm font-bold tracking-widest text-accent-text uppercase">Erreur 404</p>
      <h1 className="mt-2 text-4xl font-extrabold">Cette page n&apos;est pas en live</h1>
      <p className="mt-3 text-muted-foreground">La page que tu cherches n&apos;existe pas ou a été déplacée.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/reserver">Réserver mon live</Link>
        </Button>
      </div>
    </div>
  );
}
