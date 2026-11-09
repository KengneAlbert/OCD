import type { CandidatureStatus, ReservationStatus } from "@/lib/admin/status";

/** Lignes telles que stockées dans Supabase (snake_case). */
export interface ReservationRow {
  id: string;
  reference: string;
  status: ReservationStatus;
  live_type: "presentiel" | "distance";
  live_date: string;
  slot_start: string;
  slot_end: string;
  package_id: string;
  package_name: string;
  package_price: number;
  full_name: string;
  business_name: string;
  category: string;
  category_other: string | null;
  product_description: string;
  product_count: string | null;
  phone_country: string;
  phone_number: string;
  phone_e164: string;
  email: string | null;
  country: string | null;
  city: string | null;
  shop_address: string | null;
  tiktok: string | null;
  facebook: string | null;
  instagram: string | null;
  special_needs: string | null;
  visitor_timezone: string | null;
  channel: string;
  admin_notes: string | null;
  /** Jeton du lien de paiement (migration 0002). */
  pay_token?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidatureRow {
  id: string;
  reference: string;
  status: CandidatureStatus;
  full_name: string;
  age: number | null;
  location: string | null;
  phone_country: string;
  phone_number: string;
  phone_e164: string;
  email: string | null;
  languages: string[];
  availability: string[];
  has_sales_experience: boolean | null;
  experience_details: string | null;
  video_url: string | null;
  motivation: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: number;
  entity_type: string;
  entity_id: string | null;
  action: string;
  message: string;
  meta: Record<string, unknown>;
  actor: string;
  created_at: string;
}

export interface EmailLogRow {
  id: number;
  entity_type: string | null;
  entity_id: string | null;
  template: string;
  to_email: string;
  subject: string;
  status: "sent" | "failed";
  message_id: string | null;
  error: string | null;
  created_at: string;
}
