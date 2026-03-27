// ─── Timezone helpers (Asia/Kolkata) ────────────────────────────
const { DateTime } = require('luxon');

const ZONE = 'Asia/Kolkata';

/** Convert any JS Date / ISO string to Luxon DateTime in IST */
function toIST(date) {
  return DateTime.fromJSDate(new Date(date), { zone: ZONE });
}

/** Current IST DateTime */
function getISTNow() {
  return DateTime.now().setZone(ZONE);
}

/**
 * Set a specific time on a given date in IST.
 * @param {DateTime|Date|string} date
 * @param {number} hour  0-23
 * @param {number} minute 0-59
 * @returns {DateTime}
 */
function setTimeIST(date, hour, minute = 0) {
  const dt = date instanceof DateTime
    ? date
    : DateTime.fromJSDate(new Date(date), { zone: ZONE });
  return dt.set({ hour, minute, second: 0, millisecond: 0 });
}

/**
 * Parse "6 pm" / "12 pm" / "9 am" style time string → { hour, minute }
 */
function parseTimeString(str) {
  if (!str) return null;
  const clean = str.trim().toLowerCase();

  // Handle "9 am to 8 pm" => take the cutoff (8 pm)
  if (clean.includes(' to ')) {
    const parts = clean.split(' to ');
    return parseTimeString(parts[1]);
  }

  const match = clean.match(/^(\d{1,2})\s*(am|pm)$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const ampm = match[2];
  if (ampm === 'pm' && hour !== 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;

  return { hour, minute: 0 };
}

/**
 * Parse open time from strings like "9 am to 8 pm" => { hour, minute }
 */
function parseOpenTime(str) {
  if (!str) return null;
  const clean = str.trim().toLowerCase();
  if (!clean.includes(' to ')) return null;
  const parts = clean.split(' to ');
  return parseTimeString(parts[0]);
}

module.exports = { toIST, getISTNow, setTimeIST, parseTimeString, parseOpenTime, ZONE };
