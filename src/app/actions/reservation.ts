"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getBookedDays(castleId: string): Promise<string[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("reservation_days")
    .select("day, reservations!inner(castle_id, status)")
    .eq("reservations.castle_id", castleId)
    .in("reservations.status", ["pending", "confirmed"]);

  return (data ?? []).map((d) => (d as unknown as { day: string }).day);
}

export async function createReservation(formData: {
  castleId: string;
  days: string[];
  name: string;
  email: string;
  phone: string;
  note: string;
}): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  const supabase = await createAdminClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({ name: formData.name, email: formData.email, phone: formData.phone })
    .select("id")
    .single();

  if (customerError || !customer) {
    return { success: false, error: "Nepodařilo se uložit kontaktní údaje." };
  }

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      castle_id: formData.castleId,
      customer_id: customer.id,
      status: "pending",
      total_deposit: 200,
      note: formData.note || null,
    })
    .select("id")
    .single();

  if (reservationError || !reservation) {
    return { success: false, error: "Nepodařilo se vytvořit rezervaci." };
  }

  const { error: daysError } = await supabase.from("reservation_days").insert(
    formData.days.map((day) => ({ reservation_id: reservation.id, day }))
  );

  if (daysError) {
    return { success: false, error: "Nepodařilo se uložit termíny." };
  }

  return { success: true, reservationId: reservation.id };
}

export async function updateReservationStatus(
  reservationId: string,
  status: "confirmed" | "cancelled",
  adminNote?: string
) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("reservations")
    .update({ status, admin_note: adminNote ?? null })
    .eq("id", reservationId);

  if (error) throw new Error(error.message);

  // Odeslat email při potvrzení
  if (status === "confirmed") {
    const { data: raw } = await supabase
      .from("reservations")
      .select("*, customers(*), reservation_days(*), castles(name)")
      .eq("id", reservationId)
      .single();

    if (raw) {
      const r = raw as unknown as {
        total_deposit: number;
        admin_note: string | null;
        customers: { name: string; email: string; phone: string };
        reservation_days: { day: string }[];
        castles: { name: string };
      };

      const days = r.reservation_days
        .map((d) => parseISO(d.day))
        .sort((a, b) => a.getTime() - b.getTime());

      const daysText = days
        .map((d) => format(d, "EEEE d. MMMM yyyy", { locale: cs }))
        .join("\n");

      const dayCount = days.length;
      const rental = 1250 * dayCount;
      const celkem = rental + 2500;
      const dnyText = dayCount === 1 ? "den" : dayCount < 5 ? "dny" : "dní";

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "knizektomas3@gmail.com",
        subject: `Potvrzení rezervace – ${r.castles.name}`,
        text: [
          `Dobrý den,`,
          ``,
          `Vaše rezervace skákacího hradu ${r.castles.name} byla potvrzena.`,
          ``,
          `Klient: ${r.customers.name}`,
          `E-mail: ${r.customers.email}`,
          `Telefon: ${r.customers.phone}`,
          ``,
          `Rezervované termíny:`,
          daysText,
          ``,
          `---`,
          `Rozpis platby:`,
          ``,
          `Pronájem (1.250 Kč x ${dayCount} ${dnyText}) - ${rental.toLocaleString("cs")} Kč`,
          `Vratná kauce - 2.500 Kč`,
          ``,
          `Uhrazená záloha - 200 Kč`,
          ``,
          `Celkem uhradíte při předání: ${celkem.toLocaleString("cs")} Kč`,
          `Kauce + záloha (${(2500 + 200).toLocaleString("cs")} Kč) budou vráceny po odevzdání hradu a kontrole stavu.`,
          ``,
          `---`,
          `Předání a vrácení:`,
          `Hrad si vyzvednete na adrese Týnec 62, 333 01 Chotěšov.`,
          `Pro domluvení přesného času mě prosím kontaktujte:`,
          `Tel: 734 124 927`,
          `Email: knizektomas3@gmail.com`,
          ``,
          `Předání je možné uskutečnit den před rezervovaným termínem a to od 20:00 do 22:00`,
          `Vrácení je možné poslední den rezervace do 20:00`,
          ``,
          `Děkuji a s pozdravem`,
          `Tomáš Knížek`,
        ].join("\n"),
      });
    }
  }

  revalidatePath("/admin");
}

export async function addPayment(reservationId: string, amount: number, note?: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("payments")
    .insert({ reservation_id: reservationId, amount, note: note ?? null });

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
