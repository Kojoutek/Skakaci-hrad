"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useRouter } from "next/navigation";
import ReservationCalendar from "@/components/ReservationCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createReservation } from "@/app/actions/reservation";

interface Props {
  bookedDays: string[];
  castleId: string;
}

type Step = "calendar" | "contact" | "summary";

export default function ReservationForm({ bookedDays, castleId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sorted = [...selectedDays].sort((a, b) => a.getTime() - b.getTime());
  const totalDeposit = selectedDays.length * 100;

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const result = await createReservation({
      castleId,
      days: sorted.map((d) => format(d, "yyyy-MM-dd")),
      name,
      email,
      phone,
      note,
    });
    setLoading(false);
    if (result.success && result.reservationId) {
      router.push(`/rezervace/potvrzeni/${result.reservationId}`);
    } else {
      setError(result.error ?? "Neznámá chyba");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Kroky */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(["calendar", "contact", "summary"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${step === s ? "bg-sky-500 text-white" : i < ["calendar", "contact", "summary"].indexOf(step) ? "bg-sky-200 text-sky-700" : "bg-gray-100 text-gray-400"}`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-12 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle>Vyberte dny pronájmu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReservationCalendar
              bookedDays={bookedDays}
              selected={selectedDays}
              onChange={setSelectedDays}
            />
            {selectedDays.length > 0 && (
              <div className="bg-sky-50 rounded-lg p-4">
                <p className="font-medium mb-2">Vybrané dny:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {sorted.map((d) => (
                    <li key={d.toISOString()}>
                      {format(d, "EEEE d. MMMM yyyy", { locale: cs })}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-semibold text-sky-700">
                  Záloha celkem: {totalDeposit} Kč
                </p>
              </div>
            )}
            <Button
              onClick={() => setStep("contact")}
              disabled={selectedDays.length === 0}
              className="w-full"
            >
              Pokračovat
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "contact" && (
        <Card>
          <CardHeader>
            <CardTitle>Kontaktní údaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Jméno a příjmení *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jan Novák"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@example.cz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+420 777 123 456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Poznámka</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Cokoliv, co bychom měli vědět..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("calendar")} className="flex-1">
                Zpět
              </Button>
              <Button
                onClick={() => setStep("summary")}
                disabled={!name || !email || !phone}
                className="flex-1"
              >
                Pokračovat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>Souhrn rezervace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Jméno</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">E-mail</span>
                <span className="font-medium">{email}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Telefon</span>
                <span className="font-medium">{phone}</span>
              </div>
              <div className="py-1 border-b">
                <span className="text-gray-500">Dny pronájmu:</span>
                <ul className="mt-1 space-y-0.5">
                  {sorted.map((d) => (
                    <li key={d.toISOString()} className="font-medium">
                      {format(d, "EEEE d. MMMM yyyy", { locale: cs })}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between py-2 text-base font-bold text-sky-700">
                <span>Záloha k úhradě</span>
                <span>{totalDeposit} Kč</span>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("contact")} className="flex-1">
                Zpět
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Odesílám..." : "Odeslat rezervaci"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
