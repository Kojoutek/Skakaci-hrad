"use client";

import { DayPicker } from "react-day-picker";
import { cs } from "date-fns/locale";
import { parseISO, startOfToday, format, isBefore } from "date-fns";
import "react-day-picker/dist/style.css";

interface Props {
  bookedDays: string[];
  selected: Date[];
  onChange: (days: Date[]) => void;
}

export default function ReservationCalendar({ bookedDays, selected, onChange }: Props) {
  const booked = bookedDays.map((d) => parseISO(d));
  const today = startOfToday();

  function handleDayClick(day: Date) {
    if (isBefore(day, today)) return;
    const isBooked = booked.some((b) => format(b, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
    if (isBooked) return;
    const key = format(day, "yyyy-MM-dd");
    const isSelected = selected.some((d) => format(d, "yyyy-MM-dd") === key);
    if (isSelected) {
      onChange(selected.filter((d) => format(d, "yyyy-MM-dd") !== key));
    } else {
      onChange([...selected, day]);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 justify-center">
<span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-red-100 border border-red-300 inline-block" />
          Rezervováno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-white border border-gray-300 inline-block" />
          Dostupné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-sky-500 inline-block" />
          Vybráno
        </span>
      </div>

      <style>{`
        .rdp-day_button { border-radius: 50%; width: 36px; height: 36px; }
        .rdp-day.day-past .rdp-day_button { background: #f3f4f6; color: #9ca3af; cursor: default; }
        .rdp-day.day-booked .rdp-day_button { background: #fee2e2; color: #b91c1c; cursor: not-allowed; text-decoration: line-through; }
        .rdp-day.day-selected .rdp-day_button { background: #0ea5e9 !important; color: white !important; font-weight: 700; }
      `}</style>

      <DayPicker
        locale={cs}
        startMonth={today}
        showOutsideDays={false}
        onDayClick={handleDayClick}
        modifiers={{
          day_past: { before: today },
          day_booked: booked,
          day_selected: selected,
        }}
        modifiersClassNames={{
          day_past: "day-past",
          day_booked: "day-booked",
          day_selected: "day-selected",
        }}
        className="border rounded-xl p-4 bg-white shadow-sm"
      />
    </div>
  );
}
