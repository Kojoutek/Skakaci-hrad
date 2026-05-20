"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import { cs } from "date-fns/locale";
import { parseISO, startOfToday, format, isBefore } from "date-fns";
import { toggleBlockedDay } from "@/app/actions/reservation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "react-day-picker/dist/style.css";

interface Props {
  blockedDays: string[];
}

export default function BlockedDaysManager({ blockedDays: initial }: Props) {
  const [blocked, setBlocked] = useState<string[]>(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const today = startOfToday();

  const blockedDates = blocked.map((d) => parseISO(d));

  function handleDayClick(day: Date) {
    if (isBefore(day, today)) return;
    const key = format(day, "yyyy-MM-dd");
    startTransition(async () => {
      await toggleBlockedDay(key);
      setBlocked((prev) =>
        prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
      );
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Blokované termíny</CardTitle>
        <p className="text-sm text-gray-500">Kliknutím na den ho zablokuješ nebo odblokuješ pro veřejné rezervace.</p>
      </CardHeader>
      <CardContent>
        <style>{`
          .admin-rdp .rdp-day_button { border-radius: 50%; width: 36px; height: 36px; }
          .admin-rdp .rdp-day.day-past .rdp-day_button { background: #f3f4f6; color: #9ca3af; cursor: default; }
          .admin-rdp .rdp-day.day-blocked .rdp-day_button { background: #fee2e2; color: #b91c1c; font-weight: 600; }
        `}</style>
        <div className={pending ? "opacity-60 pointer-events-none" : ""}>
          <DayPicker
            locale={cs}
            startMonth={today}
            showOutsideDays={false}
            onDayClick={handleDayClick}
            modifiers={{
              day_past: { before: today },
              day_blocked: blockedDates,
            }}
            modifiersClassNames={{
              day_past: "day-past",
              day_blocked: "day-blocked",
            }}
            className="admin-rdp border rounded-xl p-4 bg-white"
          />
        </div>
        {blocked.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Zablokované dny:</p>
            <div className="flex flex-wrap gap-2">
              {blocked
                .filter((d) => !isBefore(parseISO(d), today))
                .sort()
                .map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDayClick(parseISO(d))}
                    disabled={pending}
                    className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full hover:bg-red-100 transition-colors"
                  >
                    {format(parseISO(d), "d. M. yyyy")} ×
                  </button>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
