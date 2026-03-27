import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, IndianRupee, Users, Store } from 'lucide-react';

const TABS = [
  { path: '/',           label: 'Home',      icon: LayoutDashboard },
  { path: '/orders',     label: 'Orders',    icon: List },
  { path: '/finance',    label: 'Finance',   icon: IndianRupee },
  { path: '/customers',  label: 'Buyers',    icon: Users },
  { path: '/suppliers',  label: 'Suppliers', icon: Store },
];

export default function BottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {TABS.map(({ path, label, icon }) => {
        const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
        return (
          <button type="button" key={path} className={`nav-btn ${active ? 'active' : ''}`} onClick={() => nav(path)}>
            {React.createElement(icon, { size: 17, strokeWidth: 1.75 })}
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
