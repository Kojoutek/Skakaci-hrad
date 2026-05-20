export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { getBookedDays } from "@/app/actions/reservation";
import ReservationForm from "./ReservationForm";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function ReservacePage() {
  const supabase = await createAdminClient();
  const { data: castles } = await supabase
    .from("castles")
    .select("id, name")
    .eq("active", true);

  if (!castles || castles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Momentálně není k dispozici žádný hrad.</p>
      </div>
    );
  }

  const bookedDaysByCastle: Record<string, string[]> = {};
  for (const castle of castles) {
    bookedDaysByCastle[castle.id] = await getBookedDays(castle.id);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto mb-8">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          &larr; Zpět
        </Link>
        <h1 className="text-3xl font-bold mt-2">Rezervace</h1>
      </div>
      <ReservationForm castles={castles} bookedDaysByCastle={bookedDaysByCastle} />
    </div>
  );
}
