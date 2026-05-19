"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  // Vytvoř zákazníka
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    return { success: false, error: "Nepodařilo se uložit kontaktní údaje." };
  }

  // Vytvoř rezervaci
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      castle_id: formData.castleId,
      customer_id: customer.id,
      status: "pending",
      total_deposit: formData.days.length * 100,
      note: formData.note || null,
    })
    .select("id")
    .single();

  if (reservationError || !reservation) {
    return { success: false, error: "Nepodařilo se vytvořit rezervaci." };
  }

  // Ulož dny
  const { error: daysError } = await supabase.from("reservation_days").insert(
    formData.days.map((day) => ({
      reservation_id: reservation.id,
      day,
    }))
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
  revalidatePath("/admin");
}
