import React, { useState } from 'react';
import { AnalyticsDataPoint } from '../types';
import Pagination from './Pagination';
import { formatCurrency } from '../constants';

interface AnalyticsDataTableProps {
    data: AnalyticsDataPoint[];
    onRefresh?: () => void;
    refreshing?: boolean;
    totals?: { revenue?: number; orders?: number };
}

const AnalyticsDataTable: React.FC<AnalyticsDataTableProps> = ({ data, onRefresh, refreshing = false, totals }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Show most recent first
    const sorted = [...data].reverse();
    const fallbackTotals = sorted.reduce(
        (acc, curr) => {
            acc.revenue += curr.revenue;
            acc.orders += curr.orders;
            return acc;
        },
        { revenue: 0, orders: 0 }
    );
    const totalRevenue = totals?.revenue ?? fallbackTotals.revenue;
    const totalOrders = totals?.orders ?? fallbackTotals.orders;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sorted.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sorted.length / itemsPerPage);

    return (
        <div className="bg-card rounded-xl shadow-md overflow-hidden">
             <div className="flex items-center justify-between p-6">
                <div>
                    <h3 className="text-xl font-bold text-text-primary">Data Details</h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Revenue: <span className="font-semibold text-green-700">{formatCurrency(totalRevenue)}</span> · Orders: <span className="font-semibold text-text-primary">{totalOrders.toLocaleString()}</span>
                    </p>
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition flex items-center gap-2"
                        title="Refresh data"
                    >
                        {refreshing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"></circle>
                                    <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75" />
                                </svg>
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 4v5h.582m14.356 2A8 8 0 104.582 9M20 20v-5h-.581" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Refresh
                            </>
                        )}
                    </button>
                )}
             </div>
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Period</th>
                            <th className="py-3 px-6 text-right">Revenue</th>
                            <th className="py-3 px-6 text-right">Orders</th>
                            <th className="py-3 px-6 text-right">Wishlisted</th>
                            <th className="py-3 px-6 text-right">In Cart</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {currentItems.map((item) => (
                           <tr key={item.name} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6 text-left font-medium text-text-primary">{item.name}</td>
                                <td className="py-3 px-6 text-right font-mono text-green-600">{formatCurrency(item.revenue)}</td>
                                <td className="py-3 px-6 text-right font-mono">{item.orders.toLocaleString()}</td>
                                <td className="py-3 px-6 text-right font-mono">{item.wishlisted.toLocaleString()}</td>
                                <td className="py-3 px-6 text-right font-mono">{item.inCart.toLocaleString()}</td>
                           </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
};

export default AnalyticsDataTable;
