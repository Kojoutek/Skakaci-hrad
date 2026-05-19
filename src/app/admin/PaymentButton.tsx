"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPayment } from "@/app/actions/reservation";
import { useRouter } from "next/navigation";

export default function PaymentButton({ reservationId, existingPayments }: {
  reservationId: string;
  existingPayments: { amount: number; paid_at: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPaid = existingPayments.reduce((s, p) => s + p.amount, 0);

  async function handle() {
    const val = parseInt(amount);
    if (!val || val <= 0) return;
    setLoading(true);
    await addPayment(reservationId, val, note || undefined);
    setLoading(false);
    setOpen(false);
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {existingPayments.length > 0 && (
        <p className="text-sm text-green-700 font-medium">
          Zaplaceno celkem: {totalPaid} Kč
        </p>
      )}
      {!open ? (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="w-full border-green-500 text-green-700 hover:bg-green-50">
          + Zaznamenat platbu
        </Button>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <Input
            type="number"
            placeholder="Částka (Kč)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-36"
          />
          <Input
            placeholder="Poznámka (nepovinná)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" onClick={handle} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "..." : "Uložit"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
        </div>
      )}
    </div>
  );
}
