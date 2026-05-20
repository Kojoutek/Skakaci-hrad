export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReservationActions from "../ReservationActions";
import PaymentButton from "../PaymentButton";
import BlockedDaysManager from "../BlockedDaysManager";
import type { ReservationStatus } from "@/lib/supabase/types";

type Payment = { amount: number; paid_at: string };

type Reservation = {
  id: string;
  status: ReservationStatus;
  total_deposit: number;
  note: string | null;
  admin_note: string | null;
  created_at: string;
  customers: { name: string; email: string; phone: string };
  reservation_days: { day: string }[];
  castles: { name: string };
  payments: Payment[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Čeká",
  confirmed: "Potvrzeno",
  cancelled: "Zrušeno",
  paid: "Zaplaceno",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  paid: "outline",
};

function ReservationCard({ r }: { r: Reservation }) {
  const days = r.reservation_days
    .map((d) => parseISO(d.day))
    .sort((a, b) => a.getTime() - b.getTime());

  return (
    <div className="border rounded-xl p-4 bg-white space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{r.customers.name}</p>
          <p className="text-sm text-gray-500">{r.customers.email} · {r.customers.phone}</p>
        </div>
        <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
      </div>
      <div className="text-sm space-y-0.5">
        <p className="font-medium text-gray-700">{r.castles.name}</p>
        {days.map((d) => (
          <p key={d.toISOString()} className="text-gray-500">
            {format(d, "EEEE d. MMMM yyyy", { locale: cs })}
          </p>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-sky-700">Záloha: {r.total_deposit} Kč</span>
        <span className="text-xs text-gray-400">{format(parseISO(r.created_at), "d.M.yyyy HH:mm")}</span>
      </div>
      {r.note && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">Poznámka: {r.note}</p>
      )}
      {r.admin_note && (
        <p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-2">Interní poznámka: {r.admin_note}</p>
      )}
      {r.status === "pending" && <ReservationActions reservationId={r.id} />}
      {r.status === "confirmed" && (
        <PaymentButton reservationId={r.id} existingPayments={r.payments} />
      )}
      {r.status === "paid" && (
        <p className="text-sm font-medium text-green-700 bg-green-50 rounded-lg p-2">
          Zaplaceno: {r.payments.reduce((s, p) => s + p.amount, 0).toLocaleString("cs")} Kč
        </p>
      )}
    </div>
  );
}

export default async function RezervacePage() {
  const supabase = await createAdminClient();
  const [{ data: raw }, { data: blockedRaw }] = await Promise.all([
    supabase
      .from("reservations")
      .select("*, customers(*), reservation_days(*), castles(name), payments(*)")
      .order("created_at", { ascending: false }),
    supabase.from("blocked_days").select("day"),
  ]);

  const blockedDays = (blockedRaw ?? []).map((d) => (d as unknown as { day: string }).day);

  const all = (raw ?? []) as unknown as Reservation[];
  const pending = all.filter((r) => r.status === "pending");
  const confirmed = all.filter((r) => r.status === "confirmed");
  const cancelled = all.filter((r) => r.status === "cancelled");
  const paid = all.filter((r) => r.status === "paid");

  const tabs = [
    { key: "pending", label: "Čekající", list: pending, color: "text-amber-600" },
    { key: "confirmed", label: "Potvrzené", list: confirmed, color: "text-sky-600" },
    { key: "paid", label: "Zaplacené", list: paid, color: "text-green-600" },
    { key: "cancelled", label: "Zrušené", list: cancelled, color: "text-red-500" },
  ] as const;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rezervace</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          {tabs.map(({ label, list, color }) => (
            <span key={label}>
              <span className={`font-bold ${color}`}>{list.length}</span> {label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      <BlockedDaysManager blockedDays={blockedDays} />

      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          {tabs.map(({ key, label, list }) => (
            <TabsTrigger key={key} value={key} className="flex-1">
              {label} ({list.length})
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(({ key, list }) => (
          <TabsContent key={key} value={key}>
            {list.length === 0 ? (
              <p className="text-gray-400 text-sm py-10 text-center">Žádné rezervace</p>
            ) : (
              <div className="space-y-3 mt-4">
                {list.map((r) => <ReservationCard key={r.id} r={r} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
