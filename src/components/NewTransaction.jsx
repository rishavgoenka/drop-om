import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { newId, formatINR, computeOrderTotals, derivePaymentStatus, deriveSupplierStatus, orderItemNames, toISTDateTimeString, getUniqueCustomers } from '../utils';
import { ArrowLeft } from 'lucide-react';

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
  const [date, setDate] = useState(existingTxn ? existingTxn.date.slice(0, 16) : toISTDateTimeString());
  const [notes, setNotes] = useState(existingTxn?.notes || '');

  // Build all party options from customers, suppliers, and order-derived customers
  const storedCustomers = customers || [];
  const storedSuppliers = suppliers || [];
  const orderCustomers = getUniqueCustomers(orders);
  const allParties = useMemo(() => {
    const map = {};
    orderCustomers.forEach(c => { map[c.name.toLowerCase()] = { name: c.name, type: 'buyer' }; });
    storedCustomers.forEach(c => { map[c.name.toLowerCase()] = { name: c.name, type: 'buyer' }; });
    storedSuppliers.forEach(s => { map[s.name.toLowerCase()] = { name: s.name, type: 'supplier' }; });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, suppliers, orders]);

  const filteredParties = partySearch
    ? allParties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase()))
    : allParties;

  const selectParty = (name) => {
    setParty(name);
    setPartySearch(name);
    setShowDropdown(false);
  };

  const selectedOrder = orders.find(o => o.id === orderId);

  const handleOrderChange = (newOid) => {
    setOid(newOid);
    const o = orders.find(o => o.id === newOid);
    if (o && !party) {
      const defaultParty = type === 'credit' ? o.customerName : '';
      setParty(defaultParty);
      setPartySearch(defaultParty);
    }
  };

  const balanceInfo = useMemo(() => {
    if (!selectedOrder) return null;
    const t = computeOrderTotals(selectedOrder);
    const ps = derivePaymentStatus(selectedOrder, transactions);
    const ss = deriveSupplierStatus(selectedOrder, transactions);
    return { customerOwes: t.customerOwes, supplierOwes: t.supplierOwes, received: ps.received, paid: ss.paid, pendingBuyer: ps.pending, pendingSupplier: ss.remaining };
  }, [selectedOrder, transactions]);

  const submit = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return alert('Enter valid amount.');
    if (!orderId) return alert('Select an order.');

    const txn = { id: isEdit ? editId : newId(), type, orderId, amount: amt, partyName: party || partySearch, date: new Date(date).toISOString(), notes };
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
          <select value={orderId} onChange={e => handleOrderChange(e.target.value)} required>
            <option value="" disabled>Select order...</option>
            {[...orders].reverse().map(o => (
              <option key={o.id} value={o.id}>{orderItemNames(o)} — {o.customerName}</option>
            ))}
          </select>
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
          <input type="number" value={amount} onChange={e => setAmt(e.target.value)} min="1" required placeholder="0" autoFocus />
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
