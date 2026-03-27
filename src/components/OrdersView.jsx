import React, { useState } from 'react';
import { computeFinancials, shippingBadge, paymentBadge, formatINR, formatDate } from '../utils';
import { Search } from 'lucide-react';

const SHIPPING_STATUSES = ['all', 'ordered', 'in_transit', 'delivered'];
const PAYMENT_STATUSES  = ['all', 'due', 'adv', 'partially', 'paid'];

export default function OrdersView({ orders, onSelectOrder, onNewOrder }) {
  const [search, setSearch]     = useState('');
  const [shipFilter, setShip]   = useState('all');
  const [payFilter, setPay]     = useState('all');

  const filtered = orders
    .filter(o => {
      if (search) {
        const q = search.toLowerCase();
        return (o.itemName || '').toLowerCase().includes(q) ||
               (o.customerName || '').toLowerCase().includes(q);
      }
      return true;
    })
    .filter(o => shipFilter === 'all' || o.shippingStatus === shipFilter)
    .filter(o => payFilter  === 'all' || o.paymentStatus  === payFilter)
    .reverse(); // newest first

  return (
    <div className="page-shell fade-in">
      <div className="flex justify-between items-center">
        <div className="page-header">
          <h2>Orders</h2>
          <p>{filtered.length} of {orders.length} orders</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNewOrder}>+ New</button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search item or customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {PAYMENT_STATUSES.map(s => (
          <button key={s} className={`btn btn-sm ${payFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPay(s)} style={{ textTransform: 'capitalize', padding: '0.3rem 0.7rem' }}>
            {s === 'all' ? 'All Payments' : paymentBadge(s).label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {SHIPPING_STATUSES.map(s => (
          <button key={s} className={`btn btn-sm ${shipFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShip(s)} style={{ textTransform: 'capitalize', padding: '0.3rem 0.7rem' }}>
            {s === 'all' ? 'All Shipping' : shippingBadge(s).label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">No orders match your filters.</div>
      ) : (
        <div className="flex-col gap-2">
          {filtered.map(order => {
            const f  = computeFinancials(order);
            const sb = shippingBadge(order.shippingStatus);
            const pb = paymentBadge(order.paymentStatus);
            return (
              <div key={order.id} className="order-item" onClick={() => onSelectOrder(order)}>
                <div className="order-main">
                  <div className="item-name">{order.itemName || 'Untitled Item'}</div>
                  <div className="cust-name">{order.customerName} {order.customerPhone ? `· ${order.customerPhone}` : ''}</div>
                  <div className="badges">
                    <span className={`badge ${sb.cls}`}>{sb.label}</span>
                    <span className={`badge ${pb.cls}`}>{pb.label}</span>
                    {f.pendingToCollect > 0 && (
                      <span className="badge badge-amber">Collect Rs.{formatINR(f.pendingToCollect)}</span>
                    )}
                    {f.pendingToPay > 0 && (
                      <span className="badge badge-red">Pay Rs.{formatINR(f.pendingToPay)}</span>
                    )}
                  </div>
                </div>
                <div className="order-right">
                  <div className="order-profit">+Rs.{formatINR(f.profit)}</div>
                  <div className="order-date">{formatDate(order.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
