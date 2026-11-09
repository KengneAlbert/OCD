import { NextResponse } from "next/server";
import { getCategoryLabel } from "@/config/categories";
import { getAdmin } from "@/lib/admin/auth";
import { parseReservationFilters } from "@/lib/admin/filters";
import { reservationStatusMeta } from "@/lib/admin/status";
import { logActivity } from "@/lib/db/activity";
import { exportReservations } from "@/lib/db/admin-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Échappement CSV + neutralisation des formules (=, +, -, @) pour Excel. */
function cell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** GET /admin/export : export CSV des réservations (filtres de la liste). */
export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const rows = await exportReservations(parseReservationFilters(sp));

  const header = [
    "Référence", "Statut", "Date du live", "Début", "Fin", "Type", "Package", "Prix (FCFA)",
    "Nom", "Business", "WhatsApp", "Email", "Catégorie", "Ville", "Pays", "Reçue le", "Notes",
  ];
  const lines = rows.map((r) =>
    [
      r.reference,
      reservationStatusMeta[r.status]?.label ?? r.status,
      r.live_date,
      r.slot_start,
      r.slot_end,
      r.live_type === "presentiel" ? "Studio" : "Distance",
      r.package_name,
      r.package_price,
      r.full_name,
      r.business_name,
      r.phone_e164,
      r.email,
      getCategoryLabel(r.category, r.category_other ?? undefined),
      r.city,
      r.country,
      r.created_at,
      r.admin_notes,
    ]
      .map(cell)
      .join(";"),
  );

  await logActivity({ entityType: "system", action: "export", message: `Export CSV de ${rows.length} réservation(s)`, actor: admin.email });

  // BOM UTF-8 + séparateur « ; » : s'ouvre correctement dans Excel en français.
  const csv = `﻿${[header.map(cell).join(";"), ...lines].join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-ocd-live-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
