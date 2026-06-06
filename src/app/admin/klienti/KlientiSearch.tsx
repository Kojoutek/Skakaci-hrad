"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import ClientAccordion from "./ClientAccordion";

interface Reservation {
  id: string;
  status: string;
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

export default function KlientiSearch({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? customers.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
        );
      })
    : customers;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Hledat podle jména, e-mailu nebo telefonu..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-10 text-center">Žádní klienti</p>
        ) : (
          filtered.map((c) => (
            <ClientAccordion
              key={c.id}
              customer={c}
              returning={c.reservations.length > 1}
              statusLabel={STATUS_LABEL}
              statusColor={STATUS_COLOR}
            />
          ))
        )}
      </div>
    </div>
  );
}
