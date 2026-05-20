import { createAdminClient } from "@/lib/supabase/server";
import KlientiSearch from "./KlientiSearch";

export default async function KlientiPage() {
  const supabase = await createAdminClient();

  const { data: raw } = await supabase
    .from("customers")
    .select("*, reservations(id, status, total_deposit, created_at, castles(name), reservation_days(day), payments(amount))")
    .order("created_at", { ascending: false });

  const customers = (raw ?? []) as unknown as {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    reservations: {
      id: string;
      status: string;
      total_deposit: number;
      created_at: string;
      castles: { name: string };
      reservation_days: { day: string }[];
      payments: { amount: number }[];
    }[];
  }[];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Klienti</h1>
        <p className="text-sm text-gray-500 mt-1">Celkem {customers.length} klientů</p>
      </div>
      <KlientiSearch customers={customers} />
    </div>
  );
}
