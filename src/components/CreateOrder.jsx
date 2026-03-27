import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { newId, getUniqueCustomers, computeOrderTotals, formatINR, toISTDateString } from '../utils';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const EMPTY_ITEM = { name: '', costPrice: '', sellingPrice: '', qty: 1 };

export default function CreateOrder({ orders, customers, addOrder }) {
  const nav = useNavigate();

  // Merge stored customers + customers from old orders
  const storedCustomers = customers || [];
  const orderCustomers = getUniqueCustomers(orders);
  const allCustomers = [...storedCustomers];
  orderCustomers.forEach(oc => {
    if (!allCustomers.find(c => c.name.trim().toLowerCase() === oc.name.trim().toLowerCase())) {
      allCustomers.push(oc);
    }
  });
  allCustomers.sort((a, b) => a.name.localeCompare(b.name));

  const [isNew, setIsNew] = useState(allCustomers.length === 0);
  const [selCust, setSelCust] = useState('');
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', date: toISTDateString(), shippingCost: '', shippingStatus: 'ordered', notes: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const nameRef = useRef(null);
  const item0Ref = useRef(null);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCust = (e) => {
    const v = e.target.value;
    if (v === '__new__') {
      setIsNew(true); setSelCust('');
      setForm(f => ({ ...f, customerName: '', customerPhone: '', customerAddress: '' }));
      setTimeout(() => nameRef.current?.focus(), 50);
    } else {
      setIsNew(false); setSelCust(v);
      const c = allCustomers.find(c => c.name === v);
      if (c) setForm(f => ({ ...f, customerName: c.name, customerPhone: c.phone || '', customerAddress: c.address || '' }));
      // Auto-advance to first item
      setTimeout(() => item0Ref.current?.focus(), 50);
    }
  };

  const updateItem = (i, k, v) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem = () => setItems(p => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => { if (items.length > 1) setItems(p => p.filter((_, idx) => idx !== i)); };
  const totals = computeOrderTotals({ items, shippingCost: form.shippingCost });

  const submit = (e) => {
    e.preventDefault();
    const name = isNew ? form.customerName : selCust;
    if (!name?.trim()) return alert('Enter customer name.');
    if (!items.some(i => i.name?.trim())) return alert('Add at least one item.');
    addOrder({
      id: newId(),
      date: new Date(form.date + 'T00:00:00+05:30').toISOString(),
      customerName: name.trim(),
      customerPhone: form.customerPhone,
      customerAddress: form.customerAddress,
      items: items.filter(i => i.name?.trim()),
      shippingCost: form.shippingCost,
      shippingStatus: form.shippingStatus,
      notes: form.notes,
    });
    nav('/orders');
  };

  return (
    <div className="page-shell fade-in">
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={14} /> Back</button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>New Order</h2>
      </div>

      <form onSubmit={submit} className="flex-col gap-3">
        <div className="section-label">Customer</div>

        {allCustomers.length > 0 && (
          <div className="form-group">
            <label>Select customer</label>
            <select value={isNew ? '__new__' : selCust} onChange={handleCust}>
              <option value="" disabled>Choose...</option>
              {allCustomers.map(c => <option key={c.name} value={c.name}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>)}
              <option value="__new__">+ New customer</option>
            </select>
          </div>
        )}

        {isNew && (
          <>
            <div className="form-group">
              <label>Name *</label>
              <input ref={nameRef} name="customerName" value={form.customerName} onChange={handle} required={isNew} placeholder="Customer name"
                onKeyDown={e => { if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); item0Ref.current?.focus(); }}} />
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label>Phone</label><input type="tel" name="customerPhone" value={form.customerPhone} onChange={handle} placeholder="Phone" /></div>
              <div className="form-group"><label>Address</label><input name="customerAddress" value={form.customerAddress} onChange={handle} placeholder="Address" /></div>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Order Date</label>
          <input type="date" name="date" value={form.date} onChange={handle} />
        </div>

        <div className="section-label">Particulars</div>
        {items.map((item, i) => (
          <div key={i} className="card card-sm" style={{ position: 'relative', background: 'var(--bg-2)' }}>
            <div className="form-group">
              <label>Item {i + 1}</label>
              <input ref={i === 0 ? item0Ref : null} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Item name" />
            </div>
            <div className="form-grid-3">
              <div className="form-group"><label>CP</label><input type="number" value={item.costPrice} onChange={e => updateItem(i, 'costPrice', e.target.value)} min="0" placeholder="0" /></div>
              <div className="form-group"><label>SP</label><input type="number" value={item.sellingPrice} onChange={e => updateItem(i, 'sellingPrice', e.target.value)} min="0" placeholder="0" /></div>
              <div className="form-group"><label>Qty</label><input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} min="1" placeholder="1" /></div>
            </div>
            {items.length > 1 && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)} style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', padding: '0.2rem 0.35rem' }}><Trash2 size={12} /></button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm w-full" onClick={addItem}><Plus size={12} /> Add Item</button>

        <div className="section-label">Shipping</div>
        <div className="form-grid-2">
          <div className="form-group"><label>Shipping (Rs.)</label><input type="number" name="shippingCost" value={form.shippingCost} onChange={handle} min="0" placeholder="0" /></div>
          <div className="form-group"><label>Status</label>
            <select name="shippingStatus" value={form.shippingStatus} onChange={handle}>
              <option value="ordered">Ordered</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        <div className="card card-sm" style={{ background: 'var(--bg-2)' }}>
          <div className="finance-row"><span className="fr-label">CP total</span><span className="fr-val">Rs.{formatINR(totals.totalCP)}</span></div>
          <div className="finance-row"><span className="fr-label">SP total</span><span className="fr-val">Rs.{formatINR(totals.totalSP)}</span></div>
          <div className="finance-row"><span className="fr-label">Shipping</span><span className="fr-val">Rs.{formatINR(totals.shipping)}</span></div>
          <div className="finance-row" style={{ fontWeight: 700, borderTop: '1px solid var(--border-hi)', paddingTop: '0.4rem' }}>
            <span className="fr-label" style={{ fontWeight: 700, color: 'var(--txt)' }}>Profit</span>
            <span className="fr-val" style={{ color: totals.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>Rs.{formatINR(totals.profit)}</span>
          </div>
          <div className="finance-row"><span className="fr-label">Customer pays</span><span className="fr-val">Rs.{formatINR(totals.customerOwes)}</span></div>
          <div className="finance-row"><span className="fr-label">You pay supplier</span><span className="fr-val">Rs.{formatINR(totals.supplierOwes)}</span></div>
        </div>

        <div className="form-group"><label>Notes</label><textarea name="notes" value={form.notes} onChange={handle} rows={2} placeholder="Extra details..." /></div>
        <button type="submit" className="btn btn-primary btn-full">Create Order</button>
      </form>
    </div>
  );
}
