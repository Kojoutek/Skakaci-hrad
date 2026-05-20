"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Reservation {
  id: string;
  status: string;
  total_deposit: number;
  created_at: string;
  castles: { name: string };
  reservation_days: { day: string }[];
  payments: { amount: number }[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  reservations: Reservation[];
}

interface Props {
  customer: Customer;
  returning: boolean;
  statusLabel: Record<string, string>;
  statusColor: Record<string, string>;
}

export default function ClientAccordion({ customer: c, returning, statusLabel, statusColor }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{c.name}</p>
              {returning && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                  Vracející se
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{c.email} · {c.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-400">{c.reservations.length}× rezervace</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t divide-y">
          {c.reservations.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-3">Žádné rezervace</p>
          ) : (
            c.reservations
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((r) => {
                const days = r.reservation_days
                  .map((d) => parseISO(d.day))
                  .sort((a, b) => a.getTime() - b.getTime());
                const totalPaid = r.payments.reduce((s, p) => s + p.amount, 0);

                return (
                  <div key={r.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-800">{r.castles.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>
                        {statusLabel[r.status]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      {days.map((d) => (
                        <p key={d.toISOString()}>
                          {format(d, "EEEE d. MMMM yyyy", { locale: cs })}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Záloha: <span className="font-medium text-gray-800">{r.total_deposit} Kč</span>
                        {totalPaid > 0 && (
                          <> · Zaplaceno: <span className="font-medium text-green-600">{totalPaid.toLocaleString("cs")} Kč</span></>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">{format(parseISO(r.created_at), "d.M.yyyy")}</span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}
