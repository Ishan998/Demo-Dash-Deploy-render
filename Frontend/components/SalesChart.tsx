import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { generateOrderCountDataFromOrders } from '../constants';
import { OrderStatusDataPoint, Order } from '../types';

type SalesPeriod = 'Yearly' | 'Monthly' | 'Weekly' | '24h';

const periodOptions = [
  { key: '24h' as SalesPeriod, label: '24H' },
  { key: 'Weekly' as SalesPeriod, label: 'Week' },
  { key: 'Monthly' as SalesPeriod, label: 'Month' },
  { key: 'Yearly' as SalesPeriod, label: 'Year' },
];

const SalesChart: React.FC<{ orders: Order[] | any }> = ({ orders }) => {
  // Normalize orders
  const safeOrders = useMemo(() => {
    if (Array.isArray(orders)) return orders;
    if (orders && Array.isArray(orders.results)) return orders.results;
    return [];
  }, [orders]);

  const [selectedPeriod, setSelectedPeriod] = useState<SalesPeriod>('Weekly');

  const data: OrderStatusDataPoint[] = useMemo(() => {
    return generateOrderCountDataFromOrders(safeOrders, selectedPeriod);
  }, [safeOrders, selectedPeriod]);

  const yAxisFormatter = (value: number) => {
    if (value >= 1000) return `${value / 1000}k`;
    return `${value}`;
  };

  return (
    <div className="bg-card p-4 rounded-xl shadow-md flex flex-col min-w-[200px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-text-primary">
          Order Volume Overview
        </h2>

        <div className="flex items-center bg-gray-200 rounded-full p-1">
          {periodOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedPeriod(option.key)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                selectedPeriod === option.key
                  ? 'bg-primary text-white shadow'
                  : 'text-text-secondary hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-grow min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="name"
              dy={10}
              tick={{ fill: '#6b7280' }}
              fontSize={12}
            />
            <YAxis
              tickFormatter={yAxisFormatter}
              tick={{ fill: '#6b7280' }}
              fontSize={12}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #e0e0e0',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number, name: string) => [
                `${value} orders`,
                name,
              ]}
            />
            <Legend verticalAlign="bottom" height={36} />
            <Line
              type="monotone"
              dataKey="total"
              name="Total Orders"
              stroke="#4f46e5"
              strokeWidth={2.5}
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#10b981"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="dispatched"
              name="Dispatched"
              stroke="#f59e0b"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="inProgress"
              name="In Progress"
              stroke="#3b82f6"
              strokeWidth={2}
              activeDot={{ r: 6 }}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
