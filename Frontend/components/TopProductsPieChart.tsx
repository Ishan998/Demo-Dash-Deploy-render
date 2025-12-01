import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Order, OrderStatus, ProductPerformanceData } from '../types';

const COLORS = ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

const calculateTopProducts = (orders: Order[]): ProductPerformanceData[] => {
  const productSales = new Map<string, number>();

  orders.forEach(order => {
    if (order.status === OrderStatus.Completed || order.status === OrderStatus.Dispatched) {
      // ✅ Guard: only loop if items is an array
      (order.items ?? []).forEach(item => {
        const currentSales = productSales.get(item.name) || 0;
        productSales.set(item.name, currentSales + (item.price * item.quantity));
      });
    }
  });

  const sortedProducts = Array.from(productSales.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (sortedProducts.length <= 5) {
    return sortedProducts;
  }

  const top4 = sortedProducts.slice(0, 4);
  const otherValue = sortedProducts.slice(4).reduce((sum, p) => sum + p.value, 0);

  return [...top4, { name: 'Other', value: otherValue }];
};

const TopProductsPieChart: React.FC<{ orders: Order[] | any }> = ({ orders }) => {
  // ✅ Normalize orders (handles both array & paginated object)
  const safeOrders = useMemo(() => {
    if (Array.isArray(orders)) return orders;
    if (orders && Array.isArray(orders.results)) return orders.results;
    return [];
  }, [orders]);

  const topProductsData = useMemo(() => calculateTopProducts(safeOrders), [safeOrders]);

  return (
    <div className="bg-card p-6 rounded-xl shadow-md h-96 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-text-primary">Top Products by Sales</h2>
      {topProductsData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
            <Pie
              data={topProductsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {topProductsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #e0e0e0',
                borderRadius: '0.5rem',
              }}
            />
            <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-text-secondary">No sales data available for products.</p>
        </div>
      )}
    </div>
  );
};

export default TopProductsPieChart;
