import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader, Section } from "@/components/layout/page-header";
import { ContactForm } from "@/components/shared/contact-form";
import { WhatsAppIcon } from "@/components/shared/icons";
import { siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacte OCD Live sur WhatsApp, par téléphone ou par email. Studio de lives de vente à Lomé, Togo.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { studio } = siteConfig;
  const items = [
    {
      icon: WhatsAppIcon,
      title: "WhatsApp",
      value: "Le plus rapide pour nous joindre",
      href: whatsappLink(siteConfig.whatsappNumber, "Bonjour OCD Live 👋"),
      external: true,
    },
    { icon: Phone, title: "Téléphone", value: siteConfig.phoneDisplay, href: `tel:+${siteConfig.whatsappNumber}` },
    { icon: Mail, title: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
    { icon: MapPin, title: "Studio", value: `${studio.street}, ${studio.city}, ${studio.country}`, href: "/studio#adresse" },
    { icon: Clock, title: "Horaires", value: studio.hours },
  ];

  return (
    <>
      <PageHeader eyebrow="Contact" title="Parlons de ton live" description="Une question sur les packages, le studio ou le live à distance ? L'équipe te répond vite." />
      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <ul className="space-y-3">
            {items.map((item) => {
              const content = (
                <>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ocd-orange/15 text-accent-text">
                    <item.icon className="size-6" />
                  </span>
                  <span>
                    <span className="block font-bold">{item.title}</span>
                    <span className="text-muted-foreground">{item.value}</span>
                  </span>
                </>
              );
              const cls = "flex items-center gap-4 rounded-3xl border border-border bg-card p-5";
              return (
                <li key={item.title}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className={`${cls} transition hover:border-ocd-orange`}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {content}
                    </a>
                  ) : (
                    <div className={cls}>{content}</div>
                  )}
                </li>
              );
            })}
            <li className="rounded-3xl border border-border bg-card p-5">
              <p className="mb-3 font-bold">Réseaux sociaux</p>
              <div className="flex flex-wrap gap-2">
                {siteConfig.socials.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-ocd-orange"
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            </li>
          </ul>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
