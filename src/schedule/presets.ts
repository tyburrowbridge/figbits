import type { SchedulePreset } from "../config/types.js";

export type CalendarEntry = {
  Hour: number;
  Minute: number;
  Weekday?: number;
};

export const PRESET_LABELS: Record<SchedulePreset, string> = {
  "daily-9": "Daily at 9:00 AM",
  "twice-9-13": "Twice daily — 9:00 AM and 1:00 PM",
  "hourly-workday": "Hourly, 9 AM – 5 PM, Mon–Fri",
  "weekly-mon": "Weekly — Monday 9:00 AM",
};

export function presetToCalendarEntries(preset: SchedulePreset): CalendarEntry[] {
  switch (preset) {
    case "daily-9":
      return [{ Hour: 9, Minute: 0 }];
    case "twice-9-13":
      return [
        { Hour: 9, Minute: 0 },
        { Hour: 13, Minute: 0 },
      ];
    case "hourly-workday": {
      const entries: CalendarEntry[] = [];
      for (let h = 9; h <= 17; h++) {
        for (let wd = 1; wd <= 5; wd++) {
          entries.push({ Hour: h, Minute: 0, Weekday: wd });
        }
      }
      return entries;
    }
    case "weekly-mon":
      return [{ Hour: 9, Minute: 0, Weekday: 1 }];
  }
}
