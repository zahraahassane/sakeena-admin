// Staff work in UTC everywhere in the admin, for both typing and reading times.
// Students see these same moments in their own local time on their side.
// Never use the browser's timezone for anything staff-facing: use these helpers.

export const TIME_ZONE = "UTC";
export const UTC_LABEL = "UTC";

const DATE_OPTS = { month: "short", day: "numeric", year: "numeric" };
const TIME_OPTS = { hour: "numeric", minute: "2-digit" };

export const fmtDate = (value, opts = DATE_OPTS) =>
  new Date(value).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

export const fmtTime = (value, opts = TIME_OPTS) =>
  new Date(value).toLocaleTimeString("en-US", { ...opts, timeZone: "UTC" });

export const fmtDateTime = (value, opts) =>
  new Date(value).toLocaleString("en-US", {
    ...(opts || { ...DATE_OPTS, ...TIME_OPTS }),
    timeZone: "UTC",
  });

// "2026-11-20" in UTC for an ISO timestamp.
export const utcDateKey = (iso) => new Date(iso).toISOString().slice(0, 10);

// <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm") read as UTC.
export const utcInputToDate = (value) => new Date(`${value}:00Z`);
export const utcInputToIso = (value) => utcInputToDate(value).toISOString();

// ISO timestamp to a datetime-local value showing the UTC wall time.
export const isoToUtcInput = (iso) => new Date(iso).toISOString().slice(0, 16);

// Current UTC "YYYY-MM-DDTHH:mm", handy for the min attribute.
export const nowUtcInput = () => new Date().toISOString().slice(0, 16);
