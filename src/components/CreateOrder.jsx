import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { newId, getUniqueCustomers, computeOrderTotals, formatINR, toISTDateString, istDateInputToISO, safeName } from '../utils';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import InHouseDropdown from './InHouseDropdown';

const EMPTY_ITEM = { name: '', costPrice: '', sellingPrice: '', qty: 1 };
const SHIPPING_STATUS_OPTIONS = [
  { value: 'ordered', label: 'Ordered' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

export default function CreateOrder({ orders, customers, suppliers, addOrder, addCustomer, addSupplier }) {
  const nav = useNavigate();

  // Merge stored customers + customers from old orders
  const storedCustomers = customers || [];
  const orderCustomers = getUniqueCustomers(orders);
  const allCustomers = [...storedCustomers];
  orderCustomers.forEach(oc => {
    const ocKey = safeName(oc?.name).toLowerCase();
    if (!ocKey) return;
    if (!allCustomers.find(c => safeName(c?.name).toLowerCase() === ocKey)) {
      allCustomers.push(oc);
    }
  });
  allCustomers.sort((a, b) => safeName(a?.name).localeCompare(safeName(b?.name)));

  // Merge stored suppliers + suppliers from old orders
  const storedSuppliers = suppliers || [];
  const orderSuppliers = [];
  (orders || []).forEach((o) => {
    const name = safeName(o?.supplierName);
    if (!name) return;
    const key = name.toLowerCase();
    if (!orderSuppliers.find((s) => safeName(s?.name).toLowerCase() === key)) {
      orderSuppliers.push({
        name,
        phone: safeName(o?.supplierPhone),
        address: safeName(o?.supplierAddress),
      });
    }
  });
  const allSuppliers = [...storedSuppliers];
  orderSuppliers.forEach((s) => {
    const sKey = safeName(s?.name).toLowerCase();
    if (!sKey) return;
    if (!allSuppliers.find((x) => safeName(x?.name).toLowerCase() === sKey)) {
      allSuppliers.push(s);
    }
  });
  allSuppliers.sort((a, b) => safeName(a?.name).localeCompare(safeName(b?.name)));

  const [isNew, setIsNew] = useState(allCustomers.length === 0);
  const [selCust, setSelCust] = useState('');
  const [isNewSupplier, setIsNewSupplier] = useState(allSuppliers.length === 0);
  const [selSupplier, setSelSupplier] = useState('');
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', supplierName: '', supplierPhone: '', supplierAddress: '', date: toISTDateString(), shippingCost: '', shippingStatus: 'ordered', notes: '' });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [formError, setFormError] = useState('');

  const nameRef = useRef(null);
  const supplierNameRef = useRef(null);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCust = (v) => {
    if (v === '__new__') {
      setIsNew(true); setSelCust('');
      setForm(f => ({ ...f, customerName: '', customerPhone: '', customerAddress: '' }));
      setTimeout(() => nameRef.current?.focus(), 50);
    } else {
      setIsNew(false); setSelCust(v);
      const c = allCustomers.find(c => c.name === v);
      if (c) setForm(f => ({ ...f, customerName: c.name, customerPhone: c.phone || '', customerAddress: c.address || '' }));
    }
  };

  const handleSupplier = (v) => {
    if (v === '__new__') {
      setIsNewSupplier(true); setSelSupplier('');
      setForm(f => ({ ...f, supplierName: '', supplierPhone: '', supplierAddress: '' }));
      setTimeout(() => supplierNameRef.current?.focus(), 50);
      return;
    }
    setIsNewSupplier(false); setSelSupplier(v);
    const s = allSuppliers.find((x) => safeName(x?.name) === v);
    if (s) {
      setForm(f => ({ ...f, supplierName: safeName(s.name), supplierPhone: safeName(s.phone), supplierAddress: safeName(s.address) }));
    }
  };

  const customerOptions = [
    ...allCustomers.map((c) => ({
      value: safeName(c?.name),
      label: safeName(c?.name),
      meta: safeName(c?.phone),
    })),
    { value: '__new__', label: '+ New customer' },
  ];

  const supplierOptions = [
    ...allSuppliers.map((s) => ({
      value: safeName(s?.name),
      label: safeName(s?.name),
      meta: safeName(s?.phone),
    })),
    { value: '__new__', label: '+ New supplier' },
  ];

  const updateItem = (i, k, v) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem = () => setItems(p => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => { if (items.length > 1) setItems(p => p.filter((_, idx) => idx !== i)); };
  const totals = computeOrderTotals({ items, shippingCost: form.shippingCost });

  const submit = (e) => {
    e.preventDefault();
    setFormError('');
    const name = isNew ? form.customerName : selCust;
    const normalizedName = safeName(name);
    const supplierName = isNewSupplier ? form.supplierName : selSupplier;
    const normalizedSupplierName = safeName(supplierName || normalizedName);

    if (!normalizedName) {
      setFormError('Enter customer name.');
      return;
    }

    if (!normalizedSupplierName) {
      setFormError('Enter supplier name.');
      return;
    }

    const validItems = items.filter((i) => safeName(i?.name));
    if (validItems.length === 0) {
      setFormError('Add at least one item with a name.');
      return;
    }

    const dateISO = istDateInputToISO(form.date);
    if (!dateISO) {
      setFormError('Enter a valid order date.');
      return;
    }

    if (isNew) {
      const existsInStored = storedCustomers.some(
        (c) => safeName(c?.name).toLowerCase() === normalizedName.toLowerCase(),
      );
      if (!existsInStored) {
        addCustomer({
          name: normalizedName,
          phone: safeName(form.customerPhone),
          address: safeName(form.customerAddress),
        });
      }
    }

    if (isNewSupplier) {
      const existsSupplier = storedSuppliers.some(
        (s) => safeName(s?.name).toLowerCase() === normalizedSupplierName.toLowerCase(),
      );
      if (!existsSupplier) {
        addSupplier({
          name: normalizedSupplierName,
          phone: safeName(form.supplierPhone),
          address: safeName(form.supplierAddress),
        });
      }
    }

    addOrder({
      id: newId(),
      date: dateISO,
      customerName: normalizedName,
      customerPhone: safeName(form.customerPhone),
      customerAddress: safeName(form.customerAddress),
      supplierName: normalizedSupplierName,
      supplierPhone: safeName(form.supplierPhone),
      supplierAddress: safeName(form.supplierAddress),
      items: validItems,
      shippingCost: Number(form.shippingCost) || 0,
      shippingStatus: form.shippingStatus,
      notes: safeName(form.notes),
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
        {formError && <div className="form-error">{formError}</div>}
        <div className="section-label">Customer</div>

        {allCustomers.length > 0 && (
          <div className="form-group">
            <label>Select customer</label>
            <InHouseDropdown
              value={isNew ? '__new__' : selCust}
              options={customerOptions}
              onChange={handleCust}
              placeholder="Choose customer..."
              searchable
              searchPlaceholder="Search customer..."
            />
          </div>
        )}

        {isNew && (
          <>
            <div className="form-group">
              <label>Name *</label>
              <input ref={nameRef} name="customerName" value={form.customerName} onChange={handle} required={isNew} placeholder="Customer name" />
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label>Phone</label><input type="tel" name="customerPhone" value={form.customerPhone} onChange={handle} placeholder="Phone" /></div>
              <div className="form-group"><label>Address</label><input name="customerAddress" value={form.customerAddress} onChange={handle} placeholder="Address" /></div>
            </div>
          </>
        )}

        <div className="section-label">Supplier</div>

        {allSuppliers.length > 0 && (
          <div className="form-group">
            <label>Select supplier</label>
            <InHouseDropdown
              value={isNewSupplier ? '__new__' : selSupplier}
              options={supplierOptions}
              onChange={handleSupplier}
              placeholder="Choose supplier..."
              searchable
              searchPlaceholder="Search supplier..."
            />
          </div>
        )}

        {isNewSupplier && (
          <>
            <div className="form-group">
              <label>Supplier Name *</label>
              <input ref={supplierNameRef} name="supplierName" value={form.supplierName} onChange={handle} required={isNewSupplier} placeholder="Supplier name" />
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label>Phone</label><input type="tel" name="supplierPhone" value={form.supplierPhone} onChange={handle} placeholder="Phone" /></div>
              <div className="form-group"><label>Address</label><input name="supplierAddress" value={form.supplierAddress} onChange={handle} placeholder="Address" /></div>
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
              <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Item name" />
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
            <InHouseDropdown
              value={form.shippingStatus}
              options={SHIPPING_STATUS_OPTIONS}
              onChange={(next) => setForm((f) => ({ ...f, shippingStatus: next }))}
              placeholder="Status"
            />
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
