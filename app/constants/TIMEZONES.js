export const DEFAULT_TIMEZONE_KEY = "local";

function formatOffsetLabel(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

function buildOffsetKey(offsetMinutes) {
  if (offsetMinutes === 0) return "utc";
  const prefix = offsetMinutes > 0 ? "utc_plus" : "utc_minus";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  if (minutes === 0) {
    return `${prefix}_${hours}`;
  }
  return `${prefix}_${hours}_${minutes}`;
}

// Current standard UTC offsets from UTC−12:00 to UTC+14:00
// Based on "List of UTC offsets" (Wikipedia), excluding
// historical/rare offsets that are no longer standard.
const UTC_OFFSETS_MINUTES = [
  -12 * 60, // UTC−12:00
  -11 * 60, // UTC−11:00
  -10 * 60, // UTC−10:00
  -9 * 60 - 30, // UTC−09:30
  -9 * 60, // UTC−09:00
  -8 * 60, // UTC−08:00
  -7 * 60, // UTC−07:00
  -6 * 60, // UTC−06:00
  -5 * 60, // UTC−05:00
  -4 * 60, // UTC−04:00
  -3 * 60 - 30, // UTC−03:30
  -3 * 60, // UTC−03:00
  -2 * 60, // UTC−02:00
  -1 * 60, // UTC−01:00
  0, // UTC+00:00
  1 * 60, // UTC+01:00
  2 * 60, // UTC+02:00
  3 * 60, // UTC+03:00
  3 * 60 + 30, // UTC+03:30
  4 * 60, // UTC+04:00
  4 * 60 + 30, // UTC+04:30
  5 * 60, // UTC+05:00
  5 * 60 + 30, // UTC+05:30
  5 * 60 + 45, // UTC+05:45
  6 * 60, // UTC+06:00
  6 * 60 + 30, // UTC+06:30
  7 * 60, // UTC+07:00
  8 * 60, // UTC+08:00
  8 * 60 + 45, // UTC+08:45
  9 * 60, // UTC+09:00
  9 * 60 + 30, // UTC+09:30
  10 * 60, // UTC+10:00
  10 * 60 + 30, // UTC+10:30
  11 * 60, // UTC+11:00
  12 * 60, // UTC+12:00
  12 * 60 + 45, // UTC+12:45
  13 * 60, // UTC+13:00
  14 * 60, // UTC+14:00
];

const GENERATED_TIMEZONES = UTC_OFFSETS_MINUTES.map((offset) => {
  const key = buildOffsetKey(offset);
  const baseLabel = formatOffsetLabel(offset);
  const label = offset === 0 ? `${baseLabel} (Coordinated Universal Time)` : baseLabel;
  return {
    key,
    label,
    offsetMinutes: offset,
  };
});

export const TIMEZONE_OPTIONS = [
  {
    key: "local",
    label: "Device local time",
    offsetMinutes: null,
  },
  ...GENERATED_TIMEZONES,
];

export const TIMEZONE_MAP = TIMEZONE_OPTIONS.reduce((acc, tz) => {
  acc[tz.key] = tz;
  return acc;
}, {});

// Export a default React component so Expo Router does not treat this
// file as an invalid route. This component is not used in the app.
export default function TimezonesRoute() {
  return null;
}
