"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "../../lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full !m-0 p-0", className)}
      classNames={{
        months: "grid w-full grid-cols-1 gap-8 lg:grid-cols-2",
        month: "w-full space-y-3",
        caption:
          "flex items-center justify-between px-2 pb-2 border-b border-white/5",
        caption_label: "text-sm font-semibold text-white tracking-wide",
        nav: "flex items-center gap-1",
        nav_button:
          "h-7 w-7 grid place-items-center border border-white/10 bg-zinc-800/60 text-zinc-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:text-emerald-300 rounded-none",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        tbody: "flex flex-col gap-[3px]",
        head_row: "grid grid-cols-7 gap-[3px] mb-1",
        head_cell:
          "text-center text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500 py-1",
        row: "grid grid-cols-7 gap-[3px]",
        cell: "relative",

        /* ── Normal day ─────────────────────────────────────── */
        day: "w-full aspect-square flex items-center justify-center text-sm font-medium text-zinc-400 bg-zinc-800/50 border border-white/[0.06] rounded-none transition-all duration-150 hover:bg-zinc-700/80 hover:text-white hover:border-white/20",

        /* ── Selected start / end ───────────────────────────── */
        day_range_start:
          "!bg-emerald-500 !text-black !border-emerald-400 !font-bold !shadow-[0_0_12px_rgba(16,185,129,0.4)] !border-l-[3px] !border-l-emerald-200",
        day_range_end:
          "!bg-emerald-500 !text-black !border-emerald-400 !font-bold !shadow-[0_0_12px_rgba(16,185,129,0.4)] !border-r-[3px] !border-r-emerald-200",

        /* ── Any selected day (start OR end when only one picked) */
        day_selected:
          "!bg-emerald-500 !text-black !border-emerald-400 !font-bold",

        /* ── Days between start and end ─────────────────────── */
        day_range_middle:
          "!bg-emerald-500/20 !text-emerald-200 !border-emerald-400/15 !font-medium",

        /* ── Today indicator ────────────────────────────────── */
        day_today:
          "!border-emerald-400/60 !text-emerald-300 !font-bold !bg-zinc-800",

        day_outside: "!opacity-20 !text-zinc-600",
        day_disabled: "!opacity-15",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeftIcon className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRightIcon className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };