import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-7xl mb-6">🏰</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Půjčovna skákacího hradu
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Udělejte z každé oslavy nezapomenutelný zážitek! Pronajměte si
            skákací hrad přímo k Vám domů.
          </p>
          <Link
            href="/rezervace"
            className={cn(buttonVariants({ size: "lg" }), "text-lg px-8 py-6")}
          >
            Rezervovat termín
          </Link>
        </div>
      </section>

      {/* Info karty */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <CalendarDays className="w-10 h-10 text-sky-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Flexibilní termíny</h3>
              <p className="text-gray-600 text-sm">
                Vyberte si libovolné dny v kalendáři. Půjčujeme na celý den.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <MapPin className="w-10 h-10 text-sky-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Vyzvednutí na adrese</h3>
              <p className="text-gray-600 text-sm">
                Týnec 62, 333 01 Chotěšov.<br />Hrad si vyzvednete osobně a po
                skončení vrátíte.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="w-10 h-10 text-sky-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Záloha 200 Kč</h3>
              <p className="text-gray-600 text-sm">
                Uhraďte zálohu přes QR kód. Po přijetí platby rezervaci
                potvrdíme. Záloha je vratná.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Jak pronájem funguje?
          </h2>
          <div className="space-y-4">
            {[
              { step: "1", text: "Vyberte dny v rezervačním formuláři" },
              { step: "2", text: "Vyplňte kontaktní údaje" },
              { step: "3", text: "Uhraďte zálohu 200 Kč přes QR kód" },
              { step: "4", text: "Po přijetí platby potvrdíme rezervaci a ozveme se vám" },
              { step: "5", text: "V domluvený čas si hrad vyzvednete" },
              { step: "6", text: "Při vracení proběhne kontrola stavu a následné vrácení kauce" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold shrink-0">
                  {step}
                </div>
                <p className="text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-400 border-t">
        <p>Půjčovna skákacího hradu &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
