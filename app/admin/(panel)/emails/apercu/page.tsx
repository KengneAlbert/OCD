import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTitle } from "@/components/admin/ui";
import { renderSample } from "@/lib/emails/samples";
import { EMAIL_TEMPLATES, type EmailTemplateId } from "@/lib/emails/templates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Aperçu d'email" };

const isTemplate = (v: unknown): v is EmailTemplateId => typeof v === "string" && v in EMAIL_TEMPLATES;

export default async function EmailPreviewPage({ searchParams }: { searchParams: Promise<{ t?: string; v?: string }> }) {
  const { t, v } = await searchParams;
  const id: EmailTemplateId = isTemplate(t) ? t : "reservation-recue";
  const content = renderSample(id);
  const meta = EMAIL_TEMPLATES[id];
  const view = v === "texte" ? "texte" : v === "mobile" ? "mobile" : "desktop";

  return (
    <>
      <Link href="/admin/emails" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Emails
      </Link>
      <PageTitle eyebrow={`${meta.audience} · ${meta.trigger}`} title={meta.label}>
        <div className="flex rounded-full border border-border p-1 text-sm">
          {(["desktop", "mobile", "texte"] as const).map((m) => (
            <Link key={m} href={`?t=${id}&v=${m}`} className={cn("rounded-full px-4 py-1.5 capitalize", view === m && "bg-foreground text-background")}>
              {m === "texte" ? "Texte brut" : m}
            </Link>
          ))}
        </div>
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="Gabarits" className="order-2 lg:order-1">
          <ul className="space-y-1">
            {(Object.keys(EMAIL_TEMPLATES) as EmailTemplateId[]).map((k) => (
              <li key={k}>
                <Link
                  href={`?t=${k}&v=${view}`}
                  aria-current={k === id ? "page" : undefined}
                  className={cn("block rounded-xl px-3 py-2 text-sm", k === id ? "bg-ocd-black text-white" : "hover:bg-muted")}
                >
                  {EMAIL_TEMPLATES[k].label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-1 min-w-0 lg:order-2">
          <div className="mb-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
            <span className="text-muted-foreground">Objet : </span>
            <span className="font-semibold">{content.subject}</span>
          </div>
          {view === "texte" ? (
            <pre className="overflow-x-auto rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed whitespace-pre-wrap">{content.text}</pre>
          ) : (
            <div className={cn("mx-auto overflow-hidden rounded-3xl border border-border bg-[#F4EFE7]", view === "mobile" ? "max-w-[390px]" : "max-w-[720px]")}>
              <iframe title={`Aperçu : ${meta.label}`} srcDoc={content.html} sandbox="allow-popups" className="h-[80vh] w-full border-0" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
