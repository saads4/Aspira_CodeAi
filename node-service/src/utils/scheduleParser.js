// ─── Schedule Parser ────────────────────────────────────────────
// Converts human-readable test schedule strings from EDOS into
// structured batch window objects.
//
// Examples:
//   "Daily 6 pm"             → { days: [0..6], cutoff_hour: 18 }
//   "Daily 9 am to 8 pm"     → { days: [0..6], cutoff_hour: 20, open_hour: 9 }
//   "Tue / Fri 6 pm"         → { days: [2,5],  cutoff_hour: 18 }
//   "Mon / Wed / Fri 6 pm"   → { days: [1,3,5], cutoff_hour: 18 }
//   "1st & 3rd Thu 5 pm"     → { special: '1st_3rd', weekday: 4, cutoff_hour: 17 }
//   "Walk In"                → { walkIn: true, days: [0..6], cutoff_hour: 17 }
// ────────────────────────────────────────────────────────────────

const DAY_MAP = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, thue: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function parseDayToken(token) {
  const t = token.trim().toLowerCase().replace(/[^a-z]/g, '');
  return DAY_MAP[t] !== undefined ? DAY_MAP[t] : null;
}

/**
 * @param {string} scheduleStr – e.g. "Tue / Fri 6 pm"
 * @returns {{ days: number[], cutoff_hour: number, cutoff_minute: number,
 *             open_hour?: number, open_minute?: number, walkIn?: boolean,
 *             special?: string, weekday?: number }}
 */
function parseSchedule(scheduleStr) {
  if (!scheduleStr || typeof scheduleStr !== 'string') {
    return { days: ALL_DAYS, cutoff_hour: 17, cutoff_minute: 0 };
  }

  const raw = scheduleStr.trim();
  const lower = raw.toLowerCase();

  // ── "Refer Individual Test" or empty ───────────────────────
  if (lower.includes('refer individual') || lower === '') {
    return { days: ALL_DAYS, cutoff_hour: 17, cutoff_minute: 0 };
  }

  // ── Walk In ────────────────────────────────────────────────
  if (lower.startsWith('walk in') || lower === 'walk-in') {
    // try to grab hours  e.g. "Daily 9 am to 3 pm"
    const timeMatch = raw.match(/(\d{1,2}\s*(?:am|pm))\s*$/i);
    let cutoffHour = 17;
    if (timeMatch) {
      const parsed = parseSimpleTime(timeMatch[1]);
      if (parsed !== null) cutoffHour = parsed;
    }
    return { days: ALL_DAYS, cutoff_hour: cutoffHour, cutoff_minute: 0, walkIn: true };
  }

  // ── Special: "1st & 3rd Thu 5 pm" ─────────────────────────
  const specialMatch = raw.match(/^([\d\w]+\s*[&,]\s*[\d\w]+)\s+(\w+)\s+(\d{1,2}\s*(?:am|pm))$/i);
  if (specialMatch) {
    const pattern = specialMatch[1].replace(/\s+/g, '').toLowerCase(); // "1st&3rd"
    const day = parseDayToken(specialMatch[2]);
    const hour = parseSimpleTime(specialMatch[3]);
    if (day !== null && hour !== null) {
      return { special: pattern, weekday: day, cutoff_hour: hour, cutoff_minute: 0, days: [day] };
    }
  }

  // ── Extract time portion ───────────────────────────────────
  let cutoffHour = 17;
  let cutoffMinute = 0;
  let openHour = null;
  let openMinute = 0;
  let daysPart = lower;

  // Handle "9 am to 8 pm" range
  const rangeMatch = raw.match(/(\d{1,2}\s*(?:am|pm))\s+to\s+(\d{1,2}\s*(?:am|pm))/i);
  if (rangeMatch) {
    openHour = parseSimpleTime(rangeMatch[1]);
    openMinute = 0;
    cutoffHour = parseSimpleTime(rangeMatch[2]);
    cutoffMinute = 0;
    daysPart = lower.replace(rangeMatch[0].toLowerCase(), '').trim();
  } else {
    // Single time: "6 pm", "12 pm", "3 pm"
    const singleMatch = raw.match(/(\d{1,2}\s*(?:am|pm))\s*$/i);
    if (singleMatch) {
      cutoffHour = parseSimpleTime(singleMatch[1]);
      daysPart = lower.replace(singleMatch[0].toLowerCase(), '').trim();
    }

    // Handle "12 pm & 6 PM" — two cutoffs, take last
    const multiTime = raw.match(/(\d{1,2}\s*(?:am|pm))\s*[&,]\s*(\d{1,2}\s*(?:am|pm))/i);
    if (multiTime) {
      cutoffHour = parseSimpleTime(multiTime[2]);
      daysPart = lower
        .replace(multiTime[0].toLowerCase(), '')
        .trim();
    }
  }

  // ── Parse days ─────────────────────────────────────────────
  // Remove trailing separators
  daysPart = daysPart.replace(/[\/,&]+\s*$/g, '').replace(/^\s*[\/,&]+/g, '').trim();

  // "Daily" or "Mon to Sat" or "Mon to Fri"
  if (daysPart.includes('daily') || daysPart === '') {
    const result = { days: ALL_DAYS, cutoff_hour: cutoffHour, cutoff_minute: cutoffMinute };
    if (openHour !== null) { result.open_hour = openHour; result.open_minute = openMinute; }
    return result;
  }

  // "Mon to Fri" or "Mon to Sat"
  const rangeDay = daysPart.match(/(\w+)\s+to\s+(\w+)/i);
  if (rangeDay) {
    const start = parseDayToken(rangeDay[1]);
    const end = parseDayToken(rangeDay[2]);
    if (start !== null && end !== null) {
      const days = [];
      for (let d = start; d <= end; d++) days.push(d);
      if (end < start) { // wrap around
        for (let d = start; d <= 6; d++) days.push(d);
        for (let d = 0; d <= end; d++) days.push(d);
      }
      const result = { days, cutoff_hour: cutoffHour, cutoff_minute: cutoffMinute };
      if (openHour !== null) { result.open_hour = openHour; result.open_minute = openMinute; }
      return result;
    }
  }

  // Explicit day list: "Tue / Fri" or "Mon, Wed, Fri" or "Tue/ Thu/ Sat"
  const tokens = daysPart.split(/[\/,&]+/).map((t) => t.trim()).filter(Boolean);
  const days = [];
  for (const token of tokens) {
    const d = parseDayToken(token);
    if (d !== null) days.push(d);
  }

  if (days.length > 0) {
    const result = { days, cutoff_hour: cutoffHour, cutoff_minute: cutoffMinute };
    if (openHour !== null) { result.open_hour = openHour; result.open_minute = openMinute; }
    return result;
  }

  // Fallback
  return { days: ALL_DAYS, cutoff_hour: cutoffHour, cutoff_minute: cutoffMinute };
}

/** Convert "6 pm" → 18, "9 am" → 9, etc. */
function parseSimpleTime(str) {
  if (!str) return null;
  const m = str.trim().toLowerCase().match(/^(\d{1,2})\s*(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (m[2] === 'pm' && h !== 12) h += 12;
  if (m[2] === 'am' && h === 12) h = 0;
  return h;
}

module.exports = { parseSchedule, parseSimpleTime, ALL_DAYS };
