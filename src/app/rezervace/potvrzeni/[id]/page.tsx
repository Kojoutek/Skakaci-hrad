import { createAdminClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { ReservationStatus } from "@/lib/supabase/types";

type ReservationDetail = {
  id: string;
  status: ReservationStatus;
  note: string | null;
  created_at: string;
  customers: { name: string; email: string; phone: string };
  reservation_days: { day: string }[];
  castles: { name: string };
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PotvrzeniPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: raw } = await supabase
    .from("reservations")
    .select("*, customers(*), reservation_days(*), castles(*)")
    .eq("id", id)
    .single();

  if (!raw) notFound();
  const reservation = raw as unknown as ReservationDetail;

  const days = reservation.reservation_days
    .map((d) => parseISO(d.day))
    .sort((a, b) => a.getTime() - b.getTime());

  const customer = reservation.customers;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Úspěch */}
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Rezervace odeslána!</h1>
          <p className="text-gray-600 mt-2">
            Budeme Vás brzy kontaktovat a rezervaci potvrdíme.
          </p>
        </div>

        {/* Souhrn */}
        <Card>
          <CardHeader>
            <CardTitle>Souhrn rezervace</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between border-b py-1">
              <span className="text-gray-500">Typ</span>
              <span>{reservation.castles.name}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span className="text-gray-500">Jméno</span>
              <span>{customer.name}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span className="text-gray-500">E-mail</span>
              <span>{customer.email}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span className="text-gray-500">Telefon</span>
              <span>{customer.phone}</span>
            </div>
            <div className="border-b py-1">
              <span className="text-gray-500">Termíny:</span>
              {days.map((d) => (
                <p key={d.toISOString()} className="font-medium">
                  {format(d, "EEEE d. MMMM yyyy", { locale: cs })}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Budeme Vás kontaktovat na e-mail{" "}
          <strong>{customer.email}</strong> nebo telefon{" "}
          <strong>{customer.phone}</strong>.
        </p>

        <div className="text-center">
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    </div>
  );
}
