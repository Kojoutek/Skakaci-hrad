"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateReservationStatus } from "@/app/actions/reservation";
import { useRouter } from "next/navigation";

export default function ReservationActions({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState<"confirm" | "cancel" | null>(null);

  async function handle(action: "confirm" | "cancel") {
    setLoading(action);
    await updateReservationStatus(
      reservationId,
      action === "confirm" ? "confirmed" : "cancelled",
      adminNote || undefined
    );
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-2 pt-1">
      <Input
        placeholder="Interní poznámka (nepovinná)..."
        value={adminNote}
        onChange={(e) => setAdminNote(e.target.value)}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handle("confirm")}
          disabled={loading !== null}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {loading === "confirm" ? "..." : "Potvrdit rezervaci"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handle("cancel")}
          disabled={loading !== null}
          className="flex-1"
        >
          {loading === "cancel" ? "..." : "Zrušit"}
        </Button>
      </div>
    </div>
  );
}
