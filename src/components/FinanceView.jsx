import React from 'react';
import { computeFinancials, formatINR } from '../utils';

export default function FinanceView({ orders }) {
  const totals = orders.reduce((acc, o) => {
    const f = computeFinancials(o);
    acc.grossSales        += f.customerTotal;
    acc.supplierCost      += f.supplierTotal;
    acc.totalProfit       += f.profit;
    acc.totalReceived     += f.receivedFromBuyer;
    acc.totalPaid         += f.paidToSupplier;
    acc.pendingToCollect  += Math.max(0, f.pendingToCollect);
    acc.pendingToPay      += Math.max(0, f.pendingToPay);
    return acc;
  }, {
    grossSales: 0, supplierCost: 0, totalProfit: 0,
    totalReceived: 0, totalPaid: 0,
    pendingToCollect: 0, pendingToPay: 0
  });

  const netCash = totals.totalReceived - totals.totalPaid;

  // Outstanding orders: payment is not fully settled
  const outstandingOrders = orders.filter(o => {
    const f = computeFinancials(o);
    return f.pendingToCollect > 0 || f.pendingToPay > 0;
  }).reverse();

  return (
    <div className="page-shell fade-in">
      <div className="page-header">
        <h2>Finances</h2>
        <p>Running totals across all orders</p>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="section-label">Summary</div>
        <div className="finance-row">
          <span className="fr-label">Gross sales value</span>
          <span className="fr-val">Rs.{formatINR(totals.grossSales)}</span>
        </div>
        <div className="finance-row">
          <span className="fr-label">Supplier cost</span>
          <span className="fr-val" style={{ color: 'var(--red)' }}>Rs.{formatINR(totals.supplierCost)}</span>
        </div>
        <div className="finance-row" style={{ fontWeight: 700 }}>
          <span className="fr-label" style={{ color: 'var(--txt)', fontWeight: 700 }}>Net Profit</span>
          <span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(totals.totalProfit)}</span>
        </div>
      </div>

      {/* Cash flow */}
      <div className="card">
        <div className="section-label">Cash Flow</div>
        <div className="finance-row">
          <span className="fr-label">Received from buyers</span>
          <span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(totals.totalReceived)}</span>
        </div>
        <div className="finance-row">
          <span className="fr-label">Paid to suppliers</span>
          <span className="fr-val" style={{ color: 'var(--red)' }}>Rs.{formatINR(totals.totalPaid)}</span>
        </div>
        <div className="finance-row" style={{ fontWeight: 700 }}>
          <span className="fr-label" style={{ color: 'var(--txt)', fontWeight: 700 }}>Net Cash in Hand</span>
          <span className="fr-val" style={{ color: netCash >= 0 ? 'var(--green)' : 'var(--red)' }}>
            Rs.{formatINR(Math.abs(netCash))} {netCash < 0 ? '(deficit)' : ''}
          </span>
        </div>
      </div>

      {/* Pending */}
      <div className="card">
        <div className="section-label">Pending</div>
        <div className="finance-row">
          <span className="fr-label">Still to collect from buyers</span>
          <span className="fr-val" style={{ color: 'var(--amber)' }}>Rs.{formatINR(totals.pendingToCollect)}</span>
        </div>
        <div className="finance-row">
          <span className="fr-label">Still to pay suppliers</span>
          <span className="fr-val" style={{ color: 'var(--red)' }}>Rs.{formatINR(totals.pendingToPay)}</span>
        </div>
      </div>

      {/* Outstanding order list */}
      {outstandingOrders.length > 0 && (
        <div>
          <div className="section-label">Outstanding Orders</div>
          <div className="flex-col gap-2">
            {outstandingOrders.map(o => {
              const f = computeFinancials(o);
              return (
                <div key={o.id} className="card card-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{o.itemName || 'Untitled'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--txt-2)', marginTop: '0.15rem' }}>{o.customerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {f.pendingToCollect > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 600 }}>
                          Collect Rs.{formatINR(f.pendingToCollect)}
                        </div>
                      )}
                      {f.pendingToPay > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600 }}>
                          Pay Rs.{formatINR(f.pendingToPay)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
