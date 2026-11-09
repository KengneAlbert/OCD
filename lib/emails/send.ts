import "server-only";
/**
 * Envoi des emails via l'API transactionnelle Brevo
 * (https://developers.brevo.com/reference/sendtransacemail).
 * Chaque envoi est tracé dans Supabase (email_log + activity_log) si configuré.
 */
import { siteConfig } from "@/config/site";
import { logActivity, logEmail, type EntityType } from "@/lib/db/activity";
import type { EmailContent, EmailTemplateId } from "./templates";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export interface BrevoEnv {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  teamEmail: string;
}

export function getBrevoEnv(): BrevoEnv | null {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const teamEmail = process.env.OCD_TEAM_EMAIL;
  if (!apiKey || !senderEmail || !teamEmail) return null;
  return { apiKey, senderEmail, teamEmail, senderName: process.env.BREVO_SENDER_NAME || siteConfig.name };
}

export interface SendEmailInput {
  template: EmailTemplateId;
  to: { email: string; name?: string };
  content: EmailContent;
  replyTo?: { email: string; name?: string };
  entity?: { type: EntityType; id: string };
  /** Qui déclenche l'envoi (affiché dans le journal). */
  actor?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput, env = getBrevoEnv()): Promise<SendEmailResult> {
  if (!env) return { ok: false, error: "Brevo n'est pas configuré (BREVO_API_KEY, BREVO_SENDER_EMAIL, OCD_TEAM_EMAIL)." };

  let result: SendEmailResult;
  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: { "api-key": env.apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: env.senderName, email: env.senderEmail },
        to: [input.to],
        replyTo: input.replyTo ?? { email: env.teamEmail, name: siteConfig.name },
        subject: input.content.subject,
        htmlContent: input.content.html,
        textContent: input.content.text,
        tags: [input.template],
      }),
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as { messageId?: string };
      result = { ok: true, messageId: json.messageId };
    } else {
      const detail = await res.text().catch(() => "");
      result = { ok: false, error: `Brevo ${res.status} : ${detail.slice(0, 300)}` };
    }
  } catch (error) {
    result = { ok: false, error: error instanceof Error ? error.message : "Erreur réseau" };
  }

  await logEmail({
    entityType: input.entity?.type,
    entityId: input.entity?.id,
    template: input.template,
    toEmail: input.to.email,
    subject: input.content.subject,
    status: result.ok ? "sent" : "failed",
    messageId: result.messageId,
    error: result.error,
  });
  if (input.entity) {
    await logActivity({
      entityType: input.entity.type,
      entityId: input.entity.id,
      action: result.ok ? "email_sent" : "email_failed",
      message: result.ok ? `Email « ${input.content.subject} » envoyé à ${input.to.email}` : `Échec d'envoi à ${input.to.email} : ${result.error}`,
      meta: { template: input.template, to: input.to.email },
      actor: input.actor,
    });
  }
  if (!result.ok) console.error(`[email:${input.template}]`, result.error);
  return result;
}
