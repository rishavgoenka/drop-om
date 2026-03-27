// Shared formatting helpers

export function formatINR(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

export function shippingBadge(status) {
  switch (status) {
    case 'ordered':    return { cls: 'badge-blue',  label: 'Ordered' };
    case 'in_transit': return { cls: 'badge-amber', label: 'In Transit' };
    case 'delivered':  return { cls: 'badge-green', label: 'Delivered' };
    default:           return { cls: 'badge-blue',  label: status };
  }
}

export function paymentBadge(status) {
  switch (status) {
    case 'due':       return { cls: 'badge-red',   label: 'Due' };
    case 'adv':       return { cls: 'badge-brand', label: 'Advance' };
    case 'partially': return { cls: 'badge-amber', label: 'Partial' };
    case 'paid':      return { cls: 'badge-green', label: 'Paid' };
    default:          return { cls: 'badge-red',   label: status };
  }
}

/**
 * Given an order, compute key financial fields.
 *
 * Supplier total owed by us   = supplierPrice + shippingCost
 * Customer total owed to us   = sellingPrice  + shippingCost
 * Profit per order            = sellingPrice  - supplierPrice
 * Pending to collect          = customerTotal - amountReceivedFromBuyer
 * Pending to pay supplier     = supplierTotal - amountPaidToSupplier
 */
export function computeFinancials(order) {
  const supplierPrice  = Number(order.supplierPrice)  || 0;
  const shippingCost   = Number(order.shippingCost)   || 0;
  const sellingPrice   = Number(order.sellingPrice)   || 0;
  const paidToSupplier     = Number(order.amountPaidToSupplier)    || 0;
  const receivedFromBuyer  = Number(order.amountReceivedFromBuyer) || 0;

  const supplierTotal  = supplierPrice + shippingCost;
  const customerTotal  = sellingPrice  + shippingCost;
  const profit         = sellingPrice  - supplierPrice;
  const pendingToCollect = customerTotal  - receivedFromBuyer;
  const pendingToPay     = supplierTotal  - paidToSupplier;

  return { supplierTotal, customerTotal, profit, pendingToCollect, pendingToPay, paidToSupplier, receivedFromBuyer };
}
