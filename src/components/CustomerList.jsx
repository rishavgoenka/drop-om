import React from 'react';
import { computeFinancials, formatINR, formatDate } from '../utils';

export default function CustomersView({ orders, onSelectOrder }) {
  // Build unique customers from orders, aggregating stats
  const customers = {};
  orders.forEach(o => {
    const key = (o.customerName || 'Unknown').trim().toLowerCase();
    if (!customers[key]) {
      customers[key] = {
        name:        o.customerName || 'Unknown',
        phone:       o.customerPhone || '',
        address:     o.customerAddress || '',
        orderCount:  0,
        totalSpent:  0,
        totalProfit: 0,
        lastOrder:   null,
        orders:      [],
      };
    }
    const c = customers[key];
    const f = computeFinancials(o);
    c.orderCount  += 1;
    c.totalSpent  += f.customerTotal;
    c.totalProfit += f.profit;
    c.orders.push(o);
    if (!c.phone    && o.customerPhone)   c.phone   = o.customerPhone;
    if (!c.address  && o.customerAddress) c.address = o.customerAddress;
    if (!c.lastOrder || o.date > c.lastOrder) c.lastOrder = o.date;
  });

  const list = Object.values(customers).sort((a, b) => b.orderCount - a.orderCount);

  return (
    <div className="page-shell fade-in">
      <div className="page-header">
        <h2>Customers</h2>
        <p>{list.length} unique buyers</p>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">No customers yet. Create your first order.</div>
      ) : (
        <div className="flex-col gap-2">
          {list.map((c, i) => (
            <div key={i} className="card card-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</div>
                  {c.phone   && <div style={{ fontSize: '0.8rem', color: 'var(--txt-2)', marginTop: '0.15rem' }}>{c.phone}</div>}
                  {c.address && <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', marginTop: '0.1rem' }}>{c.address}</div>}
                </div>
                <span className="badge badge-brand">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</span>
              </div>
              
              <hr className="divider" style={{ margin: '0.75rem 0' }} />
              
              <div className="flex gap-4" style={{ fontSize: '0.82rem' }}>
                <div>
                  <div style={{ color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Total Value</div>
                  <div style={{ fontWeight: 700, marginTop: '0.1rem' }}>Rs.{formatINR(c.totalSpent)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Profit Made</div>
                  <div style={{ fontWeight: 700, marginTop: '0.1rem', color: 'var(--green)' }}>Rs.{formatINR(c.totalProfit)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Last Order</div>
                  <div style={{ fontWeight: 600, marginTop: '0.1rem', color: 'var(--txt-2)' }}>{formatDate(c.lastOrder)}</div>
                </div>
              </div>

              {/* Mini order list for this customer */}
              {c.orders.length > 0 && (
                <div style={{ marginTop: '0.75rem' }} className="flex-col gap-1">
                  {c.orders.reverse().slice(0, 3).map(o => (
                    <div key={o.id}
                      onClick={() => onSelectOrder(o)}
                      style={{ cursor: 'pointer', padding: '0.4rem 0.6rem', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--txt-2)' }}>{o.itemName || 'Untitled'}</span>
                      <span style={{ color: 'var(--txt-3)' }}>{formatDate(o.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
