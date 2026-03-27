import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeOrderTotals, derivePaymentStatus, deriveSupplierStatus, formatINR, shippingBadge, paymentBadge, orderItemNames } from '../utils';

export default function Dashboard({ orders, transactions }) {
  const nav = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const toggle = (c) => setExpanded(prev => prev === c ? null : c);

  let totalProfit = 0, totalExcess = 0, pendingCollect = 0, pendingPay = 0, totalRecv = 0, totalPaid = 0;
  const collectList = [], payList = [];

  orders.forEach(o => {
    const t = computeOrderTotals(o);
    const ps = derivePaymentStatus(o, transactions);
    const ss = deriveSupplierStatus(o, transactions);
    totalProfit += t.profit;
    totalExcess += ps.excess;
    totalRecv += ps.received;
    totalPaid += ss.paid;
    if (ps.pending > 0) { pendingCollect += ps.pending; collectList.push({ o, amt: ps.pending }); }
    if (ss.remaining > 0) { pendingPay += ss.remaining; payList.push({ o, amt: ss.remaining }); }
  });

  const effectiveProfit = totalProfit + totalExcess;
  const netCash = totalRecv - totalPaid;

  return (
    <div className="page-shell fade-in">
      <div className="page-header">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>drop-om</h2>
      </div>

      <div className="card-grid">
        <div className="stat-card" onClick={() => toggle('profit')}>
          <div className="label">Total Profit</div>
          <div className="value green">Rs.{formatINR(effectiveProfit)}</div>
          <div className="sub">{orders.length} orders{totalExcess > 0 ? ` (+${formatINR(totalExcess)} excess)` : ''}</div>
        </div>
        <div className="stat-card" onClick={() => toggle('collect')}>
          <div className="label">To Collect</div>
          <div className="value amber">Rs.{formatINR(pendingCollect)}</div>
          <div className="sub">{collectList.length} pending</div>
        </div>
        <div className="stat-card" onClick={() => toggle('pay')}>
          <div className="label">To Pay</div>
          <div className="value red">Rs.{formatINR(pendingPay)}</div>
          <div className="sub">{payList.length} pending</div>
        </div>
        <div className="stat-card" onClick={() => toggle('cash')}>
          <div className="label">Net Cash</div>
          <div className={`value ${netCash >= 0 ? 'green' : 'red'}`}>Rs.{formatINR(Math.abs(netCash))}</div>
          <div className="sub">{netCash >= 0 ? 'in hand' : 'deficit'}</div>
        </div>
      </div>

      {expanded === 'collect' && collectList.length > 0 && (
        <div className="fade-in flex-col gap-2">
          <div className="section-label">Pending from Buyers</div>
          {collectList.map(({ o, amt }) => (
            <div key={o.id} className="order-item" onClick={() => nav(`/orders/${o.id}`)}>
              <div className="order-main"><div className="item-name">{orderItemNames(o)}</div><div className="cust-name">{o.customerName}</div></div>
              <div className="order-right"><div style={{ fontWeight: 700, color: 'var(--amber)' }}>Rs.{formatINR(amt)}</div></div>
            </div>
          ))}
        </div>
      )}

      {expanded === 'pay' && payList.length > 0 && (
        <div className="fade-in flex-col gap-2">
          <div className="section-label">Pending to Suppliers</div>
          {payList.map(({ o, amt }) => (
            <div key={o.id} className="order-item" onClick={() => nav(`/orders/${o.id}`)}>
              <div className="order-main"><div className="item-name">{orderItemNames(o)}</div><div className="cust-name">{o.customerName}</div></div>
              <div className="order-right"><div style={{ fontWeight: 700, color: 'var(--red)' }}>Rs.{formatINR(amt)}</div></div>
            </div>
          ))}
        </div>
      )}

      {expanded === 'cash' && (
        <div className="card card-sm fade-in">
          <div className="finance-row"><span className="fr-label">Received from buyers</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(totalRecv)}</span></div>
          <div className="finance-row"><span className="fr-label">Paid to suppliers</span><span className="fr-val" style={{ color: 'var(--red)' }}>Rs.{formatINR(totalPaid)}</span></div>
          <div className="finance-row" style={{ fontWeight: 700 }}><span className="fr-label" style={{ fontWeight: 700, color: 'var(--txt)' }}>Net</span><span className="fr-val" style={{ color: netCash >= 0 ? 'var(--green)' : 'var(--red)' }}>Rs.{formatINR(Math.abs(netCash))}</span></div>
        </div>
      )}

      {expanded === 'profit' && (
        <div className="card card-sm fade-in">
          <div className="finance-row"><span className="fr-label">Order margins (SP − CP)</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(totalProfit)}</span></div>
          {totalExcess > 0 && <div className="finance-row"><span className="fr-label">Excess payments</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(totalExcess)}</span></div>}
        </div>
      )}

      <div className="section-label mt-2">Recent Orders</div>
      {orders.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        <div className="flex-col gap-2">
          {[...orders].reverse().slice(0, 8).map(o => {
            const t = computeOrderTotals(o);
            const ps = derivePaymentStatus(o, transactions);
            const sb = shippingBadge(o.shippingStatus);
            const pb = paymentBadge(ps.status);
            return (
              <div key={o.id} className="order-item" onClick={() => nav(`/orders/${o.id}`)}>
                <div className="order-main">
                  <div className="item-name">{orderItemNames(o)}</div>
                  <div className="cust-name">{o.customerName}</div>
                  <div className="badges"><span className={`badge ${sb.cls}`}>{sb.label}</span><span className={`badge ${pb.cls}`}>{pb.label}</span></div>
                </div>
                <div className="order-right"><div className="order-profit">+Rs.{formatINR(t.profit)}</div></div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
