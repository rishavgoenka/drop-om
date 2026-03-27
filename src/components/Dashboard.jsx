import React from 'react';
import { computeFinancials, shippingBadge, paymentBadge, formatINR, formatDate } from '../utils';
import { TrendingUp, AlertCircle, Clock } from 'lucide-react';

export default function Dashboard({ orders, onNewOrder, onSelectOrder }) {
  // Aggregate financials across all orders
  const totals = orders.reduce((acc, o) => {
    const f = computeFinancials(o);
    acc.profit            += f.profit;
    acc.pendingToCollect  += Math.max(0, f.pendingToCollect);
    acc.pendingToPay      += Math.max(0, f.pendingToPay);
    acc.supplierTotal     += f.supplierTotal;
    acc.customerTotal     += f.customerTotal;
    acc.receivedTotal     += f.receivedFromBuyer;
    acc.paidTotal         += f.paidToSupplier;
    return acc;
  }, { profit: 0, pendingToCollect: 0, pendingToPay: 0, supplierTotal: 0, customerTotal: 0, receivedTotal: 0, paidTotal: 0 });

  const recentOrders = [...orders].reverse().slice(0, 10);

  return (
    <div className="page-shell fade-in">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>drop-om</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--txt-3)', marginTop: '0.1rem' }}>Order & Finance Tracker</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNewOrder}>+ New Order</button>
      </div>

      {/* Stat cards */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="label">Total Profit</div>
          <div className="value green">Rs.{formatINR(totals.profit)}</div>
          <div className="sub">{orders.length} orders</div>
        </div>
        <div className="stat-card">
          <div className="label">To Collect</div>
          <div className="value amber">Rs.{formatINR(totals.pendingToCollect)}</div>
          <div className="sub">pending from buyers</div>
        </div>
        <div className="stat-card">
          <div className="label">To Pay</div>
          <div className="value red">Rs.{formatINR(totals.pendingToPay)}</div>
          <div className="sub">due to suppliers</div>
        </div>
        <div className="stat-card">
          <div className="label">Net Cash</div>
          <div className={`value ${totals.receivedTotal - totals.paidTotal >= 0 ? 'green' : 'red'}`}>
            Rs.{formatINR(Math.abs(totals.receivedTotal - totals.paidTotal))}
          </div>
          <div className="sub">{totals.receivedTotal - totals.paidTotal >= 0 ? 'in hand' : 'deficit'}</div>
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="section-label">Recent Orders</div>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <TrendingUp size={32} strokeWidth={1.5} />
            </div>
            <p>No orders yet. Add your first one.</p>
          </div>
        ) : (
          <div className="flex-col gap-2">
            {recentOrders.map(order => {
              const f = computeFinancials(order);
              const sb = shippingBadge(order.shippingStatus);
              const pb = paymentBadge(order.paymentStatus);
              return (
                <div key={order.id} className="order-item" onClick={() => onSelectOrder(order)}>
                  <div className="order-main">
                    <div className="item-name">{order.itemName || 'Untitled Item'}</div>
                    <div className="cust-name">{order.customerName}</div>
                    <div className="badges">
                      <span className={`badge ${sb.cls}`}>{sb.label}</span>
                      <span className={`badge ${pb.cls}`}>{pb.label}</span>
                      {f.pendingToCollect > 0 && (
                        <span className="badge badge-amber">Collect Rs.{formatINR(f.pendingToCollect)}</span>
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

      {/* Data disclosure */}
      <div className="info-note">
        All data is stored locally on this device in your browser's LocalStorage. Nothing is sent to any server. Clearing your browser data will erase all orders.
      </div>
    </div>
  );
}
