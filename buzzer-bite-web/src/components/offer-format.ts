export function storeInitial(name: string) {
  const letter = name.trim().charAt(0);
  return letter ? letter.toLocaleUpperCase("es") : "?";
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, "");
}

function formatClock(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const label = minute === 0 ? `${hour12}` : `${hour12}:${String(minute).padStart(2, "0")}`;
  return { period, label };
}

export function pickupLabel(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const from = formatClock(start);
  const to = formatClock(end);
  if (!from || !to) return null;
  if (from.period === to.period) return `${from.label}-${to.label} ${to.period}`;
  return `${from.label} ${from.period}-${to.label} ${to.period}`;
}
