const IST_TIMEZONE = 'Asia/Kolkata';

function getTimeZoneParts(date, timeZone = IST_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const value = (type) => parts.find((p) => p.type === type)?.value || '00';
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

// ─── IST Time helpers ─────────────────────────────────────
// IST = UTC+5:30
export function nowIST() {
  const now = new Date();
  const parts = getTimeZoneParts(now);
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+05:30`);
}

export function toISTDateString() {
  const p = getTimeZoneParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function toISTDateTimeString() {
  const p = getTimeZoneParts(new Date());
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function istDateInputToISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  return new Date(`${value}T00:00:00+05:30`).toISOString();
}

export function istDateTimeInputToISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || '')) return null;
  return new Date(`${value}:00+05:30`).toISOString();
}

export function isoToISTDateTimeInput(iso) {
  if (!iso) return toISTDateTimeString();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return toISTDateTimeString();
  const p = getTimeZoneParts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// ─── Formatting ─────────────────────────────────────────
export function formatINR(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', timeZone: IST_TIMEZONE });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: IST_TIMEZONE, hour12: true });
}

// ─── Badges ─────────────────────────────────────────────
export function shippingBadge(status) {
  switch (status) {
    case 'ordered':    return { cls: 'badge-blue',  label: 'Ordered' };
    case 'in_transit': return { cls: 'badge-amber', label: 'In Transit' };
    case 'delivered':  return { cls: 'badge-green', label: 'Delivered' };
    default:           return { cls: 'badge-blue',  label: status || 'Ordered' };
  }
}

export function paymentBadge(status) {
  switch (status) {
    case 'unpaid':    return { cls: 'badge-red',   label: 'Unpaid' };
    case 'partially': return { cls: 'badge-amber', label: 'Partial' };
    case 'paid':      return { cls: 'badge-green', label: 'Paid' };
    case 'overpaid':  return { cls: 'badge-brand', label: 'Overpaid' };
    default:          return { cls: 'badge-red',   label: status || 'Unpaid' };
  }
}

// ─── Order math ─────────────────────────────────────────
// items[]: { name, costPrice, sellingPrice, qty }
// Profit = sum((SP - CP) * qty) — this is MARGIN, independent of payment
// customerOwes = totalSP + shipping
// supplierOwes = totalCP + shipping

export function computeOrderTotals(order) {
  const items = order.items || [];
  const totalCP = items.reduce((s, i) => s + (Number(i.costPrice) || 0) * (Number(i.qty) || 1), 0);
  const totalSP = items.reduce((s, i) => s + (Number(i.sellingPrice) || 0) * (Number(i.qty) || 1), 0);
  const shipping = Number(order.shippingCost) || 0;
  const profit = totalSP - totalCP;
  const customerOwes = totalSP + shipping;
  const supplierOwes = totalCP + shipping;
  return { totalCP, totalSP, shipping, profit, customerOwes, supplierOwes };
}

// ─── Transaction math ───────────────────────────────────
// credit = money received from buyer
// debit = money paid to supplier

export function totalCreditsForOrder(orderId, txns) {
  return txns.filter(t => t.orderId === orderId && t.type === 'credit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
}
export function totalDebitsForOrder(orderId, txns) {
  return txns.filter(t => t.orderId === orderId && t.type === 'debit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
}

export function derivePaymentStatus(order, txns) {
  const { customerOwes } = computeOrderTotals(order);
  const received = totalCreditsForOrder(order.id, txns);
  const pending = Math.max(0, customerOwes - received);
  const excess = Math.max(0, received - customerOwes);
  let status = 'unpaid';
  if (received <= 0) status = 'unpaid';
  else if (received < customerOwes) status = 'partially';
  else status = received > customerOwes ? 'overpaid' : 'paid';
  return { status, received, customerOwes, pending, excess };
}

export function deriveSupplierStatus(order, txns) {
  const { supplierOwes } = computeOrderTotals(order);
  const paid = totalDebitsForOrder(order.id, txns);
  const remaining = Math.max(0, supplierOwes - paid);
  let status = 'unpaid';
  if (paid <= 0) status = 'unpaid';
  else if (paid < supplierOwes) status = 'partially';
  else status = 'paid';
  return { status, paid, supplierOwes, remaining };
}

// ─── Helpers ────────────────────────────────────────────
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function safeName(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value || '');
  } catch {
    return typeof value === 'string' ? value : '';
  }
}

export function getUniqueCustomers(orders) {
  const map = {};
  (orders || []).forEach(o => {
    const customerName = safeName(o?.customerName);
    if (!customerName) return;
    const key = customerName.toLowerCase();
    if (!map[key]) {
      map[key] = { name: customerName, phone: safeName(o?.customerPhone), address: safeName(o?.customerAddress) };
    } else {
      if (o?.customerPhone && !map[key].phone) map[key].phone = safeName(o.customerPhone);
      if (o?.customerAddress && !map[key].address) map[key].address = safeName(o.customerAddress);
    }
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}

export function orderItemNames(order) {
  return (order.items || []).map(i => i.name).filter(Boolean).join(', ') || 'Untitled';
}
