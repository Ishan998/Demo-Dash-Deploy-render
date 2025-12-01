import React, { useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { formatCurrency } from '../constants';

const getStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.Completed:
      return 'bg-green-100 text-green-800';
    case OrderStatus.Pending:
      return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.Cancelled:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const OrderRow: React.FC<{ order: Order }> = ({ order }) => (
  <tr className="border-b border-gray-200 hover:bg-gray-50">
    <td className="py-3 px-6 text-left font-medium text-primary">#{order.id}</td>
    <td className="py-3 px-6 text-left">{order.customerName || '—'}</td>
    <td className="py-3 px-6 text-center">{new Date(order.date).toLocaleDateString()}</td>
    <td className="py-3 px-6 text-right font-medium">{formatCurrency(order.amount)}</td>
    <td className="py-3 px-6 text-center">
      <span className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(order.status)}`}>
        {order.status}
      </span>
    </td>
  </tr>
);

const RecentOrdersTable: React.FC<{ orders: any }> = ({ orders }) => {
  // ✅ Normalize orders safely
  const safeOrders = useMemo(() => {
    if (Array.isArray(orders)) return orders;
    if (orders && Array.isArray(orders.results)) return orders.results;
    return [];
  }, [orders]);

  const recentOrders = safeOrders.slice(0, 5);

  return (
    <div className="bg-card rounded-xl shadow-md overflow-hidden">
      <h2 className="text-xl font-bold p-6 text-text-primary">Recent Orders</h2>
      <div className="overflow-x-auto">
        {recentOrders.length > 0 ? (
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Order ID</th>
                <th className="py-3 px-6 text-left">Customer</th>
                <th className="py-3 px-6 text-center">Date</th>
                <th className="py-3 px-6 text-right">Amount</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {recentOrders.map((order: Order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-gray-500 text-sm py-6">No recent orders available.</div>
        )}
      </div>
    </div>
  );
};

export default RecentOrdersTable;
