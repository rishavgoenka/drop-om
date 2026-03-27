import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { newId } from './utils';

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

export default function App() {
  const [orders, setOrders]             = useLocalStorage('dropom_orders', []);
  const [transactions, setTransactions] = useLocalStorage('dropom_transactions', []);
  const [customers, setCustomers]       = useLocalStorage('dropom_customers', []);
  const [suppliers, setSuppliers]       = useLocalStorage('dropom_suppliers', []);

  // Orders
  const addOrder    = (o) => setOrders(p => [...p, o]);
  const updateOrder = (u) => setOrders(p => p.map(o => o.id === u.id ? u : o));
  const deleteOrder = (id) => { setOrders(p => p.filter(o => o.id !== id)); setTransactions(p => p.filter(t => t.orderId !== id)); };

  // Transactions
  const addTransaction    = (t) => setTransactions(p => [...p, t]);
  const updateTransaction = (u) => setTransactions(p => p.map(t => t.id === u.id ? u : t));
  const deleteTransaction = (id) => setTransactions(p => p.filter(t => t.id !== id));

  // Customers
  const addCustomer    = (c) => setCustomers(p => [...p, { ...c, id: newId() }]);
  const updateCustomer = (u) => setCustomers(p => p.map(c => c.id === u.id ? u : c));
  const deleteCustomer = (id) => setCustomers(p => p.filter(c => c.id !== id));

  // Suppliers
  const addSupplier    = (s) => setSuppliers(p => [...p, { ...s, id: newId() }]);
  const updateSupplier = (u) => setSuppliers(p => p.map(s => s.id === u.id ? u : s));
  const deleteSupplier = (id) => setSuppliers(p => p.filter(s => s.id !== id));

  const ctx = {
    orders, transactions, customers, suppliers,
    addOrder, updateOrder, deleteOrder,
    addTransaction, updateTransaction, deleteTransaction,
    addCustomer, updateCustomer, deleteCustomer,
    addSupplier, updateSupplier, deleteSupplier,
  };

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
