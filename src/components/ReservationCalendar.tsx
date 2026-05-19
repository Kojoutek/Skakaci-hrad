"use client";

import { DayPicker } from "react-day-picker";
import { cs } from "date-fns/locale";
import { parseISO, startOfToday, format } from "date-fns";
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
    const key = format(day, "yyyy-MM-dd");
    const isSelected = selected.some((d) => format(d, "yyyy-MM-dd") === key);
    if (isSelected) {
      onChange(selected.filter((d) => format(d, "yyyy-MM-dd") !== key));
    } else {
      onChange([...selected, day]);
    }
  }

  return (
    <div className="flex justify-center">
      <DayPicker
        locale={cs}
        disabled={[{ before: today }, ...booked]}
        modifiers={{ booked, selected_custom: selected }}
        modifiersClassNames={{
          booked: "line-through opacity-40 cursor-not-allowed",
          selected_custom: "!bg-sky-500 !text-white rounded-full font-bold",
        }}
        startMonth={today}
        showOutsideDays={false}
        onDayClick={handleDayClick}
        className="border rounded-xl p-4 bg-white shadow-sm"
      />
    </div>
  );
}
