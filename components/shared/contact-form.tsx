"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WhatsAppIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { siteConfig } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const schema = z.object({
  name: z.string().trim().min(2, "Indique ton nom."),
  message: z.string().trim().min(5, "Écris ton message (5 caractères minimum).").max(1000, "1000 caractères maximum."),
});
type Values = z.infer<typeof schema>;

/** Message libre → WhatsApp. */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", message: "" } });

  const onSubmit = (v: Values) => {
    const text = `💬 *MESSAGE DEPUIS LE SITE OCD LIVE*\n\n👤 Nom : ${v.name}\n📝 Message : ${v.message}`;
    const url = buildWhatsAppUrl(siteConfig.whatsappNumber, text);
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else window.location.href = url;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-3xl border border-border bg-card p-6 glow-card sm:p-8">
      <h2 className="text-2xl font-extrabold">Écris-nous</h2>
      <Field id="contact-name" label="Ton nom" required error={errors.name?.message}>
        {(p) => <Input {...p} autoComplete="name" {...register("name")} />}
      </Field>
      <Field id="contact-message" label="Ton message" required error={errors.message?.message}>
        {(p) => <Textarea {...p} rows={5} placeholder="Ta question sur les lives, les packages, le studio…" {...register("message")} />}
      </Field>
      <Button type="submit" variant="whatsapp" size="lg" className="w-full">
        <WhatsAppIcon />
        Envoyer sur WhatsApp
      </Button>
    </form>
  );
}
