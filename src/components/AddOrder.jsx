import React, { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';

export default function AddOrder({ addOrder, setTab }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    supplierPrice: '',
    shippingCost: '',
    sellingPrice: '',
    shippingStatus: 'ordered',
    paymentStatus: 'due',
  });

  const [profit, setProfit] = useState(0);

  useEffect(() => {
    const sp = Number(formData.sellingPrice) || 0;
    const sup = Number(formData.supplierPrice) || 0;
    
    // Profit = Selling Price - Supplier Price.
    // The customer pays (Selling Price + Shipping). Wait, if customer pays SP + Delivery, and supplier charges SupplierPrice + Shipping, then Profit is SP - SupplierPrice.
    // Let's confirm: "if the supplier price is 75, selling price is 100 and shipping is 80... taking 25rs profit" -> Correct.
    setProfit(sp - sup);
  }, [formData.sellingPrice, formData.supplierPrice]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.update = false;
    e.preventDefault();
    addOrder({
      ...formData,
      id: Date.now().toString(),
      profit,
      date: new Date().toISOString()
    });
    setTab('dashboard');
  };

  const generateQuote = () => {
    const sp = formData.sellingPrice || 0;
    const ship = formData.shippingCost || 0;
    const text = `✨ Gorgeous Item Available! ✨\nPrice: ₹${sp} + ₹${ship} Delivery.\nOrder now before it's gone! 🛍️`;
    if (navigator.share) {
      navigator.share({ title: 'Quote', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Quote copied to clipboard!');
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '1.5rem' }}>
        <h2>New Order ✨</h2>
        <p>Add a new sale and track your profits.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-panel">
        
        <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Customer Details</h4>
        <div className="form-group">
          <label>Name</label>
          <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="e.g. Priya Sharma" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Phone Number (Optional)</label>
            <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} placeholder="+91..." />
          </div>
          <div className="form-group">
            <label>Address (Optional)</label>
            <textarea name="customerAddress" value={formData.customerAddress} onChange={handleChange} rows="1" placeholder="Full address..." />
          </div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-glass)', margin: '1.5rem 0' }}></div>
        
        <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Financials</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label>Supplier Price (₹)</label>
            <input type="number" name="supplierPrice" value={formData.supplierPrice} onChange={handleChange} required min="0" />
          </div>
          <div className="form-group">
            <label>Shipping (₹)</label>
            <input type="number" name="shippingCost" value={formData.shippingCost} onChange={handleChange} required min="0" />
          </div>
          <div className="form-group">
            <label>Selling Price (₹)</label>
            <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} required min="0" />
          </div>
        </div>

        <div className="glass-panel" style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'var(--accent-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem' }}>
          <span style={{ fontWeight: 600 }}>Calculated Profit:</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ₹{profit}
          </span>
        </div>

        <div style={{ height: '1px', background: 'var(--border-glass)', margin: '1.5rem 0' }}></div>
        
        <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Status Tracker</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label>Shipping Status</label>
            <select name="shippingStatus" value={formData.shippingStatus} onChange={handleChange}>
              <option value="ordered">Ordered 📦</option>
              <option value="in_transit">In Transit 🚚</option>
              <option value="delivered">Delivered ✅</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Status</label>
            <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange}>
              <option value="due">Due ⏳</option>
              <option value="adv">Advanced (Adv) 💳</option>
              <option value="partially">Partially Paid 🪙</option>
              <option value="paid">Paid 💰</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4" style={{ marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Order</button>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={generateQuote}>
            <Share2 size={18} /> Quote
          </button>
        </div>
      </form>
    </div>
  );
}
