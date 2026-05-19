"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReservationCalendar from "@/components/ReservationCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createReservation } from "@/app/actions/reservation";

const DEPOSIT = 200;

const CASTLE_INFO: Record<string, {
  images: string[];
  specs: { label: string; value: string }[];
  included: string[];
}> = {
  "Happy Hop Velký dům": {
    images: ["/hrad-01.webp", "/hrad-02.webp", "/hrad-03.webp"],
    specs: [
      { label: "Rozměry", value: "3,3 × 4,6 m" },
      { label: "Výška", value: "2,7 m" },
      { label: "Plocha", value: "15 m²" },
      { label: "Kapacita", value: "pro 6 dětí" },
      { label: "Nosnost", value: "180 kg" },
    ],
    included: [
      "Nafukovací hrad",
      "Ventilátor pro nafouknutí",
      "Přepravní taška",
      "Kotvící kolíky",
    ],
  },
};

interface Castle {
  id: string;
  name: string;
}

interface Props {
  castles: Castle[];
  bookedDaysByCastle: Record<string, string[]>;
}

type Step = "calendar" | "contact" | "summary";

export default function ReservationForm({ castles, bookedDaysByCastle }: Props) {
  const router = useRouter();
  const [selectedCastleId, setSelectedCastleId] = useState<string>(castles[0]?.id ?? "");
  const [activeImage, setActiveImage] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sorted = [...selectedDays].sort((a, b) => a.getTime() - b.getTime());
  const selectedCastle = castles.find((c) => c.id === selectedCastleId);
  const castleInfo = selectedCastle ? CASTLE_INFO[selectedCastle.name] : undefined;
  const bookedDays = bookedDaysByCastle[selectedCastleId] ?? [];

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const result = await createReservation({
      castleId: selectedCastleId,
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
    <div className="max-w-3xl mx-auto">
      {/* Kroky */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(["calendar", "contact", "summary"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${step === s ? "bg-sky-500 text-white" : i < ["calendar","contact","summary"].indexOf(step) ? "bg-sky-200 text-sky-700" : "bg-gray-100 text-gray-400"}`}>
              {i + 1}
            </div>
            {i < 2 && <div className="w-12 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === "calendar" && (
        <div className="space-y-6">
          {/* Výběr hradu */}
          <Card>
            <CardHeader>
              <CardTitle>Vyberte hrad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {castles.map((castle) => {
                const info = CASTLE_INFO[castle.name];
                const isSelected = castle.id === selectedCastleId;
                return (
                  <div key={castle.id} className="space-y-3">
                    {/* Rádiové tlačítko */}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors
                      ${isSelected ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        name="castle"
                        value={castle.id}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedCastleId(castle.id);
                          setShowDetail(false);
                          setActiveImage(0);
                          setSelectedDays([]);
                        }}
                        className="accent-sky-500 w-4 h-4"
                      />
                      <div className="flex-1">
                        <span className="font-semibold">{castle.name}</span>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-gray-800">1 250 Kč/den</p>
                        <p className="text-gray-500">Kauce: 2 300 Kč</p>
                      </div>
                      {info && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setShowDetail((v) => !v); }}
                          className="text-sky-500 text-sm underline whitespace-nowrap"
                        >
                          {showDetail && isSelected ? "Skrýt" : "Detail"}
                        </button>
                      )}
                    </label>

                    {/* Detail – fotky + popis */}
                    {info && isSelected && showDetail && (
                      <div className="border rounded-xl overflow-hidden bg-white">
                        {/* Fotogalerie */}
                        <div className="relative aspect-video bg-gray-100">
                          <Image
                            src={info.images[activeImage]}
                            alt={castle.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="flex gap-2 p-3">
                          {info.images.map((src, idx) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => setActiveImage(idx)}
                              className={`relative w-16 h-12 rounded overflow-hidden border-2 transition-colors
                                ${activeImage === idx ? "border-sky-500" : "border-transparent"}`}
                            >
                              <Image src={src} alt="" fill className="object-cover" />
                            </button>
                          ))}
                        </div>
                        {/* Parametry */}
                        <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t">
                          {info.specs.map(({ label, value }) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-gray-500">{label}</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                        {/* Součástí pronájmu */}
                        <div className="px-4 pb-4 border-t pt-3">
                          <p className="text-sm font-semibold mb-2">Součástí pronájmu:</p>
                          <ul className="grid grid-cols-2 gap-1 text-sm text-gray-600">
                            {info.included.map((item) => (
                              <li key={item} className="flex items-center gap-1">
                                <span className="text-sky-500">✓</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Výběr termínu */}
          <Card>
            <CardHeader>
              <CardTitle>Vyberte termín</CardTitle>
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
        </div>
      )}

      {step === "contact" && (
        <Card>
          <CardHeader>
            <CardTitle>Kontaktní údaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Jméno a příjmení *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan Novák" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@example.cz" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+420 777 123 456" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Poznámka</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cokoliv, co bychom měli vědět..." rows={3} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("calendar")} className="flex-1">Zpět</Button>
              <Button onClick={() => setStep("summary")} disabled={!name || !email || !phone} className="flex-1">Pokračovat</Button>
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
                <span className="text-gray-500">Hrad</span>
                <span className="font-medium">{selectedCastle?.name}</span>
              </div>
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
                <span className="text-gray-500">Termíny:</span>
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
                <span>{DEPOSIT} Kč</span>
              </div>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("contact")} className="flex-1">Zpět</Button>
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
