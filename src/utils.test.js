import { describe, test, expect } from 'vitest';
import {
  computeOrderTotals,
  derivePaymentStatus,
  deriveSupplierStatus,
  getUniqueCustomers,
  istDateInputToISO,
  istDateTimeInputToISO,
  isoToISTDateTimeInput,
  safeDecodeURIComponent,
  safeName,
} from './utils';

describe('financial helpers', () => {
  test('computeOrderTotals returns expected derived values', () => {
    const order = {
      items: [
        { name: 'A', costPrice: 100, sellingPrice: 150, qty: 2 },
        { name: 'B', costPrice: 50, sellingPrice: 80, qty: 1 },
      ],
      shippingCost: 20,
    };

    const totals = computeOrderTotals(order);
    expect(totals.totalCP).toBe(250);
    expect(totals.totalSP).toBe(380);
    expect(totals.profit).toBe(130);
    expect(totals.customerOwes).toBe(400);
    expect(totals.supplierOwes).toBe(270);
  });

  test('derivePaymentStatus handles partial and overpaid states', () => {
    const order = {
      id: 'o1',
      items: [{ costPrice: 10, sellingPrice: 20, qty: 1 }],
      shippingCost: 0,
    };

    const partial = derivePaymentStatus(order, [{ orderId: 'o1', type: 'credit', amount: 5 }]);
    expect(partial.status).toBe('partially');
    expect(partial.pending).toBe(15);

    const overpaid = derivePaymentStatus(order, [{ orderId: 'o1', type: 'credit', amount: 25 }]);
    expect(overpaid.status).toBe('overpaid');
    expect(overpaid.excess).toBe(5);
  });

  test('deriveSupplierStatus computes remaining and paid', () => {
    const order = {
      id: 'o2',
      items: [{ costPrice: 30, sellingPrice: 50, qty: 2 }],
      shippingCost: 10,
    };

    const status = deriveSupplierStatus(order, [{ orderId: 'o2', type: 'debit', amount: 40 }]);
    expect(status.supplierOwes).toBe(70);
    expect(status.remaining).toBe(30);
    expect(status.status).toBe('partially');
  });
});

describe('date helpers', () => {
  test('istDateInputToISO parses expected date input', () => {
    const iso = istDateInputToISO('2026-03-27');
    expect(iso).toBe('2026-03-26T18:30:00.000Z');
  });

  test('istDateTimeInputToISO parses expected datetime input', () => {
    const iso = istDateTimeInputToISO('2026-03-27T12:45');
    expect(iso).toBe('2026-03-27T07:15:00.000Z');
  });

  test('isoToISTDateTimeInput returns valid datetime-local value', () => {
    const local = isoToISTDateTimeInput('2026-03-27T07:15:00.000Z');
    expect(local).toBe('2026-03-27T12:45');
  });

  test('invalid inputs return null or safe fallback', () => {
    expect(istDateInputToISO('x')).toBeNull();
    expect(istDateTimeInputToISO('x')).toBeNull();
    expect(isoToISTDateTimeInput('bad-value')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe('safety helpers', () => {
  test('safeName normalizes values', () => {
    expect(safeName('  Alice  ')).toBe('Alice');
    expect(safeName(null)).toBe('');
  });

  test('safeDecodeURIComponent does not throw on malformed input', () => {
    expect(safeDecodeURIComponent('%E0%A4%A')).toBe('%E0%A4%A');
    expect(safeDecodeURIComponent('John%20Doe')).toBe('John Doe');
  });

  test('getUniqueCustomers deduplicates and merges details safely', () => {
    const customers = getUniqueCustomers([
      { customerName: 'Alice', customerPhone: '123' },
      { customerName: ' alice ', customerAddress: 'Addr' },
      { customerName: 'Bob' },
      { customerName: null },
    ]);

    expect(customers).toHaveLength(2);
    const alice = customers.find((c) => c.name.toLowerCase() === 'alice');
    expect(alice.phone).toBe('123');
    expect(alice.address).toBe('Addr');
  });
});
