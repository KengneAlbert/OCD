import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/admin/auth";
import { countPendingLives } from "@/lib/db/lives";
import { getServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  // Compteurs « à traiter » dans la navigation (réservations payées à préparer).
  const db = getServiceClient();
  const [res, cand] = db
    ? await Promise.all([
        db.from("reservations").select("id", { count: "exact", head: true }).eq("status", "payee"),
        db.from("candidatures").select("id", { count: "exact", head: true }).eq("status", "nouvelle"),
      ])
    : [{ count: 0 }, { count: 0 }];
  const livesPending = await countPendingLives();

  return (
    <div className="lg:flex">
      <AdminSidebar email={admin.email} badges={{ reservations: res.count ?? 0, candidatures: cand.count ?? 0, lives: livesPending }} />
      <main id="contenu" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
