import "server-only";
import { getServiceClient } from "@/lib/supabase/admin";

export type EntityType = "reservation" | "candidature" | "system";

export interface ActivityInput {
  entityType: EntityType;
  entityId?: string;
  action: string;
  message: string;
  meta?: Record<string, unknown>;
  actor?: string;
}

/** Journal de traçabilité. Ne lève jamais d'erreur : un log raté ne doit pas casser l'action. */
export async function logActivity(input: ActivityInput): Promise<void> {
  const db = getServiceClient();
  if (!db) return;
  const { error } = await db.from("activity_log").insert({
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    message: input.message,
    meta: input.meta ?? {},
    actor: input.actor ?? "système",
  });
  if (error) console.error("[activity_log]", error.message);
}

export interface EmailLogInput {
  entityType?: EntityType;
  entityId?: string;
  template: string;
  toEmail: string;
  subject: string;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
}

export async function logEmail(input: EmailLogInput): Promise<void> {
  const db = getServiceClient();
  if (!db) return;
  const { error } = await db.from("email_log").insert({
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    template: input.template,
    to_email: input.toEmail,
    subject: input.subject,
    status: input.status,
    message_id: input.messageId ?? null,
    error: input.error ?? null,
  });
  if (error) console.error("[email_log]", error.message);
}
