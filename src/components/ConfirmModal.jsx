import React from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return createPortal(
    <div className="modal-backdrop fade-in" onClick={onCancel} style={{ zIndex: 9999, alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '320px', padding: '1.25rem', animation: 'none' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.6rem' }}>Confirm Action</h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--txt-2)', marginBottom: '1.25rem', lineHeight: 1.4 }}>{message}</p>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-full" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-full" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
