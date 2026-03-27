// ─── TAT Parser ─────────────────────────────────────────────────
// Converts human-readable TAT strings from EDOS into numeric values.
//
// Return format: { tat_minutes: Number, deadline_hour?: Number }
//
// Examples:
//   "Same Day"          → { tat_minutes: 0 }
//   "Same Day 5 Hrs"    → { tat_minutes: 300 }
//   "Same Day 6 PM"     → { tat_minutes: 0, deadline_hour: 18 }
//   "Next Day"          → { tat_minutes: 1440 }
//   "Next Day 8 pm"     → { tat_minutes: 1440, deadline_hour: 20 }
//   "Next day 7 pm"     → { tat_minutes: 1440, deadline_hour: 19 }
//   "3rd Day 5 pm"      → { tat_minutes: 4320, deadline_hour: 17 }
//   "5th Day 7 pm"      → { tat_minutes: 7200, deadline_hour: 19 }
//   "22 Days"           → { tat_minutes: 31680 }
//   "48 Hrs"            → { tat_minutes: 2880 }
//   "28 Days"           → { tat_minutes: 40320 }
// ────────────────────────────────────────────────────────────────

/**
 * @param {string} tatStr – e.g. "3rd Day 5 pm"
 * @returns {{ tat_minutes: number, deadline_hour?: number }}
 */
function parseTAT(tatStr) {
  if (!tatStr || typeof tatStr !== 'string') {
    return { tat_minutes: 1440 }; // default 24h
  }

  const raw = tatStr.trim();
  const lower = raw.toLowerCase();

  // ── "Refer Individual Test" / complex multi-part ───────────
  if (lower.includes('refer individual') || lower.includes('as per individual')) {
    return { tat_minutes: 1440 }; // default 24h
  }

  // ── Handle combined TATs (take the first)
  // "Preliminary report 48 to 72 Hrs, Final report 5th Day" → use "5th Day"
  if (lower.includes('final report')) {
    const finalMatch = raw.match(/final\s+report\s+(.+)/i);
    if (finalMatch) return parseTAT(finalMatch[1].trim());
  }
  // "Prelimanary Next Day, Final report 5th Day" → use final
  if (lower.includes(',')) {
    const parts = raw.split(',');
    // Use last part as the authoritative TAT
    return parseTAT(parts[parts.length - 1].trim());
  }

  // ── "Same Day"  or  "Same Day 5 Hrs"  or  "Same Day 6 PM" ─
  if (lower.startsWith('same day') || lower.startsWith('same day')) {
    // "Same Day 5 Hrs"
    const hrsMatch = raw.match(/(\d+)\s*(?:hrs?|hours?)/i);
    if (hrsMatch) {
      return { tat_minutes: parseInt(hrsMatch[1], 10) * 60 };
    }
    // "Same Day 7 pm"
    const timeMatch = raw.match(/(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      if (timeMatch[2].toLowerCase() === 'pm' && h !== 12) h += 12;
      if (timeMatch[2].toLowerCase() === 'am' && h === 12) h = 0;
      return { tat_minutes: 0, deadline_hour: h };
    }
    return { tat_minutes: 0 };
  }

  // ── "Same day 6 hrs" (variation) ──────────────────────────
  if (lower.startsWith('same day')) {
    const hrsMatch = raw.match(/(\d+)\s*(?:hrs?|hours?)/i);
    if (hrsMatch) return { tat_minutes: parseInt(hrsMatch[1], 10) * 60 };
    return { tat_minutes: 0 };
  }

  // ── "Next Day" or "Next Day 8 pm" ─────────────────────────
  if (lower.startsWith('next day') || lower.startsWith('next  day')) {
    const timeMatch = raw.match(/(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      if (timeMatch[2].toLowerCase() === 'pm' && h !== 12) h += 12;
      if (timeMatch[2].toLowerCase() === 'am' && h === 12) h = 0;
      return { tat_minutes: 1440, deadline_hour: h };
    }
    return { tat_minutes: 1440 };
  }

  // ── "3rd Day 5 pm" or "5th Day 7 pm" etc ──────────────────
  const nthDay = raw.match(/(\d+)(?:st|nd|rd|th)?\s*day\s*(\d{1,2}\s*(?:am|pm))?/i);
  if (nthDay) {
    const days = parseInt(nthDay[1], 10);
    const minutes = days * 24 * 60;
    if (nthDay[2]) {
      const tMatch = nthDay[2].trim().match(/(\d{1,2})\s*(am|pm)/i);
      if (tMatch) {
        let h = parseInt(tMatch[1], 10);
        if (tMatch[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        if (tMatch[2].toLowerCase() === 'am' && h === 12) h = 0;
        return { tat_minutes: minutes, deadline_hour: h };
      }
    }
    return { tat_minutes: minutes };
  }

  // ── "48 Hrs" or "48 to 72 Hrs" ────────────────────────────
  const hrsMatch = raw.match(/(\d+)\s*(?:hrs?|hours?)/i);
  if (hrsMatch) {
    return { tat_minutes: parseInt(hrsMatch[1], 10) * 60 };
  }

  // ── "22 Days" or "28 Days" ─────────────────────────────────
  const daysPlain = raw.match(/^(\d+)\s*days?$/i);
  if (daysPlain) {
    return { tat_minutes: parseInt(daysPlain[1], 10) * 24 * 60 };
  }

  // ── Day-specific deadlines "Mon 8 pm", "Tue 7 pm" ─────────
  const dayTime = raw.match(/(?:mon|tue|wed|thu|fri|sat|sun)\w*\s+(\d{1,2})\s*(am|pm)/i);
  if (dayTime) {
    let h = parseInt(dayTime[1], 10);
    if (dayTime[2].toLowerCase() === 'pm' && h !== 12) h += 12;
    if (dayTime[2].toLowerCase() === 'am' && h === 12) h = 0;
    // Approximate as next-day
    return { tat_minutes: 1440, deadline_hour: h };
  }

  // ── Genexpert-like: "Genexpert Next Day & Culture 6 Weeks" ─
  if (lower.includes('weeks') || lower.includes('week')) {
    const wMatch = raw.match(/(\d+)\s*weeks?/i);
    if (wMatch) return { tat_minutes: parseInt(wMatch[1], 10) * 7 * 24 * 60 };
  }

  // ── Fallback: 24h ─────────────────────────────────────────
  return { tat_minutes: 1440 };
}

module.exports = { parseTAT };
