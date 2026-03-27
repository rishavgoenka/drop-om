import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { newId, safeName } from './utils';

import BottomNav       from './components/BottomNav';
import Dashboard       from './components/Dashboard';
import OrdersView      from './components/OrdersView';
import CreateOrder     from './components/CreateOrder';
import OrderDetail     from './components/OrderDetail';
import FinanceView     from './components/FinanceView';
import NewTransaction  from './components/NewTransaction';
import CustomerList    from './components/CustomerList';
import CustomerOrders  from './components/CustomerOrders';
import SupplierList    from './components/SupplierList';
import SupplierOrders  from './components/SupplierOrders';

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const sanitizeOrders = (value) => ensureArray(value)
  .filter((o) => o && typeof o === 'object' && typeof o.id === 'string')
  .map((o) => ({
    ...o,
    customerName: safeName(o.customerName),
    customerPhone: safeName(o.customerPhone),
    customerAddress: safeName(o.customerAddress),
    supplierName: safeName(o.supplierName || o.customerName),
    supplierPhone: safeName(o.supplierPhone),
    supplierAddress: safeName(o.supplierAddress),
    items: ensureArray(o.items),
    shippingStatus: safeName(o.shippingStatus, 'ordered') || 'ordered',
  }));

const sanitizeTransactions = (value) => ensureArray(value)
  .filter((t) => t && typeof t === 'object' && typeof t.id === 'string' && typeof t.orderId === 'string')
  .map((t) => ({
    ...t,
    type: t.type === 'debit' ? 'debit' : 'credit',
    amount: Number(t.amount) || 0,
    partyName: safeName(t.partyName),
    notes: safeName(t.notes),
  }));

const sanitizeContacts = (value) => ensureArray(value)
  .filter((x) => x && typeof x === 'object' && typeof x.id === 'string')
  .map((x) => ({
    ...x,
    name: safeName(x.name),
    phone: safeName(x.phone),
    address: safeName(x.address),
    notes: safeName(x.notes),
  }))
  .filter((x) => x.name);

export default function App() {
  const [orders, setOrders] = useLocalStorage('dropom_orders', [], { validate: sanitizeOrders });
  const [transactions, setTransactions] = useLocalStorage('dropom_transactions', [], { validate: sanitizeTransactions });
  const [customers, setCustomers] = useLocalStorage('dropom_customers', [], { validate: sanitizeContacts });
  const [suppliers, setSuppliers] = useLocalStorage('dropom_suppliers', [], { validate: sanitizeContacts });

  // Orders
  const addOrder    = (o) => setOrders(p => [...p, o]);
  const updateOrder = (u) => setOrders(p => p.map(o => o.id === u.id ? u : o));
  const deleteOrder = (id) => { setOrders(p => p.filter(o => o.id !== id)); setTransactions(p => p.filter(t => t.orderId !== id)); };

  // Transactions
  const addTransaction    = (t) => setTransactions(p => [...p, t]);
  const updateTransaction = (u) => setTransactions(p => p.map(t => t.id === u.id ? u : t));
  const deleteTransaction = (id) => setTransactions(p => p.filter(t => t.id !== id));

  // Customers
  const addCustomer = (c) => {
    const name = safeName(c?.name);
    if (!name) return { ok: false, reason: 'Customer name is required.' };

    const normalized = {
      ...c,
      id: c?.id || newId(),
      name,
      phone: safeName(c?.phone),
      address: safeName(c?.address),
      notes: safeName(c?.notes),
    };
    setCustomers((p) => [...p, normalized]);
    return { ok: true };
  };
  const updateCustomer = (u) => {
    const existing = customers.find((c) => c.id === u?.id);
    if (!existing) return;

    const nextName = safeName(u?.name);
    if (!nextName) return;

    const oldKey = safeName(existing.name).toLowerCase();
    const nextPhone = safeName(u?.phone);
    const nextAddress = safeName(u?.address);
    const normalized = {
      ...u,
      id: existing.id,
      name: nextName,
      phone: nextPhone,
      address: nextAddress,
      notes: safeName(u?.notes),
    };

    setCustomers((p) => p.map((c) => (c.id === normalized.id ? normalized : c)));

    setOrders((p) => p.map((o) => {
      if (safeName(o?.customerName).toLowerCase() !== oldKey) return o;
      return {
        ...o,
        customerName: normalized.name,
        customerPhone: nextPhone,
        customerAddress: nextAddress,
      };
    }));

    setTransactions((p) => p.map((t) => {
      if (t.type !== 'credit') return t;
      if (safeName(t?.partyName).toLowerCase() !== oldKey) return t;
      return { ...t, partyName: normalized.name };
    }));
  };
  const deleteCustomer = (id) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return { ok: false, reason: 'Customer not found.' };

    const key = customer.name.trim().toLowerCase();
    const linkedOrders = orders.filter((o) => safeName(o.customerName).toLowerCase() === key);
    const linkedCredits = transactions.filter((t) => t.type === 'credit' && safeName(t.partyName).toLowerCase() === key);
    if (linkedOrders.length > 0 || linkedCredits.length > 0) {
      return { ok: false, reason: 'Customer has linked orders or credits. Reassign or delete linked records first.' };
    }

    setCustomers((p) => p.filter((c) => c.id !== id));
    return { ok: true };
  };

  // Suppliers
  const addSupplier = (s) => {
    const name = safeName(s?.name);
    if (!name) return { ok: false, reason: 'Supplier name is required.' };

    const normalized = {
      ...s,
      id: s?.id || newId(),
      name,
      phone: safeName(s?.phone),
      address: safeName(s?.address),
      notes: safeName(s?.notes),
    };
    setSuppliers((p) => [...p, normalized]);
    return { ok: true };
  };
  const updateSupplier = (u) => {
    const existing = suppliers.find((s) => s.id === u?.id);
    if (!existing) return;

    const nextName = safeName(u?.name);
    if (!nextName) return;

    const oldKey = safeName(existing.name).toLowerCase();
    const nextPhone = safeName(u?.phone);
    const nextAddress = safeName(u?.address);
    const normalized = {
      ...u,
      id: existing.id,
      name: nextName,
      phone: nextPhone,
      address: nextAddress,
      notes: safeName(u?.notes),
    };

    setSuppliers((p) => p.map((s) => (s.id === normalized.id ? normalized : s)));

    setOrders((p) => p.map((o) => {
      if (safeName(o?.supplierName).toLowerCase() !== oldKey) return o;
      return {
        ...o,
        supplierName: normalized.name,
        supplierPhone: nextPhone,
        supplierAddress: nextAddress,
      };
    }));

    setTransactions((p) => p.map((t) => {
      if (t.type !== 'debit') return t;
      if (safeName(t?.partyName).toLowerCase() !== oldKey) return t;
      return { ...t, partyName: normalized.name };
    }));
  };
  const deleteSupplier = (id) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return { ok: false, reason: 'Supplier not found.' };

    const key = supplier.name.trim().toLowerCase();
    const linkedDebits = transactions.filter((t) => t.type === 'debit' && safeName(t.partyName).toLowerCase() === key);
    if (linkedDebits.length > 0) {
      return { ok: false, reason: 'Supplier has linked debit transactions. Reassign or delete linked records first.' };
    }

    setSuppliers((p) => p.filter((s) => s.id !== id));
    return { ok: true };
  };

  const ctx = {
    orders, transactions, customers, suppliers,
    addOrder, updateOrder, deleteOrder,
    addTransaction, updateTransaction, deleteTransaction,
    addCustomer, updateCustomer, deleteCustomer,
    addSupplier, updateSupplier, deleteSupplier,
  };

  React.useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    let frame = 0;
    const updateViewport = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const viewportHeight = Math.round(viewport.height);
        root.style.setProperty('--vvh', `${viewportHeight}px`);
        const keyboardOffset = window.innerHeight - viewportHeight;
        root.classList.toggle('keyboard-open', keyboardOffset > 140);
      });
    };

    updateViewport();
    viewport.addEventListener('resize', updateViewport);
    viewport.addEventListener('scroll', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', updateViewport);
      viewport.removeEventListener('scroll', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      root.classList.remove('keyboard-open');
      root.style.removeProperty('--vvh');
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/"                       element={<Dashboard {...ctx} />} />
        <Route path="/orders"                 element={<OrdersView {...ctx} />} />
        <Route path="/orders/new"             element={<CreateOrder {...ctx} />} />
        <Route path="/orders/:id"             element={<OrderDetail {...ctx} />} />
        <Route path="/finance"                element={<FinanceView {...ctx} />} />
        <Route path="/finance/new"            element={<NewTransaction {...ctx} />} />
        <Route path="/finance/edit/:id"       element={<NewTransaction {...ctx} />} />
        <Route path="/customers"              element={<CustomerList {...ctx} />} />
        <Route path="/customers/:name"        element={<CustomerOrders {...ctx} />} />
        <Route path="/suppliers"              element={<SupplierList {...ctx} />} />
        <Route path="/suppliers/:name"        element={<SupplierOrders {...ctx} />} />
        <Route path="*"                       element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}
