import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeOrderTotals, derivePaymentStatus, deriveSupplierStatus, formatINR, shippingBadge, paymentBadge, orderItemNames } from '../utils';

export default function Dashboard({ orders, transactions }) {
  const nav = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const toggle = (c) => setExpanded(prev => prev === c ? null : c);

  const summary = useMemo(() => {
    let totalProfit = 0;
    let totalExcess = 0;
    let pendingCollect = 0;
    let pendingPay = 0;
    let totalRecv = 0;
    let totalPaid = 0;
    const collectList = [];
    const payList = [];
    const paymentByOrderId = new Map();

    orders.forEach((o) => {
      const t = computeOrderTotals(o);
      const ps = derivePaymentStatus(o, transactions);
      const ss = deriveSupplierStatus(o, transactions);
      totalProfit += t.profit;
      totalExcess += ps.excess;
      totalRecv += ps.received;
      totalPaid += ss.paid;
      paymentByOrderId.set(o.id, { ps, ss, totals: t });
      if (ps.pending > 0) {
        pendingCollect += ps.pending;
        collectList.push({ o, amt: ps.pending });
      }
      if (ss.remaining > 0) {
        pendingPay += ss.remaining;
        payList.push({ o, amt: ss.remaining });
      }
    });

    return {
      totalProfit,
      totalExcess,
      pendingCollect,
      pendingPay,
      totalRecv,
      totalPaid,
      collectList,
      payList,
      effectiveProfit: totalProfit + totalExcess,
      netCash: totalRecv - totalPaid,
      paymentByOrderId,
    };
  }, [orders, transactions]);

  return (
    <div className="page-shell fade-in">
      <div className="page-header">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>drop-om</h2>
      </div>

      <div className="card-grid">
        <div className="stat-card" onClick={() => toggle('profit')}>
          <div className="label">Total Profit</div>
          <div className="value green">Rs.{formatINR(summary.effectiveProfit)}</div>
          <div className="sub">{orders.length} orders{summary.totalExcess > 0 ? ` (+${formatINR(summary.totalExcess)} excess)` : ''}</div>
        </div>
        <div className="stat-card" onClick={() => toggle('collect')}>
          <div className="label">To Collect</div>
          <div className="value amber">Rs.{formatINR(summary.pendingCollect)}</div>
          <div className="sub">{summary.collectList.length} pending</div>
        </div>
        <div className="stat-card" onClick={() => toggle('pay')}>
          <div className="label">To Pay</div>
          <div className="value red">Rs.{formatINR(summary.pendingPay)}</div>
          <div className="sub">{summary.payList.length} pending</div>
        </div>
        <div className="stat-card" onClick={() => toggle('cash')}>
          <div className="label">Net Cash</div>
          <div className={`value ${summary.netCash >= 0 ? 'green' : 'red'}`}>Rs.{formatINR(Math.abs(summary.netCash))}</div>
          <div className="sub">{summary.netCash >= 0 ? 'in hand' : 'deficit'}</div>
        </div>
      </div>

      {expanded === 'collect' && summary.collectList.length > 0 && (
        <div className="fade-in flex-col gap-2">
          <div className="section-label">Pending from Buyers</div>
          {summary.collectList.map(({ o, amt }) => (
            <div key={o.id} className="order-item" onClick={() => nav(`/orders/${o.id}`)}>
              <div className="order-main"><div className="item-name">{orderItemNames(o)}</div><div className="cust-name">{o.customerName}</div></div>
              <div className="order-right"><div style={{ fontWeight: 700, color: 'var(--amber)' }}>Rs.{formatINR(amt)}</div></div>
            </div>
          ))}
        </div>
      )}

      {expanded === 'pay' && summary.payList.length > 0 && (
        <div className="fade-in flex-col gap-2">
          <div className="section-label">Pending to Suppliers</div>
          {summary.payList.map(({ o, amt }) => (
            <div key={o.id} className="order-item" onClick={() => nav(`/orders/${o.id}`)}>
              <div className="order-main"><div className="item-name">{orderItemNames(o)}</div><div className="cust-name">{o.customerName}</div></div>
              <div className="order-right"><div style={{ fontWeight: 700, color: 'var(--red)' }}>Rs.{formatINR(amt)}</div></div>
            </div>
          ))}
        </div>
      )}

      {expanded === 'cash' && (
        <div className="card card-sm fade-in">
          <div className="finance-row"><span className="fr-label">Received from buyers</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(summary.totalRecv)}</span></div>
          <div className="finance-row"><span className="fr-label">Paid to suppliers</span><span className="fr-val" style={{ color: 'var(--red)' }}>Rs.{formatINR(summary.totalPaid)}</span></div>
          <div className="finance-row" style={{ fontWeight: 700 }}><span className="fr-label" style={{ fontWeight: 700, color: 'var(--txt)' }}>Net</span><span className="fr-val" style={{ color: summary.netCash >= 0 ? 'var(--green)' : 'var(--red)' }}>Rs.{formatINR(Math.abs(summary.netCash))}</span></div>
        </div>
      )}

      {expanded === 'profit' && (
        <div className="card card-sm fade-in">
          <div className="finance-row"><span className="fr-label">Order margins (SP − CP)</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(summary.totalProfit)}</span></div>
          {summary.totalExcess > 0 && <div className="finance-row"><span className="fr-label">Excess payments</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(summary.totalExcess)}</span></div>}
        </div>
      )}

      <div className="section-label mt-2">Recent Orders</div>
      {orders.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        <div className="flex-col gap-2">
          {[...orders].reverse().slice(0, 8).map(o => {
            const row = summary.paymentByOrderId.get(o.id);
            const t = row?.totals || computeOrderTotals(o);
            const ps = row?.ps || derivePaymentStatus(o, transactions);
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
