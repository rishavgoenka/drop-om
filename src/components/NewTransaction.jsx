import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { newId, formatINR, computeOrderTotals, derivePaymentStatus, deriveSupplierStatus, orderItemNames, toISTDateTimeString, getUniqueCustomers, isoToISTDateTimeInput, istDateTimeInputToISO, safeName } from '../utils';
import { ArrowLeft } from 'lucide-react';
import InHouseDropdown from './InHouseDropdown';

export default function NewTransaction({ orders, transactions, customers, suppliers, addTransaction, updateTransaction }) {
  const nav = useNavigate();
  const { id: editId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(editId);
  const existingTxn = isEdit ? transactions.find(t => t.id === editId) : null;

  const defaultType = existingTxn?.type || searchParams.get('type') || 'credit';
  const defaultOrder = existingTxn?.orderId || searchParams.get('order') || '';

  const [type, setType] = useState(defaultType);
  const [orderId, setOid] = useState(defaultOrder);
  const [amount, setAmt]  = useState(existingTxn ? String(existingTxn.amount) : '');
  const [party, setParty] = useState(existingTxn?.partyName || '');
  const [partySearch, setPartySearch] = useState(existingTxn?.partyName || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [date, setDate] = useState(existingTxn ? isoToISTDateTimeInput(existingTxn.date) : toISTDateTimeString());
  const [notes, setNotes] = useState(existingTxn?.notes || '');
  const [formError, setFormError] = useState('');
  const orderSelectRef = useRef(null);

  useEffect(() => {
    if (isEdit) return;
    const frame = requestAnimationFrame(() => {
      orderSelectRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isEdit]);

  // Build all party options from customers, suppliers, and order-derived customers
  const orderCustomers = getUniqueCustomers(orders);
  const allParties = useMemo(() => {
    const storedCustomers = customers || [];
    const storedSuppliers = suppliers || [];
    const map = {};
    orderCustomers.forEach(c => {
      const name = safeName(c?.name);
      if (name) map[name.toLowerCase()] = { name, type: 'buyer' };
    });
    storedCustomers.forEach(c => {
      const name = safeName(c?.name);
      if (name) map[name.toLowerCase()] = { name, type: 'buyer' };
    });
    storedSuppliers.forEach(s => {
      const name = safeName(s?.name);
      if (name) map[name.toLowerCase()] = { name, type: 'supplier' };
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, suppliers, orderCustomers]);

  const filteredParties = partySearch
    ? allParties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase()))
    : allParties;

  const selectParty = (name) => {
    setParty(name);
    setPartySearch(name);
    setShowDropdown(false);
  };

  const selectedOrder = orders.find(o => o.id === orderId);
  const orderOptions = useMemo(
    () => [...orders].reverse().map((o) => ({
      value: o.id,
      label: `${orderItemNames(o)} — ${o.customerName}`,
      meta: safeName(o.supplierName) ? `Supplier: ${safeName(o.supplierName)}` : '',
    })),
    [orders],
  );

  const handleOrderChange = (newOid) => {
    setOid(newOid);
    const o = orders.find(o => o.id === newOid);
    if (o && !party) {
      const defaultParty = type === 'credit' ? safeName(o.customerName) : safeName(o.supplierName || o.customerName);
      setParty(defaultParty);
      setPartySearch(defaultParty);
    }
  };

  useEffect(() => {
    if (!selectedOrder || partySearch) return;
    const defaultParty = type === 'credit'
      ? safeName(selectedOrder.customerName)
      : safeName(selectedOrder.supplierName || selectedOrder.customerName);
    if (!defaultParty) return;
    setParty(defaultParty);
    setPartySearch(defaultParty);
  }, [selectedOrder, type, partySearch]);

  const balanceInfo = useMemo(() => {
    if (!selectedOrder) return null;
    const t = computeOrderTotals(selectedOrder);
    const ps = derivePaymentStatus(selectedOrder, transactions);
    const ss = deriveSupplierStatus(selectedOrder, transactions);
    return { customerOwes: t.customerOwes, supplierOwes: t.supplierOwes, received: ps.received, paid: ss.paid, pendingBuyer: ps.pending, pendingSupplier: ss.remaining };
  }, [selectedOrder, transactions]);

  const submit = (e) => {
    e.preventDefault();
    setFormError('');

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    if (!orderId) {
      setFormError('Select an order.');
      return;
    }

    const partyName = safeName(party || partySearch);
    if (!partyName) {
      setFormError(type === 'credit' ? 'Please enter who paid you.' : 'Please enter who you paid.');
      return;
    }

    const dateISO = istDateTimeInputToISO(date);
    if (!dateISO) {
      setFormError('Enter a valid date and time.');
      return;
    }

    const txn = { id: isEdit ? editId : newId(), type, orderId, amount: amt, partyName, date: dateISO, notes: safeName(notes) };
    if (isEdit) updateTransaction(txn);
    else addTransaction(txn);
    nav(-1);
  };

  return (
    <div className="page-shell fade-in">
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={14} /> Back</button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{isEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
      </div>

      <form onSubmit={submit} className="flex-col gap-3">
        {formError && <div className="form-error">{formError}</div>}
        {/* Type toggle */}
        <div className="form-group">
          <label>Type</label>
          <div className="toggle-group">
            <button type="button" className={type === 'credit' ? 'active-green' : ''} onClick={() => setType('credit')}>Credit (Received)</button>
            <button type="button" className={type === 'debit' ? 'active-red' : ''} onClick={() => setType('debit')}>Debit (Paid)</button>
          </div>
        </div>

        {/* Order selector */}
        <div className="form-group">
          <label>Order *</label>
          <InHouseDropdown
            ref={orderSelectRef}
            value={orderId}
            options={orderOptions}
            onChange={handleOrderChange}
            placeholder="Select order..."
            searchable
            searchPlaceholder="Search order by item or customer..."
          />
          <input type="hidden" value={orderId} required />
        </div>

        {/* Balance context */}
        {balanceInfo && (
          <div className="card card-sm" style={{ background: 'var(--bg-2)' }}>
            {type === 'credit' ? (
              <>
                <div className="finance-row"><span className="fr-label">Customer total</span><span className="fr-val">Rs.{formatINR(balanceInfo.customerOwes)}</span></div>
                <div className="finance-row"><span className="fr-label">Already received</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(balanceInfo.received)}</span></div>
                <div className="finance-row" style={{ fontWeight: 700 }}><span className="fr-label" style={{ fontWeight: 700, color: 'var(--txt)' }}>Remaining</span><span className="fr-val" style={{ color: balanceInfo.pendingBuyer > 0 ? 'var(--amber)' : 'var(--green)' }}>Rs.{formatINR(balanceInfo.pendingBuyer)}</span></div>
              </>
            ) : (
              <>
                <div className="finance-row"><span className="fr-label">Supplier total</span><span className="fr-val">Rs.{formatINR(balanceInfo.supplierOwes)}</span></div>
                <div className="finance-row"><span className="fr-label">Already paid</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(balanceInfo.paid)}</span></div>
                <div className="finance-row" style={{ fontWeight: 700 }}><span className="fr-label" style={{ fontWeight: 700, color: 'var(--txt)' }}>Remaining</span><span className="fr-val" style={{ color: balanceInfo.pendingSupplier > 0 ? 'var(--red)' : 'var(--green)' }}>Rs.{formatINR(balanceInfo.pendingSupplier)}</span></div>
              </>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Amount (Rs.) *</label>
          <input type="number" value={amount} onChange={e => setAmt(e.target.value)} min="1" required placeholder="0" />
        </div>

        {/* Party name with searchable dropdown */}
        <div className="form-group" style={{ position: 'relative' }}>
          <label>{type === 'credit' ? 'Received from' : 'Paid to'}</label>
          <input
            value={partySearch}
            onChange={e => { setPartySearch(e.target.value); setParty(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search or type name..."
            autoComplete="off"
          />
          {showDropdown && filteredParties.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-3)', border: '1px solid var(--border-hi)', borderRadius: 'var(--radius-sm)', zIndex: 100, maxHeight: '180px', overflowY: 'auto', marginTop: '2px' }}>
              {filteredParties.map(p => (
                <div key={p.name} onMouseDown={() => selectParty(p.name)} style={{ padding: '0.45rem 0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span>{p.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--txt-3)', textTransform: 'uppercase' }}>{p.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Date & Time (IST)</label>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reference, mode of payment..." />
        </div>

        <button type="submit" className="btn btn-primary btn-full">
          {isEdit ? 'Save Changes' : type === 'credit' ? 'Record Credit' : 'Record Debit'}
        </button>
      </form>
    </div>
  );
}
