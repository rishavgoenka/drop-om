import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeOrderTotals, derivePaymentStatus, shippingBadge, paymentBadge, formatINR, formatDate, orderItemNames } from '../utils';
import { Search, Plus } from 'lucide-react';

const PAY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partially', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
];

const SHIP_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ordered', label: 'Ordered' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrdersView({ orders, transactions }) {
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [payF, setPayF] = useState('all');
  const [shipF, setShipF] = useState('all');

  const filtered = [...orders].reverse().filter(o => {
    if (search) {
      const q = search.toLowerCase();
      if (!orderItemNames(o).toLowerCase().includes(q) && !(o.customerName || '').toLowerCase().includes(q)) return false;
    }
    if (shipF !== 'all' && o.shippingStatus !== shipF) return false;
    if (payF !== 'all') {
      const ps = derivePaymentStatus(o, transactions);
      if (ps.status !== payF) return false;
    }
    return true;
  });

  return (
    <div className="page-shell fade-in">
      <div className="flex justify-between items-center">
        <div className="page-header"><h2>Orders</h2><p>{filtered.length} of {orders.length}</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => nav('/orders/new')}><Plus size={14} /> New</button>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} />
        <input type="text" placeholder="Search customer or item..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '1.9rem' }} />
      </div>

      {/* Payment filter */}
      <div className="flex gap-1 flex-wrap">
        {PAY_FILTERS.map(f => (
          <button key={f.key} className={`btn btn-sm ${payF === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPayF(f.key)}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>{f.label}</button>
        ))}
      </div>

      {/* Shipping filter */}
      <div className="flex gap-1 flex-wrap" style={{ marginTop: '-0.5rem' }}>
        {SHIP_FILTERS.map(f => (
          <button key={f.key} className={`btn btn-sm ${shipF === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShipF(f.key)}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>{f.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No orders match.</div>
      ) : (
        <div className="flex-col" style={{ gap: '1px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 70px', padding: '0.35rem 0.65rem', background: 'var(--bg-2)', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-3)', borderBottom: '1px solid var(--border)' }}>
            <span>Date</span><span>Particulars</span><span style={{ textAlign: 'right' }}>Amount</span><span style={{ textAlign: 'right' }}>Profit</span>
          </div>
          {filtered.map((o, i) => {
            const t = computeOrderTotals(o);
            const ps = derivePaymentStatus(o, transactions);
            const sb = shippingBadge(o.shippingStatus);
            const pb = paymentBadge(ps.status);
            return (
              <div key={o.id} onClick={() => nav(`/orders/${o.id}`)} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 70px', padding: '0.55rem 0.65rem', background: i % 2 === 0 ? 'var(--bg-1)' : 'var(--bg)', cursor: 'pointer', transition: 'background 0.15s', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'start' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-1)' : 'var(--bg)'}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--txt-3)', whiteSpace: 'nowrap', paddingTop: '0.1rem' }}>{formatDate(o.date)}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.15rem' }}>{o.customerName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--txt-2)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{orderItemNames(o)}</div>
                  <div className="flex gap-1 flex-wrap">
                    <span className={`badge ${sb.cls}`}>{sb.label}</span>
                    <span className={`badge ${pb.cls}`}>{pb.label}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>Rs.{formatINR(t.customerOwes)}</div>
                  {ps.pending > 0 && <div style={{ fontSize: '0.65rem', color: 'var(--amber)', marginTop: '0.1rem' }}>-Rs.{formatINR(ps.pending)}</div>}
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                  Rs.{formatINR(t.profit)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
