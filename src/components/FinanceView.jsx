import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatINR, formatDateTime, orderItemNames } from '../utils';
import { Plus } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function FinanceView({ transactions, orders, deleteTransaction }) {
  const nav = useNavigate();
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalCr = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalDr = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const orderById = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  const orderLabel = (oid) => {
    const o = orderById.get(oid);
    return o ? orderItemNames(o) : oid;
  };

  return (
    <div className="page-shell fade-in">
      <div className="flex justify-between items-center">
        <div className="page-header"><h2>Finances</h2><p>{transactions.length} transactions</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => nav('/finance/new')}><Plus size={14} /> New Txn</button>
      </div>

      <div className="card card-sm" style={{ background: 'var(--bg-2)' }}>
        <div className="finance-row"><span className="fr-label">Credits (received)</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(totalCr)}</span></div>
        <div className="finance-row"><span className="fr-label">Debits (paid out)</span><span className="fr-val" style={{ color: 'var(--red)' }}>Rs.{formatINR(totalDr)}</span></div>
        <div className="finance-row" style={{ fontWeight: 700, borderTop: '1px solid var(--border-hi)', paddingTop: '0.4rem' }}>
          <span className="fr-label" style={{ fontWeight: 700, color: 'var(--txt)' }}>Net</span>
          <span className="fr-val" style={{ color: totalCr - totalDr >= 0 ? 'var(--green)' : 'var(--red)' }}>Rs.{formatINR(Math.abs(totalCr - totalDr))} {totalCr - totalDr < 0 ? '(deficit)' : ''}</span>
        </div>
      </div>

      <div className="section-label">Transaction Log</div>
      {sorted.length === 0 ? (
        <div className="empty-state">No transactions yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="txn-table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Amt</th><th>Order</th><th>Party</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>{formatDateTime(t.date)}</td>
                  <td><span className={t.type === 'credit' ? 'credit' : 'debit'}>{t.type === 'credit' ? 'CR' : 'DR'}</span></td>
                  <td className={t.type === 'credit' ? 'credit' : 'debit'}>{t.type === 'credit' ? '+' : '-'}Rs.{formatINR(t.amount)}</td>
                  <td style={{ fontSize: '0.7rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{orderLabel(t.orderId)}</td>
                  <td style={{ fontSize: '0.7rem' }}>{t.partyName}</td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => nav(`/finance/edit/${t.id}`)}>Edit</button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: '0.15rem' }} onClick={() => setConfirmDelete(t.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {confirmDelete && <ConfirmModal message="Are you sure you want to delete this transaction?" onConfirm={() => { deleteTransaction(confirmDelete); setConfirmDelete(null); }} onCancel={() => setConfirmDelete(null)} />}
    </div>
  );
}
