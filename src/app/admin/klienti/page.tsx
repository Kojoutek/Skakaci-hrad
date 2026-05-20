import { createAdminClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import ClientAccordion from "./ClientAccordion";

const STATUS_LABEL: Record<string, string> = {
  pending: "Čeká",
  confirmed: "Potvrzeno",
  cancelled: "Zrušeno",
  paid: "Zaplaceno",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50",
  confirmed: "text-sky-600 bg-sky-50",
  cancelled: "text-red-500 bg-red-50",
  paid: "text-green-600 bg-green-50",
};

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

      <div className="space-y-2">
        {customers.length === 0 ? (
          <p className="text-gray-400 text-sm py-10 text-center">Žádní klienti</p>
        ) : (
          customers.map((c) => {
            const returning = c.reservations.length > 1;
            return (
              <ClientAccordion
                key={c.id}
                customer={c}
                returning={returning}
                statusLabel={STATUS_LABEL}
                statusColor={STATUS_COLOR}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
