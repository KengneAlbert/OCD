"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { AfricaGlow } from "@/components/brand/africa-glow";
import { Button } from "@/components/ui/button";

/**
 * Carte Google Maps chargée uniquement à la demande (performance + vie privée :
 * aucun appel à Google tant que le visiteur n'a pas cliqué).
 */
export function MapEmbed({ query, title }: { query: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-surface sm:aspect-video">
      {loaded ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full border-0"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div aria-hidden className="absolute inset-0 flex items-center justify-center opacity-40">
            <AfricaGlow className="w-64" animated={false} />
          </div>
          <MapPin className="relative size-10 text-accent-text" aria-hidden />
          <p className="relative max-w-xs text-sm text-muted-foreground">La carte est chargée depuis Google Maps quand tu cliques.</p>
          <Button className="relative" onClick={() => setLoaded(true)}>
            Afficher la carte
          </Button>
        </div>
      )}
    </div>
  );
}
