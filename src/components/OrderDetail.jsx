import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { computeOrderTotals, derivePaymentStatus, deriveSupplierStatus, shippingBadge, paymentBadge, formatINR, formatDate, formatDateTime } from '../utils';
import { ArrowLeft } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import InHouseDropdown from './InHouseDropdown';

const SHIPPING_OPTIONS = [
  { value: 'ordered', label: 'Ordered' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

export default function OrderDetail({ orders, transactions, updateOrder, deleteOrder, deleteTransaction }) {
  const nav = useNavigate();
  const { id } = useParams();
  const order = orders.find(o => o.id === id);

  const [editShip, setEditShip] = useState(false);
  const [shipVal, setShipVal] = useState('ordered');
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!order) return <div className="page-shell"><div className="empty-state">Order not found.</div></div>;

  const totals = computeOrderTotals(order);
  const ps = derivePaymentStatus(order, transactions);
  const ss = deriveSupplierStatus(order, transactions);
  const sb = shippingBadge(order.shippingStatus);
  const pb = paymentBadge(ps.status);

  const orderTxns = transactions.filter(t => t.orderId === id).sort((a, b) => new Date(b.date) - new Date(a.date));

  const effectiveShipVal = editShip ? shipVal : order.shippingStatus;

  const saveShip = () => { updateOrder({ ...order, shippingStatus: effectiveShipVal }); setEditShip(false); };

  return (
    <div className="page-shell fade-in">
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={14} /> Back</button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Order</h2>
      </div>

      {/* Customer */}
      <div className="card card-sm">
        <div className="flex justify-between items-start">
          <div>
            <div style={{ fontWeight: 700 }}>{order.customerName}</div>
            {order.customerPhone && <div className="txt-dim" style={{ fontSize: '0.78rem' }}>{order.customerPhone}</div>}
            {order.supplierName && <div className="txt-dim" style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>Supplier: {order.supplierName}</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--txt-3)' }}>
            {formatDate(order.date)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="section-label">Items</div>
      {(order.items || []).map((item, i) => (
        <div key={i} className="card card-sm" style={{ padding: '0.4rem 0.75rem' }}>
          <div className="flex justify-between"><span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name || 'Unnamed'}</span><span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>x{item.qty || 1}</span></div>
          <div className="flex justify-between mt-1" style={{ fontSize: '0.75rem', color: 'var(--txt-2)' }}>
            <span>CP Rs.{formatINR(item.costPrice)}</span><span>SP Rs.{formatINR(item.sellingPrice)}</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>+Rs.{formatINR(((Number(item.sellingPrice) || 0) - (Number(item.costPrice) || 0)) * (Number(item.qty) || 1))}</span>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="card card-sm" style={{ background: 'var(--bg-2)' }}>
        <div className="finance-row"><span className="fr-label">Profit (SP−CP)</span><span className="fr-val" style={{ color: totals.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>Rs.{formatINR(totals.profit)}</span></div>
        <div className="finance-row"><span className="fr-label">Customer owes</span><span className="fr-val">Rs.{formatINR(ps.customerOwes)}</span></div>
        <div className="finance-row"><span className="fr-label">Received</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(ps.received)}</span></div>
        <div className="finance-row"><span className="fr-label">Pending from buyer</span><span className="fr-val" style={{ color: ps.pending > 0 ? 'var(--amber)' : 'var(--green)' }}>Rs.{formatINR(ps.pending)}</span></div>
        {ps.excess > 0 && <div className="finance-row"><span className="fr-label">Excess received</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(ps.excess)}</span></div>}
        <hr className="divider" />
        <div className="finance-row"><span className="fr-label">Supplier owed</span><span className="fr-val">Rs.{formatINR(ss.supplierOwes)}</span></div>
        <div className="finance-row"><span className="fr-label">Paid</span><span className="fr-val" style={{ color: 'var(--green)' }}>Rs.{formatINR(ss.paid)}</span></div>
        <div className="finance-row"><span className="fr-label">Remaining</span><span className="fr-val" style={{ color: ss.remaining > 0 ? 'var(--red)' : 'var(--green)' }}>Rs.{formatINR(ss.remaining)}</span></div>
      </div>

      {/* Badges */}
      <div className="flex gap-2 items-center">
        <span className={`badge ${pb.cls}`}>{pb.label}</span>
        {editShip ? (
          <div className="flex gap-2 items-center" style={{ flex: 1 }}>
            <div style={{ flex: 1 }}>
              <InHouseDropdown
                value={effectiveShipVal}
                options={SHIPPING_OPTIONS}
                onChange={setShipVal}
                placeholder="Select status"
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={saveShip}>Save</button>
          </div>
        ) : (<><span className={`badge ${sb.cls}`}>{sb.label}</span><button className="btn btn-ghost btn-sm" onClick={() => { setShipVal(order.shippingStatus || 'ordered'); setEditShip(true); }} style={{ marginLeft: 'auto' }}>Change</button></>)}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => nav(`/finance/new?type=credit&order=${id}`)}>+ Record Credit</button>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => nav(`/finance/new?type=debit&order=${id}`)}>+ Record Debit</button>
      </div>

      {/* Transaction log table */}
      {orderTxns.length > 0 && (<>
        <div className="section-label">Transactions</div>
        <div className="table-wrap">
          <table className="txn-table">
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Party</th><th></th></tr></thead>
            <tbody>
              {orderTxns.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '0.72rem', color: 'var(--txt-3)' }}>{formatDateTime(t.date)}</td>
                  <td><span className={t.type === 'credit' ? 'credit' : 'debit'}>{t.type === 'credit' ? 'CR' : 'DR'}</span></td>
                  <td className={t.type === 'credit' ? 'credit' : 'debit'}>{t.type === 'credit' ? '+' : '-'}Rs.{formatINR(t.amount)}</td>
                  <td style={{ fontSize: '0.72rem' }}>{t.partyName}</td>
                  <td className="actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => nav(`/finance/edit/${t.id}`)}>Edit</button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: '0.2rem' }} onClick={() => setConfirmDelete({ type: 'txn', id: t.id })}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {order.notes && (<><div className="section-label">Notes</div><div className="card card-sm txt-dim" style={{ fontSize: '0.8rem' }}>{order.notes}</div></>)}
      <button className="btn btn-danger btn-full mt-2" onClick={() => setConfirmDelete({ type: 'order', id })}>Delete Order</button>

      {confirmDelete && (
        <ConfirmModal
          message={confirmDelete.type === 'order' ? "Are you sure you want to delete this order? All recorded transactions against it will also be deleted." : "Are you sure you want to delete this transaction?"}
          onConfirm={() => {
            if (confirmDelete.type === 'order') { deleteOrder(confirmDelete.id); setConfirmDelete(null); nav('/orders'); }
            else { deleteTransaction(confirmDelete.id); setConfirmDelete(null); }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
