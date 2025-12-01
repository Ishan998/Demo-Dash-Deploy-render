import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalyticsDataPoint } from '../types';
import { formatCurrency } from '../constants';

interface AnalyticsChartProps {
    data: AnalyticsDataPoint[];
    dataKey: keyof Omit<AnalyticsDataPoint, 'name'>;
    label: string;
    color: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, dataKey, label, color }) => {

    const yAxisFormatter = (value: number) => {
        if (dataKey === 'revenue') {
             if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
             if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
             return `₹${value}`;
        }
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
        return value.toString();
    };

    const tooltipFormatter = (value: number) => {
        if(dataKey === 'revenue') return formatCurrency(value);
        return value.toLocaleString();
    };

    return (
        <div className="h-96 w-full">
            <h3 className="text-xl font-bold text-text-primary mb-4">{label} Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" dy={10} tick={{ fill: '#6b7280' }} fontSize={12} />
                    <YAxis tickFormatter={yAxisFormatter} tick={{ fill: '#6b7280' }} fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value: number) => [tooltipFormatter(value), label]}
                        labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '30px' }} />
                    <Line type="monotone" dataKey={dataKey} name={label} stroke={color} strokeWidth={2.5} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AnalyticsChart;
