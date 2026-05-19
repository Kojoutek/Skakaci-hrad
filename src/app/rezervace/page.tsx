import { createAdminClient } from "@/lib/supabase/server";
import { getBookedDays } from "@/app/actions/reservation";
import ReservationForm from "./ReservationForm";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function ReservacePage() {
  const supabase = await createAdminClient();
  const { data: castle } = await supabase
    .from("castles")
    .select("id, name")
    .eq("active", true)
    .limit(1)
    .single();

  if (!castle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Momentálně není k dispozici žádný hrad.</p>
      </div>
    );
  }

  const bookedDays = await getBookedDays(castle.id);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto mb-8">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          &larr; Zpět
        </Link>
        <h1 className="text-3xl font-bold mt-2 mb-1">{castle.name}</h1>
        <p className="text-gray-500">Záloha 100 Kč za každý den pronájmu</p>
      </div>
      <ReservationForm bookedDays={bookedDays} castleId={castle.id} />
    </div>
  );
}
