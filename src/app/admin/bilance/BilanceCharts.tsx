"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#0ea5e9",
  paid: "#22c55e",
  cancelled: "#ef4444",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Čekající",
  confirmed: "Potvrzené",
  paid: "Zaplacené",
  cancelled: "Zrušené",
};

interface Props {
  monthlyData: { month: string; amount: number }[];
  statusCounts: { pending: number; confirmed: number; paid: number; cancelled: number };
  castleStats: {
    name: string;
    purchase_price: number;
    totalEarned: number;
    profit: number;
    reservationCount: number;
  }[];
}

export default function BilanceCharts({ monthlyData, statusCounts, castleStats }: Props) {
  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABEL[key], value, color: STATUS_COLORS[key as keyof typeof STATUS_COLORS] }));

  return (
    <div className="space-y-6">
      {/* Výdělek po měsících */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Výdělek po měsících</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Zatím žádné zaznamenané platby</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} Kč`} width={70} />
                <Tooltip formatter={(v: unknown) => [`${(v as number).toLocaleString("cs")} Kč`, "Výdělek"]} />
                <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rozložení rezervací */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stav rezervací</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Žádné rezervace</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                  <Tooltip formatter={(v: unknown) => [`${v}×`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bilance per hrad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bilance hradů</CardTitle>
          </CardHeader>
          <CardContent>
            {castleStats.map((c) => (
              <div key={c.name} className="space-y-3">
                <p className="font-semibold text-sm text-gray-800">{c.name}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pořizovací cena</span>
                    <span className="font-medium">{c.purchase_price.toLocaleString("cs")} Kč</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Celkem vydělano</span>
                    <span className="font-medium text-green-600">{c.totalEarned.toLocaleString("cs")} Kč</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5">
                    <span className="text-gray-500">Bilance</span>
                    <span className={`font-bold ${c.profit >= 0 ? "text-sky-600" : "text-red-500"}`}>
                      {c.profit >= 0 ? "+" : ""}{c.profit.toLocaleString("cs")} Kč
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Počet rezervací</span>
                    <span className="font-medium">{c.reservationCount}×</span>
                  </div>
                </div>
                {/* Progress bar návratnosti */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Návratnost investice</span>
                    <span>{Math.min(100, Math.round((c.totalEarned / c.purchase_price) * 100))} %</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (c.totalEarned / c.purchase_price) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
