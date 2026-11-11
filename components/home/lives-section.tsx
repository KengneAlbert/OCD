import { Section } from "@/components/layout/page-header";
import { SubscribeCta } from "@/components/lives/directory";
import { LivesNow } from "@/components/lives/lives-now";

/** Accueil : les vendeurs en live maintenant + bloc abonnement. */
export function LivesSection() {
  return (
    <Section
      id="lives"
      eyebrow="🔴 En direct maintenant"
      title={
        <>
          Trouve un vendeur <span className="accent">en live.</span>
        </>
      }
    >
      <LivesNow limit={10} />
      <div className="mt-10">
        <SubscribeCta />
      </div>
    </Section>
  );
}
