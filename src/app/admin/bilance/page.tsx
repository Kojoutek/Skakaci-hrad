import { createAdminClient } from "@/lib/supabase/server";
import { parseISO, format } from "date-fns";
import { cs } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BilanceCharts from "./BilanceCharts";

export default async function BalancePage() {
  const supabase = await createAdminClient();

  const { data: rawCastles } = await supabase
    .from("castles")
    .select("id, name, purchase_price, reservations(id, status, total_deposit, created_at, payments(amount, paid_at))")
    .eq("active", true);

  const castles = (rawCastles ?? []) as unknown as {
    id: string;
    name: string;
    purchase_price: number;
    reservations: {
      id: string;
      status: string;
      total_deposit: number;
      created_at: string;
      payments: { amount: number; paid_at: string }[];
    }[];
  }[];

  // Agregace dat pro grafy
  const allPayments = castles.flatMap((c) =>
    c.reservations.flatMap((r) =>
      r.payments.map((p) => ({ ...p, castle: c.name }))
    )
  );

  // Výdělek po měsících
  const byMonth: Record<string, number> = {};
  for (const p of allPayments) {
    const key = format(parseISO(p.paid_at), "MM/yyyy");
    byMonth[key] = (byMonth[key] ?? 0) + p.amount;
  }
  const monthlyData = Object.entries(byMonth)
    .sort(([a], [b]) => {
      const [am, ay] = a.split("/").map(Number);
      const [bm, by] = b.split("/").map(Number);
      return ay !== by ? ay - by : am - bm;
    })
    .map(([month, amount]) => ({ month, amount }));

  // Status rezervací
  const allReservations = castles.flatMap((c) => c.reservations);
  const statusCounts = {
    pending: allReservations.filter((r) => r.status === "pending").length,
    confirmed: allReservations.filter((r) => r.status === "confirmed").length,
    paid: allReservations.filter((r) => r.status === "paid").length,
    cancelled: allReservations.filter((r) => r.status === "cancelled").length,
  };

  // Bilance per hrad
  const castleStats = castles.map((c) => {
    const totalEarned = c.reservations
      .flatMap((r) => r.payments)
      .reduce((s, p) => s + p.amount, 0);
    return {
      name: c.name,
      purchase_price: c.purchase_price,
      totalEarned,
      profit: totalEarned - c.purchase_price,
      reservationCount: c.reservations.length,
    };
  });

  const totalEarned = castleStats.reduce((s, c) => s + c.totalEarned, 0);
  const totalInvested = castleStats.reduce((s, c) => s + c.purchase_price, 0);
  const totalProfit = totalEarned - totalInvested;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bilance</h1>
        <p className="text-sm text-gray-500 mt-1">Přehled výdělků a návratnosti investice</p>
      </div>

      {/* Souhrnné karty */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 mb-1">Celkem rezervací</p>
            <p className="text-2xl font-bold text-gray-900">{allReservations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 mb-1">Celkem investováno</p>
            <p className="text-2xl font-bold text-gray-700">{totalInvested.toLocaleString("cs")} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 mb-1">Celkem vydělano</p>
            <p className="text-2xl font-bold text-green-600">{totalEarned.toLocaleString("cs")} Kč</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 mb-1">Bilance</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-sky-600" : "text-red-500"}`}>
              {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString("cs")} Kč
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafy – client component */}
      <BilanceCharts
        monthlyData={monthlyData}
        castleStats={castleStats}
      />
    </div>
  );
}
