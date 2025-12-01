import React, { useState, useMemo } from 'react';
import type { Order, OrderItemSummary, ProductReview } from '../types';
import { products } from '../constants';

interface MyOrdersTabProps {
  orders: Order[];
  onNavigateToAllProducts: () => void;
  onInitiateReturn: (order: Order) => void;
  onRefresh?: () => void;
  onAddReview?: (order: Order, item: OrderItemSummary) => void;
  reviews?: ProductReview[];
}

const MyOrdersTab: React.FC<MyOrdersTabProps> = ({
  orders,
  onNavigateToAllProducts,
  onInitiateReturn,
  onRefresh,
  onAddReview,
  reviews = [],
}) => {
  const [sortOption, setSortOption] = useState('date-desc');

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'total-asc':
          return a.total - b.total;
        case 'total-desc':
          return b.total - a.total;
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [orders, sortOption]);

  const statusMeta: Record<Order['status'], { label: string; badge: string }> = {
    pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Accepted', badge: 'bg-green-100 text-green-800' },
    dispatched: { label: 'Dispatched', badge: 'bg-blue-100 text-blue-800' },
    processing: { label: 'Processing', badge: 'bg-yellow-100 text-yellow-800' },
    shipped: { label: 'Shipped', badge: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', badge: 'bg-green-100 text-green-800' },
    delivered: { label: 'Delivered', badge: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-800' },
    return_requested: { label: 'Return Requested', badge: 'bg-orange-100 text-orange-800' },
    return_approved: { label: 'Return Approved', badge: 'bg-purple-100 text-purple-800' },
    return_rejected: { label: 'Return Rejected', badge: 'bg-red-100 text-red-800' },
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold">My Orders</h2>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={onNavigateToAllProducts}
            className="bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 text-sm whitespace-nowrap"
          >
            Continue Shopping
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-white border border-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md hover:border-gray-400 text-sm whitespace-nowrap"
            >
              Refresh Orders
            </button>
          )}
          <div className="flex-grow">
            <label htmlFor="sort-orders" className="text-sm mr-2 sr-only">
              Sort by:
            </label>
            <select
              id="sort-orders"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-[#D4AF37] focus:border-[#D4AF37]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="total-desc">Total: High to Low</option>
              <option value="total-asc">Total: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <details
              key={order.id}
              className="bg-gray-50 p-4 rounded-lg border group"
              open={order.id === sortedOrders[0].id}
            >
              <summary className="cursor-pointer list-none grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                <div className="font-semibold text-gray-800">{`ORD-${order.id}`}</div>
                <div className="text-sm text-gray-600">
                  {new Date(order.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      statusMeta[order.status]?.badge || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusMeta[order.status]?.label || order.status}
                  </span>
                </div>
                <div className="font-semibold text-right">Rs. {order.total.toLocaleString('en-IN')}</div>
                <div className="text-right">
                  {order.status === 'delivered' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onInitiateReturn(order);
                      }}
                      className="text-sm font-bold bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Request Return
                    </button>
                  )}
                </div>
              </summary>
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2 text-sm">Order Items:</h4>
                <div className="space-y-1">
                  {order.items.map((item, index) => {
                    const product = products.find((p) => p.id === item.productId);
                    const lineName = item.name || product?.name || 'Unknown Product';
                    const linePrice = (product?.price ?? item.price ?? 0) * item.quantity;
                    const existingReview = reviews.find(
                      (r) => r.product_id === item.productId && r.order_id === order.id
                    );
                    const showReviewCta =
                      (order.status === 'completed' || order.status === 'delivered') &&
                      !!item.productId &&
                      !existingReview;

                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm py-2 text-gray-600 gap-2"
                      >
                        <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                          <span>
                            {lineName} <span className="text-gray-400">x {item.quantity}</span>
                          </span>
                          <span className="sm:hidden font-semibold text-gray-800">
                            Rs. {linePrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="hidden sm:inline font-semibold text-gray-800">
                            Rs. {linePrice.toLocaleString('en-IN')}
                          </span>
                          {existingReview ? (
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-md">
                              Reviewed
                            </span>
                          ) : (
                            showReviewCta && (
                              <button
                                onClick={() => onAddReview?.(order, item)}
                                className="text-xs font-semibold bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded-md hover:border-gray-400"
                              >
                                Write a Review
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">You have not placed any orders yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyOrdersTab;
