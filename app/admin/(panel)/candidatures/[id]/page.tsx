import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, PlayCircle } from "lucide-react";
import { NotesForm, StatusForm } from "@/components/admin/forms";
import { formatDateTime, KeyValue, Panel, StatusBadge, Timeline } from "@/components/admin/ui";
import { candidatureStatusMeta } from "@/lib/admin/status";
import { getEntityActivity } from "@/lib/db/admin-queries";
import { getCandidature } from "@/lib/db/reservations";
import { formatPhone } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Candidature" };

export default async function CandidatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getCandidature(id);
  if (!c) notFound();
  const activity = await getEntityActivity("candidature", id);
  const waText = encodeURIComponent(`Bonjour ${c.full_name.split(" ")[0]}, ici l'équipe OCD Live à propos de ta candidature ${c.reference}.`);

  return (
    <>
      <Link href="/admin/candidatures" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Candidatures
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">{c.reference}</span>
            <StatusBadge status={c.status} kind="candidature" />
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{c.full_name}</h1>
          <p className="mt-2 text-muted-foreground">
            {c.age ? `${c.age} ans · ` : ""}
            {c.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.video_url && (
            <a
              href={c.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ocd-black px-5 text-sm font-semibold text-white hover:bg-ocd-orange hover:text-ocd-black"
            >
              <PlayCircle className="size-4" aria-hidden /> Voir la vidéo
            </a>
          )}
          <a
            href={`https://wa.me/${c.phone_e164.replace(/\D/g, "")}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-semibold text-ocd-black hover:brightness-95"
          >
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Profil">
            <KeyValue
              items={[
                ["WhatsApp", formatPhone(c.phone_country, c.phone_number)],
                ["Email", c.email],
                ["Langues", c.languages.join(", ")],
                ["Disponibilités", c.availability.join(", ")],
                ["Expérience de vente", c.has_sales_experience ? `Oui · ${c.experience_details ?? ""}` : "Non"],
                ["Vidéo", c.video_url],
              ]}
            />
          </Panel>
          <Panel title="Motivation">
            <p className="accent text-xl leading-relaxed">« {c.motivation} »</p>
          </Panel>
          <Panel title="Historique">
            <Timeline items={activity} />
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Statut">
            <p className="mb-4 text-sm text-muted-foreground">{candidatureStatusMeta[c.status].hint}</p>
            <StatusForm kind="candidature" id={c.id} current={c.status} hasEmail={Boolean(c.email)} />
          </Panel>
          <Panel title="Notes internes">
            <NotesForm entity="candidature" id={c.id} notes={c.admin_notes} />
          </Panel>
          <p className="px-2 text-xs text-muted-foreground">Reçue le {formatDateTime(c.created_at)}</p>
        </div>
      </div>
    </>
  );
}
