import { createAdminClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReservationActions from "./ReservationActions";
import type { ReservationStatus } from "@/lib/supabase/types";

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

export default async function AdminPage() {
  const supabase = await createAdminClient();

  const { data: rawReservations } = await supabase
    .from("reservations")
    .select("*, customers(*), reservation_days(*), castles(name)")
    .order("created_at", { ascending: false });

  const all = (rawReservations ?? []) as unknown as ReservationWithRelations[];
  const pending = all.filter((r) => r.status === "pending");
  const confirmed = all.filter((r) => r.status === "confirmed");
  const cancelled = all.filter((r) => r.status === "cancelled");

  const totalEarnings = confirmed.reduce((sum, r) => sum + r.total_deposit, 0);
  const pendingAmount = pending.reduce((sum, r) => sum + r.total_deposit, 0);

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

      {/* Rezervace */}
      <Card>
        <CardHeader>
          <CardTitle>Rezervace</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Čekající ({pending.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                Potvrzené ({confirmed.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Zrušené ({cancelled.length})
              </TabsTrigger>
              <TabsTrigger value="all">Vše ({all.length})</TabsTrigger>
            </TabsList>

            {(["pending", "confirmed", "cancelled", "all"] as const).map((tab) => {
              const list =
                tab === "pending"
                  ? pending
                  : tab === "confirmed"
                  ? confirmed
                  : tab === "cancelled"
                  ? cancelled
                  : all;
              return (
                <TabsContent key={tab} value={tab}>
                  {list.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4 text-center">
                      Žádné rezervace
                    </p>
                  ) : (
                    <div className="space-y-4 mt-4">
                      {list.map((r) => {
                        const customer = r.customers;
                        const days = r.reservation_days
                          .map((d) => parseISO(d.day))
                          .sort((a, b) => a.getTime() - b.getTime());
                        const castle = r.castles;
                        return (
                          <div
                            key={r.id}
                            className="border rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold">{customer.name}</p>
                                <p className="text-sm text-gray-500">
                                  {customer.email} · {customer.phone}
                                </p>
                              </div>
                              <Badge variant={STATUS_VARIANT[r.status]}>
                                {STATUS_LABEL[r.status]}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-0.5">
                              <p className="font-medium text-gray-800">
                                {castle.name}
                              </p>
                              {days.map((d) => (
                                <p key={d.toISOString()}>
                                  {format(d, "EEEE d. MMMM yyyy", {
                                    locale: cs,
                                  })}
                                </p>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sky-700">
                                Záloha: {r.total_deposit} Kč
                              </p>
                              <p className="text-xs text-gray-400">
                                {format(
                                  parseISO(r.created_at),
                                  "d.M.yyyy HH:mm"
                                )}
                              </p>
                            </div>
                            {r.note && (
                              <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                                Poznámka zákazníka: {r.note}
                              </p>
                            )}
                            {r.admin_note && (
                              <p className="text-sm text-gray-600 bg-yellow-50 rounded p-2">
                                Interní poznámka: {r.admin_note}
                              </p>
                            )}
                            {r.status === "pending" && (
                              <ReservationActions reservationId={r.id} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
