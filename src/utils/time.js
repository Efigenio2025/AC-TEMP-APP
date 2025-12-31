const pad = (value, length = 2) => String(value).padStart(length, '0');

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Returns the "night ops" date, which sticks to the previous calendar day
// until the specified rollover hour (local time). This keeps overnight shifts
// from flipping to a new "night" at midnight.
export function localNightDateString(date = new Date(), rolloverHour = 12) {
  const local = new Date(date);
  if (local.getHours() < rolloverHour) {
    local.setDate(local.getDate() - 1);
  }
  return localDateString(local);
}

export function localTimestamp(date = new Date()) {
  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes > 0 ? '-' : '+';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);

  return `${localDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}.${pad(date.getMilliseconds(), 3)}${sign}${offsetHours}:${offsetMins}`;
}
