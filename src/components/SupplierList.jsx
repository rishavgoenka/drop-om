import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { computeOrderTotals, deriveSupplierStatus, formatINR, newId } from '../utils';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

function ContactModal({ initial, onSave, onClose, title }) {
  const [form, setForm] = useState(initial || { name: '', phone: '', address: '', notes: '' });
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = e => { e.preventDefault(); if (!form.name.trim()) return alert('Name required.'); onSave(form); onClose(); };
  return createPortal(
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={submit} className="flex-col gap-3">
          <div className="form-group"><label>Name *</label><input name="name" value={form.name} onChange={handle} required autoFocus placeholder="Supplier name" /></div>
          <div className="form-group"><label>Phone / WhatsApp</label><input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="Phone" /></div>
          <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={handle} placeholder="Address" /></div>
          <div className="form-group"><label>Notes</label><input name="notes" value={form.notes || ''} onChange={handle} placeholder="Product categories, notes..." /></div>
          <button type="submit" className="btn btn-primary btn-full">Save</button>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function SupplierList({ orders, transactions, suppliers, addSupplier, updateSupplier, deleteSupplier }) {
  const nav = useNavigate();
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const storedSuppliers = suppliers || [];

  const enriched = storedSuppliers.map(s => {
    // Match orders where a debit transaction partyName matches supplier name
    const supplierTxns = transactions.filter(t => t.type === 'debit' && (t.partyName || '').trim().toLowerCase() === s.name.trim().toLowerCase());
    const totalPaid = supplierTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const orderIds = [...new Set(supplierTxns.map(t => t.orderId))];
    return { ...s, orderCount: orderIds.length, totalPaid };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = (form) => addSupplier({ id: newId(), name: form.name, phone: form.phone, address: form.address, notes: form.notes });
  const handleEdit = (form) => updateSupplier({ ...modal.supplier, name: form.name, phone: form.phone, address: form.address, notes: form.notes });

  return (
    <div className="page-shell fade-in">
      <div className="flex justify-between items-center">
        <div className="page-header"><h2>Suppliers</h2><p>{enriched.length} suppliers</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'add' })}><Plus size={14} /> Add</button>
      </div>

      {enriched.length === 0 ? (
        <div className="empty-state">No suppliers yet. Add one to track balances.</div>
      ) : (
        <div className="flex-col gap-2">
          {enriched.map(s => (
            <div key={s.id} className="order-item" style={{ cursor: 'default' }}>
              <div className="order-main" onClick={() => nav(`/suppliers/${encodeURIComponent(s.name)}`)} style={{ cursor: 'pointer' }}>
                <div className="item-name">{s.name}</div>
                {s.phone && <div className="cust-name">{s.phone}</div>}
                {s.notes && <div className="cust-name" style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>{s.notes}</div>}
                <div className="badges">
                  <span className="badge badge-brand">{s.orderCount} order{s.orderCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="order-right">
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--green)' }}>Rs.{formatINR(s.totalPaid)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--txt-3)', marginTop: '0.1rem' }}>paid out</div>
                <div className="flex gap-1 mt-2">
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', supplier: s }); }} style={{ padding: '0.2rem 0.35rem' }}><Pencil size={11} /></button>
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id); }} style={{ padding: '0.2rem 0.35rem' }}><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.mode === 'add' && <ContactModal title="New Supplier" onSave={handleAdd} onClose={() => setModal(null)} />}
      {modal?.mode === 'edit' && <ContactModal title="Edit Supplier" initial={modal.supplier} onSave={handleEdit} onClose={() => setModal(null)} />}
      {confirmDelete && <ConfirmModal message="Are you sure you want to delete this supplier? This action cannot be undone." onConfirm={() => { deleteSupplier(confirmDelete); setConfirmDelete(null); }} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
