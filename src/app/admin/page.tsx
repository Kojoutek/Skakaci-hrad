import { createAdminClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReservationActions from "./ReservationActions";
import PaymentButton from "./PaymentButton";
import type { ReservationStatus } from "@/lib/supabase/types";

type Payment = { amount: number; paid_at: string };

type ReservationWithRelations = {
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
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
};

function ReservationCard({ r }: { r: ReservationWithRelations }) {
  const customer = r.customers;
  const days = r.reservation_days
    .map((d) => parseISO(d.day))
    .sort((a, b) => a.getTime() - b.getTime());
  const castle = r.castles;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{customer.name}</p>
          <p className="text-sm text-gray-500">{customer.email} · {customer.phone}</p>
        </div>
        <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
      </div>
      <div className="text-sm text-gray-600 space-y-0.5">
        <p className="font-medium text-gray-800">{castle.name}</p>
        {days.map((d) => (
          <p key={d.toISOString()}>{format(d, "EEEE d. MMMM yyyy", { locale: cs })}</p>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sky-700">Záloha: {r.total_deposit} Kč</p>
        <p className="text-xs text-gray-400">{format(parseISO(r.created_at), "d.M.yyyy HH:mm")}</p>
      </div>
      {r.note && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">Poznámka: {r.note}</p>
      )}
      {r.admin_note && (
        <p className="text-sm text-gray-600 bg-yellow-50 rounded p-2">Interní poznámka: {r.admin_note}</p>
      )}
      {r.status === "pending" && <ReservationActions reservationId={r.id} />}
      {r.status === "confirmed" && (
        <PaymentButton reservationId={r.id} existingPayments={r.payments} />
      )}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createAdminClient();

  const { data: rawReservations } = await supabase
    .from("reservations")
    .select("*, customers(*), reservation_days(*), castles(name), payments(*)")
    .order("created_at", { ascending: false });

  const all = (rawReservations ?? []) as unknown as ReservationWithRelations[];
  const pending = all.filter((r) => r.status === "pending");
  const confirmed = all.filter((r) => r.status === "confirmed");
  const cancelled = all.filter((r) => r.status === "cancelled");

  const totalEarnings = confirmed.reduce((sum, r) => sum + r.total_deposit, 0);
  const pendingAmount = pending.reduce((sum, r) => sum + r.total_deposit, 0);

  // Klienti
  const { data: rawCustomers } = await supabase
    .from("customers")
    .select("*, reservations(id, status, created_at, castles(name))")
    .order("created_at", { ascending: false });

  const customers = (rawCustomers ?? []) as unknown as {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
    reservations: { id: string; status: string; created_at: string; castles: { name: string } }[];
  }[];

  // Bilance
  const { data: rawCastles } = await supabase
    .from("castles")
    .select("id, name, purchase_price, reservations(id, status, payments(amount))")
    .eq("active", true);

  const castles = (rawCastles ?? []) as unknown as {
    id: string;
    name: string;
    purchase_price: number;
    reservations: { id: string; status: string; payments: { amount: number }[] }[];
  }[];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Statistiky */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Celkem rezervací</p>
            <p className="text-3xl font-bold">{all.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Čeká na potvrzení</p>
            <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Potvrzených záloh</p>
            <p className="text-3xl font-bold text-green-600">{totalEarnings} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Čekající zálohy</p>
            <p className="text-3xl font-bold text-sky-600">{pendingAmount} Kč</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">Čekající ({pending.length})</TabsTrigger>
          <TabsTrigger value="confirmed" className="flex-1">Potvrzené ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1">Zrušené ({cancelled.length})</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">Vše ({all.length})</TabsTrigger>
          <TabsTrigger value="clients" className="flex-1">Klienti ({customers.length})</TabsTrigger>
          <TabsTrigger value="balance" className="flex-1">Bilance</TabsTrigger>
        </TabsList>

        {/* Rezervace */}
        {(["pending", "confirmed", "cancelled", "all"] as const).map((tab) => {
          const list = tab === "pending" ? pending : tab === "confirmed" ? confirmed : tab === "cancelled" ? cancelled : all;
          return (
            <TabsContent key={tab} value={tab}>
              {list.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center">Žádné rezervace</p>
              ) : (
                <div className="space-y-4 mt-4">
                  {list.map((r) => <ReservationCard key={r.id} r={r} />)}
                </div>
              )}
            </TabsContent>
          );
        })}

        {/* Klienti */}
        <TabsContent value="clients">
          <div className="space-y-3 mt-4">
            {customers.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Žádní klienti</p>
            ) : customers.map((c) => {
              const reservationCount = c.reservations.length;
              const returning = reservationCount > 1;
              return (
                <div key={c.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{c.name}</p>
                        {returning && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                            Vracející se
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{c.email} · {c.phone}</p>
                    </div>
                    <p className="text-sm text-gray-400 shrink-0">
                      {format(parseISO(c.created_at), "d.M.yyyy")}
                    </p>
                  </div>
                  {reservationCount > 0 && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{reservationCount}× rezervace:</p>
                      {c.reservations.map((res) => (
                        <p key={res.id} className="text-xs text-gray-500">
                          {format(parseISO(res.created_at), "d.M.yyyy")} · {res.castles.name} ·{" "}
                          <span className={res.status === "confirmed" ? "text-green-600" : res.status === "cancelled" ? "text-red-500" : "text-amber-600"}>
                            {STATUS_LABEL[res.status]}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Bilance */}
        <TabsContent value="balance">
          <div className="space-y-4 mt-4">
            {castles.map((castle) => {
              const totalEarned = castle.reservations
                .flatMap((r) => r.payments)
                .reduce((s, p) => s + p.amount, 0);
              const profit = totalEarned - castle.purchase_price;
              return (
                <Card key={castle.id}>
                  <CardHeader>
                    <CardTitle>{castle.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Pořizovací cena</p>
                        <p className="text-xl font-bold text-gray-800">{castle.purchase_price.toLocaleString("cs")} Kč</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Celkový výdělek</p>
                        <p className="text-xl font-bold text-green-700">{totalEarned.toLocaleString("cs")} Kč</p>
                      </div>
                      <div className={`rounded-lg p-3 ${profit >= 0 ? "bg-sky-50" : "bg-red-50"}`}>
                        <p className="text-xs text-gray-500 mb-1">Bilance</p>
                        <p className={`text-xl font-bold ${profit >= 0 ? "text-sky-700" : "text-red-600"}`}>
                          {profit >= 0 ? "+" : ""}{profit.toLocaleString("cs")} Kč
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      Výdělek zahrnuje pouze ručně zaznamenané platby klientů.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
