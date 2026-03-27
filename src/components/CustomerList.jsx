import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { computeOrderTotals, derivePaymentStatus, formatINR, safeName } from '../utils';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

function ContactModal({ initial, onSave, onClose, title }) {
  const [form, setForm] = useState(initial || { name: '', phone: '', address: '', notes: '' });
  const [error, setError] = useState('');
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = e => {
    e.preventDefault();
    setError('');
    if (!safeName(form.name)) {
      setError('Name is required.');
      return;
    }
    const res = onSave(form);
    if (res?.ok === false) {
      setError(res.reason || 'Unable to save customer.');
      return;
    }
    onClose();
  };
  return createPortal(
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={submit} className="flex-col gap-3">
          {error && <div className="form-error">{error}</div>}
          <div className="form-group"><label>Name *</label><input name="name" value={form.name} onChange={handle} required autoFocus placeholder="Name" /></div>
          <div className="form-group"><label>Phone</label><input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="Phone" /></div>
          <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={handle} placeholder="Address" /></div>
          <div className="form-group"><label>Notes</label><input name="notes" value={form.notes || ''} onChange={handle} placeholder="Extra info" /></div>
          <button type="submit" className="btn btn-primary btn-full">Save</button>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function CustomerList({ orders, transactions, customers, addCustomer, updateCustomer, deleteCustomer }) {
  const nav = useNavigate();
  const [modal, setModal] = useState(null); // null | { mode: 'add' | 'edit', customer? }
  const [confirmDelete, setConfirmDelete] = useState(null); // customer id
  const [actionError, setActionError] = useState('');

  const storedCustomers = customers || [];

  const enriched = [...storedCustomers].map(c => {
    const cKey = safeName(c?.name).toLowerCase();
    const custOrders = orders.filter(o => safeName(o?.customerName).toLowerCase() === cKey);
    let totalValue = 0, totalProfit = 0, pendingBuyer = 0;
    custOrders.forEach(o => {
      const t = computeOrderTotals(o);
      const ps = derivePaymentStatus(o, transactions);
      totalValue += t.customerOwes;
      totalProfit += t.profit;
      pendingBuyer += ps.pending;
    });
    return { ...c, orderCount: custOrders.length, totalValue, totalProfit, pendingBuyer };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = (form) => addCustomer({ name: form.name, phone: form.phone, address: form.address, notes: form.notes });
  const handleEdit = (form) => {
    updateCustomer({ ...modal.customer, name: safeName(form.name), phone: safeName(form.phone), address: safeName(form.address), notes: safeName(form.notes) });
    return { ok: true };
  };

  return (
    <div className="page-shell fade-in">
      <div className="flex justify-between items-center">
        <div className="page-header"><h2>Buyers</h2><p>{enriched.length} customers</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => { setActionError(''); setModal({ mode: 'add' }); }}><Plus size={14} /> Add</button>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      {enriched.length === 0 ? (
        <div className="empty-state">No customers yet. Add one or create an order.</div>
      ) : (
        <div className="flex-col gap-2">
          {enriched.map(c => (
            <div key={c.id || c.name} className="order-item" style={{ cursor: 'default' }}>
              <div className="order-main" onClick={() => nav(`/customers/${encodeURIComponent(safeName(c.name))}`)} style={{ cursor: 'pointer' }}>
                <div className="item-name">{safeName(c.name)}</div>
                {c.phone && <div className="cust-name">{c.phone}</div>}
                <div className="badges">
                  <span className="badge badge-brand">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</span>
                  {c.pendingBuyer > 0 && <span className="badge badge-amber">Collect Rs.{formatINR(c.pendingBuyer)}</span>}
                </div>
              </div>
              <div className="order-right">
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Rs.{formatINR(c.totalValue)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--green)', marginTop: '0.1rem' }}>+Rs.{formatINR(c.totalProfit)}</div>
                <div className="flex gap-1 mt-2">
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', customer: c }); }} style={{ padding: '0.2rem 0.35rem' }}><Pencil size={11} /></button>
                  {c.id && <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(c.id); }} style={{ padding: '0.2rem 0.35rem' }}><Trash2 size={11} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.mode === 'add' && <ContactModal title="New Customer" onSave={handleAdd} onClose={() => setModal(null)} />}
      {modal?.mode === 'edit' && <ContactModal title="Edit Customer" initial={modal.customer} onSave={handleEdit} onClose={() => setModal(null)} />}
      {confirmDelete && (
        <ConfirmModal
          message="Delete customer? This works only when no linked orders or credit transactions exist."
          onConfirm={() => {
            const res = deleteCustomer(confirmDelete);
            if (res?.ok === false) setActionError(res.reason || 'Unable to delete customer.');
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
