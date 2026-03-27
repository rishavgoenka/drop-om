import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';

import BottomNav    from './components/BottomNav';
import Dashboard    from './components/Dashboard';
import OrdersView   from './components/OrdersView';
import FinanceView  from './components/FinanceView';
import CustomerList from './components/CustomerList';
import OrderForm    from './components/OrderForm';

export default function App() {
  const [tab, setTab]         = useState('dashboard');
  const [orders, setOrders]   = useLocalStorage('dropom_orders', []);
  const [editOrder, setEdit]  = useState(null); // null = closed, {} = new, order = edit

  const openNew  = ()  => setEdit({});
  const openEdit = (o) => setEdit(o);
  const closeForm = () => setEdit(null);

  const saveOrder = (order) => {
    setOrders(prev => {
      const exists = prev.find(o => o.id === order.id);
      if (exists) return prev.map(o => o.id === order.id ? order : o);
      return [order, ...prev];
    });
  };

  const deleteOrder = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const renderTab = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard    orders={orders} onNewOrder={openNew} onSelectOrder={openEdit} />;
      case 'orders':    return <OrdersView   orders={orders} onNewOrder={openNew} onSelectOrder={openEdit} />;
      case 'finance':   return <FinanceView  orders={orders} />;
      case 'customers': return <CustomerList orders={orders} onSelectOrder={openEdit} />;
      default:          return <Dashboard    orders={orders} onNewOrder={openNew} onSelectOrder={openEdit} />;
    }
  };

  return (
    <>
      {renderTab()}
      <BottomNav current={tab} onChange={setTab} />
      {editOrder !== null && (
        <OrderForm
          initialOrder={editOrder.id ? editOrder : null}
          onSave={saveOrder}
          onDelete={deleteOrder}
          onClose={closeForm}
        />
      )}
    </>
  );
}
