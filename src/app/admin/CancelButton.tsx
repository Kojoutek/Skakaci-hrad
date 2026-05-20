"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateReservationStatus } from "@/app/actions/reservation";
import { useRouter } from "next/navigation";

export default function CancelButton({ reservationId }: { reservationId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function handle() {
    setLoading(true);
    await updateReservationStatus(reservationId, "cancelled");
    setLoading(false);
    router.refresh();
  }

  if (!confirm) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 w-full"
        onClick={() => setConfirm(true)}
      >
        Zrušit rezervaci
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="destructive" onClick={handle} disabled={loading} className="flex-1">
        {loading ? "..." : "Ano, zrušit"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setConfirm(false)} disabled={loading} className="flex-1">
        Zpět
      </Button>
    </div>
  );
}
