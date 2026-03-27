import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatINR, formatDate, formatDateTime } from '../utils';
import { ArrowLeft } from 'lucide-react';

export default function SupplierOrders({ suppliers, transactions, orders }) {
  const nav = useNavigate();
  const { name } = useParams();
  const supplierName = decodeURIComponent(name);
  const supplier = (suppliers || []).find(s => s.name.trim().toLowerCase() === supplierName.trim().toLowerCase());

  // Find all debit transactions for this supplier
  const supplierTxns = transactions
    .filter(t => t.type === 'debit' && (t.partyName || '').trim().toLowerCase() === supplierName.trim().toLowerCase())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPaid = supplierTxns.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const orderIds = [...new Set(supplierTxns.map(t => t.orderId))];
  const relatedOrders = orders.filter(o => orderIds.includes(o.id));

  const orderLabel = (oid) => {
    const o = orders.find(o => o.id === oid);
    if (!o) return oid;
    const items = (o.items || []).map(i => i.name).filter(Boolean).join(', ');
    return `${items || 'Untitled'} — ${o.customerName}`;
  };

  return (
    <div className="page-shell fade-in">
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={14} /> Back</button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{supplierName}</h2>
      </div>

      {supplier && (
        <div className="card card-sm">
          {supplier.phone && <div style={{ fontSize: '0.82rem', color: 'var(--txt-2)' }}>{supplier.phone}</div>}
          {supplier.address && <div style={{ fontSize: '0.78rem', color: 'var(--txt-3)' }}>{supplier.address}</div>}
          {supplier.notes && <div style={{ fontSize: '0.78rem', color: 'var(--txt-3)', marginTop: '0.2rem' }}>{supplier.notes}</div>}
        </div>
      )}

      <div className="card card-sm" style={{ background: 'var(--bg-2)' }}>
        <div className="finance-row"><span className="fr-label">Transactions</span><span className="fr-val">{supplierTxns.length}</span></div>
        <div className="finance-row"><span className="fr-label">Orders linked</span><span className="fr-val">{orderIds.length}</span></div>
        <div className="finance-row" style={{ fontWeight: 700 }}><span className="fr-label" style={{ fontWeight: 700, color: 'var(--txt)' }}>Total paid</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(totalPaid)}</span></div>
      </div>

      <div className="section-label">Payment History</div>
      {supplierTxns.length === 0 ? (
        <div className="empty-state">No debit transactions against this supplier.</div>
      ) : (
        <div className="table-wrap">
          <table className="txn-table">
            <thead><tr><th>Date</th><th>Amount</th><th>Order</th><th>Notes</th></tr></thead>
            <tbody>
              {supplierTxns.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>{formatDateTime(t.date)}</td>
                  <td className="debit">-Rs.{formatINR(t.amount)}</td>
                  <td style={{ fontSize: '0.7rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{orderLabel(t.orderId)}</td>
                  <td style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>{t.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
