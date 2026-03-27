import React, { useState, useEffect } from 'react';
import { computeFinancials, shippingBadge, paymentBadge, formatINR, formatDate } from '../utils';

const EMPTY_ORDER = {
  id: null,
  date: '',
  itemName: '',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  supplierPrice: '',
  shippingCost: '',
  sellingPrice: '',
  amountPaidToSupplier: '',
  amountReceivedFromBuyer: '',
  shippingStatus: 'ordered',
  paymentStatus: 'due',
  notes: '',
};

export default function OrderForm({ initialOrder, onSave, onDelete, onClose }) {
  const isEdit = Boolean(initialOrder?.id);
  const [form, setForm] = useState({ ...EMPTY_ORDER, ...(initialOrder || {}) });

  const fin = computeFinancials(form);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: form.id || Date.now().toString(),
      date: form.date || new Date().toISOString(),
      profit: fin.profit,
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Delete this order?')) {
      onDelete(form.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{isEdit ? 'Edit Order' : 'New Order'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        </div>

        <form onSubmit={submit} className="flex-col gap-3">

          {/* Item */}
          <div className="section-label">Item</div>
          <div className="form-group">
            <label>Item Name *</label>
            <input name="itemName" value={form.itemName} onChange={handle} required placeholder="e.g. Blue Silk Saree" />
          </div>

          {/* Customer */}
          <div className="section-label" style={{ marginTop: '0.5rem' }}>Customer</div>
          <div className="form-group">
            <label>Name *</label>
            <input name="customerName" value={form.customerName} onChange={handle} required placeholder="Customer name" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="customerPhone" value={form.customerPhone} onChange={handle} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea name="customerAddress" value={form.customerAddress} onChange={handle} rows={1} placeholder="Delivery address" />
            </div>
          </div>

          {/* Pricing */}
          <div className="section-label" style={{ marginTop: '0.5rem' }}>Pricing</div>
          <div className="form-grid-3">
            <div className="form-group">
              <label>Supplier Price (Rs.)</label>
              <input type="number" name="supplierPrice" value={form.supplierPrice} onChange={handle} required min="0" placeholder="0" />
            </div>
            <div className="form-group">
              <label>Shipping (Rs.)</label>
              <input type="number" name="shippingCost" value={form.shippingCost} onChange={handle} required min="0" placeholder="0" />
            </div>
            <div className="form-group">
              <label>Selling Price (Rs.)</label>
              <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handle} required min="0" placeholder="0" />
            </div>
          </div>

          {/* Live profit */}
          <div className="profit-box">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Profit</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', marginTop: '0.15rem' }}>
                Customer pays Rs.{formatINR(fin.customerTotal)} &nbsp;|&nbsp; You pay supplier Rs.{formatINR(fin.supplierTotal)}
              </div>
            </div>
            <div className={`profit-val ${fin.profit >= 0 ? '' : ''}`}
                 style={{ color: fin.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
              Rs.{formatINR(fin.profit)}
            </div>
          </div>

          {/* Payment tracking */}
          <div className="section-label" style={{ marginTop: '0.5rem' }}>Payment Tracking</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Paid to Supplier (Rs.)</label>
              <input type="number" name="amountPaidToSupplier" value={form.amountPaidToSupplier} onChange={handle} min="0" placeholder={`Max ${formatINR(fin.supplierTotal)}`} />
            </div>
            <div className="form-group">
              <label>Received from Buyer (Rs.)</label>
              <input type="number" name="amountReceivedFromBuyer" value={form.amountReceivedFromBuyer} onChange={handle} min="0" placeholder={`Max ${formatINR(fin.customerTotal)}`} />
            </div>
          </div>

          {/* Pending summary */}
          {(fin.pendingToPay !== 0 || fin.pendingToCollect !== 0) && (
            <div className="card card-sm" style={{ background: 'var(--bg-2)' }}>
              <div className="finance-row">
                <span className="fr-label">Still to pay supplier</span>
                <span className="fr-val" style={{ color: fin.pendingToPay > 0 ? 'var(--red)' : 'var(--green)' }}>
                  Rs.{formatINR(Math.abs(fin.pendingToPay))} {fin.pendingToPay > 0 ? 'pending' : 'overpaid'}
                </span>
              </div>
              <div className="finance-row">
                <span className="fr-label">Still to collect from buyer</span>
                <span className="fr-val" style={{ color: fin.pendingToCollect > 0 ? 'var(--amber)' : 'var(--green)' }}>
                  Rs.{formatINR(Math.abs(fin.pendingToCollect))} {fin.pendingToCollect > 0 ? 'pending' : 'excess'}
                </span>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="section-label" style={{ marginTop: '0.5rem' }}>Status</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Shipping Status</label>
              <select name="shippingStatus" value={form.shippingStatus} onChange={handle}>
                <option value="ordered">Ordered</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Status</label>
              <select name="paymentStatus" value={form.paymentStatus} onChange={handle}>
                <option value="due">Due</option>
                <option value="adv">Advance</option>
                <option value="partially">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea name="notes" value={form.notes} onChange={handle} rows={2} placeholder="Any extra details..." />
          </div>

          {/* Actions */}
          <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-full">
              {isEdit ? 'Save Changes' : 'Create Order'}
            </button>
            {isEdit && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
