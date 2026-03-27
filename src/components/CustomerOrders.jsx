import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { computeOrderTotals, derivePaymentStatus, shippingBadge, paymentBadge, formatINR, formatDate, orderItemNames } from '../utils';
import { ArrowLeft } from 'lucide-react';

export default function CustomerOrders({ orders, transactions }) {
  const nav = useNavigate();
  const { name } = useParams();
  const customerName = decodeURIComponent(name);
  const custOrders = orders.filter(o => (o.customerName || '').trim().toLowerCase() === customerName.trim().toLowerCase());

  let totalValue = 0, totalProfit = 0, pending = 0;
  custOrders.forEach(o => {
    const t = computeOrderTotals(o);
    const ps = derivePaymentStatus(o, transactions);
    totalValue += t.customerOwes;
    totalProfit += t.profit;
    pending += ps.pending;
  });

  const phone = custOrders.find(o => o.customerPhone)?.customerPhone || '';

  return (
    <div className="page-shell fade-in">
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={14} /> Back</button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{customerName}</h2>
      </div>

      <div className="card card-sm">
        {phone && <div style={{ fontSize: '0.82rem', color: 'var(--txt-2)' }}>{phone}</div>}
        <div className="flex gap-4 mt-1" style={{ fontSize: '0.82rem' }}>
          <span><span className="txt-dim">Orders:</span> <strong>{custOrders.length}</strong></span>
          <span><span className="txt-dim">Value:</span> <strong>Rs.{formatINR(totalValue)}</strong></span>
          <span><span className="txt-dim">Profit:</span> <strong style={{ color: 'var(--green)' }}>Rs.{formatINR(totalProfit)}</strong></span>
        </div>
        {pending > 0 && (
          <div className="mt-1" style={{ fontSize: '0.82rem' }}>
            <span className="txt-dim">Balance to collect:</span> <strong style={{ color: 'var(--amber)' }}>Rs.{formatINR(pending)}</strong>
          </div>
        )}
      </div>

      <div className="section-label">Orders</div>
      {custOrders.length === 0 ? <div className="empty-state">No orders.</div> : (
        <div className="flex-col gap-2">
          {[...custOrders].reverse().map(o => {
            const t = computeOrderTotals(o);
            const ps = derivePaymentStatus(o, transactions);
            const sb = shippingBadge(o.shippingStatus);
            const pb = paymentBadge(ps.status);
            return (
              <div key={o.id} className="order-item" onClick={() => nav(`/orders/${o.id}`)}>
                <div className="order-main">
                  <div className="item-name">{orderItemNames(o)}</div>
                  <div className="badges">
                    <span className={`badge ${sb.cls}`}>{sb.label}</span>
                    <span className={`badge ${pb.cls}`}>{pb.label}</span>
                    {ps.pending > 0 && <span className="badge badge-amber">Rs.{formatINR(ps.pending)}</span>}
                  </div>
                </div>
                <div className="order-right">
                  <div className="order-profit">+Rs.{formatINR(t.profit)}</div>
                  <div className="order-date">{formatDate(o.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
