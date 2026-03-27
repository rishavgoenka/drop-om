import React from 'react';
import { LayoutDashboard, List, IndianRupee, Users } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Home',     icon: LayoutDashboard },
  { id: 'orders',    label: 'Orders',   icon: List },
  { id: 'finance',   label: 'Finance',  icon: IndianRupee },
  { id: 'customers', label: 'Customers', icon: Users },
];

export default function BottomNav({ current, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button key={id} className={`nav-btn ${current === id ? 'active' : ''}`} onClick={() => onChange(id)}>
          <Icon size={20} strokeWidth={1.75} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
