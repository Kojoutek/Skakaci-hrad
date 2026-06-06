"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { PRICE_PER_DAY, KAUCE } from "@/lib/pricing";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getBookedDays(castleId: string): Promise<string[]> {
  const supabase = await createAdminClient();
  const [{ data: reservedData }, { data: blockedData }] = await Promise.all([
    supabase
      .from("reservation_days")
      .select("day, reservations!inner(castle_id, status)")
      .eq("reservations.castle_id", castleId)
      .in("reservations.status", ["pending", "confirmed", "paid"]),
    supabase.from("blocked_days").select("day"),
  ]);

  const reserved = (reservedData ?? []).map((d) => (d as unknown as { day: string }).day);
  const blocked = (blockedData ?? []).map((d) => (d as unknown as { day: string }).day);
  return [...new Set([...reserved, ...blocked])];
}

export async function toggleBlockedDay(day: string): Promise<{ blocked: boolean }> {
  const supabase = await createAdminClient();
  const { data, error: selectError } = await supabase
    .from("blocked_days")
    .select("day")
    .eq("day", day)
    .maybeSingle();

  if (selectError) throw new Error("Select error: " + selectError.message);

  if (data) {
    const { error } = await supabase.from("blocked_days").delete().eq("day", day);
    if (error) throw new Error("Delete error: " + error.message);
    revalidatePath("/admin/rezervace");
    revalidatePath("/rezervace");
    return { blocked: false };
  } else {
    const { error } = await supabase.from("blocked_days").insert({ day });
    if (error) throw new Error("Insert error: " + error.message);
    revalidatePath("/admin/rezervace");
    revalidatePath("/rezervace");
    return { blocked: true };
  }
}

export async function getBlockedDays(): Promise<string[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("blocked_days").select("day");
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
  // Validace vstupů
  if (!formData.name.trim()) return { success: false, error: "Zadejte jméno a příjmení." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
    return { success: false, error: "Zadejte platnou e-mailovou adresu." };
  const phone = formData.phone.replace(/\s+/g, "");
  if (!/^(\+420)?[0-9]{9}$/.test(phone))
    return { success: false, error: "Zadejte platné telefonní číslo (např. 777 123 456)." };
  if (formData.days.length === 0) return { success: false, error: "Vyberte alespoň jeden termín." };

  const supabase = await createAdminClient();

  // Najdi existujícího zákazníka podle jména + emailu, nebo vytvoř nového
  let customerId: string;
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("email", formData.email)
    .eq("name", formData.name)
    .maybeSingle();

  if (existing) {
    customerId = existing.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({ name: formData.name, email: formData.email, phone: formData.phone })
      .select("id")
      .single();
    if (customerError || !newCustomer) {
      return { success: false, error: "Nepodařilo se uložit kontaktní údaje." };
    }
    customerId = newCustomer.id;
  }

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      castle_id: formData.castleId,
      customer_id: customerId,
      status: "pending",
      total_deposit: 0,
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

  // Email adminu o nové rezervaci
  const days = formData.days
    .map((d) => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  const daysText = days.map((d) => format(d, "EEEE d. MMMM yyyy", { locale: cs })).join("\n");

  const { data: castleData } = await supabase
    .from("castles")
    .select("name")
    .eq("id", formData.castleId)
    .single();

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "knizektomas3@gmail.com",
    subject: `Nová rezervace – ${castleData?.name ?? "hrad"}`,
    text: [
      `Dobrý den,`,
      ``,
      `Přišla nová žádost o rezervaci.`,
      ``,
      `Klient: ${formData.name}`,
      `E-mail: ${formData.email}`,
      `Telefon: ${formData.phone}`,
      ``,
      `Požadované termíny:`,
      daysText,
      formData.note ? `\nPoznámka: ${formData.note}` : "",
      ``,
      `Pro správu rezervací přejděte do administrace.`,
    ].join("\n"),
  });

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
      const rental = PRICE_PER_DAY * dayCount;
      const celkem = rental + KAUCE;
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
          `Pronájem (${PRICE_PER_DAY.toLocaleString("cs")} Kč x ${dayCount} ${dnyText}) - ${rental.toLocaleString("cs")} Kč`,
          `Vratná kauce - ${KAUCE.toLocaleString("cs")} Kč`,
          ``,
          `Celkem uhradíte při předání: ${celkem.toLocaleString("cs")} Kč`,
          `Kauce (${KAUCE.toLocaleString("cs")} Kč) bude vrácena po odevzdání hradu a kontrole stavu.`,
          ``,
          `---`,
          `Předání a vrácení:`,
          ``,
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

  // Po zaznamenání platby přesuň rezervaci do stavu "paid"
  await supabase
    .from("reservations")
    .update({ status: "paid" })
    .eq("id", reservationId);

  revalidatePath("/admin");
}
