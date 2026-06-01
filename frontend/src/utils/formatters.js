const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

export function formatDate(value) {
  const formatted = dateFormatter.format(new Date(value));
  // Keep time and AM/PM on one line in narrow table cells
  return formatted.replace(/(\d{1,2}:\d{2})\s(AM|PM)/i, "$1\u00A0$2");
}
