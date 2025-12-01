import React, { useState, useMemo, useEffect } from 'react';
import { ICONS, generateAnalyticsData, formatCurrency } from '../constants';
// import { ICONS, formatCurrency } from '../constants';
import { Order, AnalyticsDataPoint } from '../types';
import AnalyticsKpiCard from '../components/AnalyticsKpiCard';
import AnalyticsChart from '../components/AnalyticsChart';
import AnalyticsDataTable from '../components/AnalyticsDataTable';
import RatingAnalysis, { RatingAnalysisData } from '../components/RatingAnalysis';
import { getWishlistCartTimeseries, getAnalyticsSummary, getAnalyticsTopProducts, getCustomerRatingAnalysis, downloadProductRatingsExcel } from '../services/apiService';
import { utils, writeFileXLSX } from 'xlsx';

type AnalyticsPeriod = 'Yearly' | 'Monthly' | 'Weekly' | 'Daily';
type AnalyticsMetric = 'revenue' | 'orders' | 'wishlisted' | 'inCart';

interface MetricConfig {
    label: string;
    color: string;
    icon: React.ReactNode;
    formatter: (value: number) => string;
}

const METRIC_CONFIGS: { [key in AnalyticsMetric]: MetricConfig } = {
    revenue: { label: 'Total Revenue', color: '#4f46e5', icon: ICONS.revenue, formatter: formatCurrency },
    orders: { label: 'Total Orders', color: '#10b981', icon: ICONS.totalOrders, formatter: (v) => v.toLocaleString() },
    wishlisted: { label: 'Products Wishlisted', color: '#ec4899', icon: ICONS.wishlist, formatter: (v) => v.toLocaleString() },
    inCart: { label: 'Products in Cart', color: '#06b6d4', icon: ICONS.inCart, formatter: (v) => v.toLocaleString() },
};

const AnalyticsPage: React.FC<{ orders: Order[] | any }> = ({ orders }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('Monthly');
    const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric>('revenue');
    const [liveMetrics, setLiveMetrics] = useState({
    revenue: 0,
    orders: 0,
    wishlisted: 0,
    inCart: 0,
  });
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [ratingData, setRatingData] = useState<RatingAnalysisData | null>(null);
    const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  

    // ✅ Normalize orders here
    const safeOrders = useMemo(() => {
        if (Array.isArray(orders)) return orders;
        if (orders && Array.isArray(orders.results)) return orders.results;
        return [];
    }, [orders]);

    // ✅ Use safeOrders instead of orders everywhere
    const [data, setData] = useState<AnalyticsDataPoint[]>([]);
    const [seriesTotals, setSeriesTotals] = useState<{ revenue: number; orders: number; wishlisted: number; inCart: number }>({ revenue: 0, orders: 0, wishlisted: 0, inCart: 0 });
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getWishlistCartTimeseries(selectedPeriod);
                if (!cancelled) {
                    const serverSeries = (res as any)?.data || [];
                    const t = (res as any)?.totals || {};
                    // If server returned empty series, fall back to client-derived series from orders
                    if (Array.isArray(serverSeries) && serverSeries.length > 0) {
                        setData(serverSeries as any);
                        setSeriesTotals({
                            revenue: Number(t.revenue) || 0,
                            orders: Number(t.orders) || 0,
                            wishlisted: Number(t.wishlisted) || 0,
                            inCart: Number(t.inCart ?? t.in_cart) || 0,
                        });
                    } else {
                        const fallback = generateAnalyticsData(safeOrders, selectedPeriod);
                        setData(fallback as any);
                        const totals = fallback.reduce(
                            (acc, curr) => {
                                acc.revenue += curr.revenue;
                                acc.orders += curr.orders;
                                acc.wishlisted += curr.wishlisted;
                                acc.inCart += curr.inCart;
                                return acc;
                            },
                            { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 }
                        );
                        setSeriesTotals(totals);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    // On error, compute a complete fallback from orders
                    const fallback = generateAnalyticsData(safeOrders, selectedPeriod);
                    setData(fallback as any);
                    const totals = fallback.reduce(
                        (acc, curr) => {
                            acc.revenue += curr.revenue;
                            acc.orders += curr.orders;
                            acc.wishlisted += curr.wishlisted;
                            acc.inCart += curr.inCart;
                            return acc;
                        },
                        { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 }
                    );
                    setSeriesTotals(totals);
                }
            } finally {
                if (!cancelled) setIsRefreshing(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedPeriod, safeOrders, refreshKey]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setIsLoadingRatings(true);
                const res = await getCustomerRatingAnalysis();
                if (!cancelled) setRatingData(res);
            } catch (_err) {
                if (!cancelled) setRatingData(null);
            } finally {
                if (!cancelled) setIsLoadingRatings(false);
            }
        })();
        return () => { cancelled = true; };
    }, [refreshKey]);

    // Fetch overall totals for KPIs from backend summary
    const [summaryTotals, setSummaryTotals] = useState<{ revenue: number; orders: number; wishlisted: number; inCart: number } | null>(null);
    const [topProducts, setTopProducts] = useState<{ topWishlisted: any[]; topCarted: any[] }>({ topWishlisted: [], topCarted: [] });
    const [modalState, setModalState] = useState<{ type: 'wishlisted' | 'carted'; items: any[] } | null>(null);
    const [isDownloadingRatings, setIsDownloadingRatings] = useState(false);
    const exportTopList = (type: 'wishlisted' | 'carted') => {
        const items = type === 'wishlisted' ? topProducts.topWishlisted : topProducts.topCarted;
        if (!items || items.length === 0) return;
        const sheetData = items.map((item: any, idx: number) => ({
            Rank: idx + 1,
            'Product ID': item.productId,
            'Product Name': item.name,
            Count: item.count,
        }));
        const ws = utils.json_to_sheet(sheetData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, type === 'wishlisted' ? 'TopWishlisted' : 'TopCarted');
        writeFileXLSX(wb, type === 'wishlisted' ? 'Top_Wishlisted.xlsx' : 'Top_Carted.xlsx');
    };
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getAnalyticsSummary();
                const mapped = {
                    revenue: Number((res as any).revenue) || 0,
                    orders: Number((res as any).orders) || 0,
                    wishlisted: Number((res as any).wishlisted) || 0,
                    inCart: Number((res as any).in_cart ?? (res as any).inCart) || 0,
                };
                if (!cancelled) setSummaryTotals(mapped);
            } catch (err) {
                if (!cancelled) {
                    // Fallback: compute all-time totals from orders
                    const revenue = safeOrders
                        .filter((o) => o.status === 'Completed' || o.status === 'Dispatched')
                        .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                    const ordersCount = safeOrders.filter((o) => o.status !== 'Cancelled').length;
                    setSummaryTotals({ revenue, orders: ordersCount, wishlisted: 0, inCart: 0 });
                }
            }
        })();
        return () => { cancelled = true; };
    }, [safeOrders, refreshKey]);

    // Fetch top wishlisted/carted products
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await getAnalyticsTopProducts();
                if (!cancelled) setTopProducts(res);
            } catch (err) {
                if (!cancelled) setTopProducts({ topWishlisted: [], topCarted: [] });
            }
        })();
        return () => { cancelled = true; };
    }, [refreshKey]);

    const openModal = async (type: 'wishlisted' | 'carted') => {
        // fetch a larger list for modal
        try {
            const res = await getAnalyticsTopProducts(50);
            setModalState({
                type,
                items: type === 'wishlisted' ? res.topWishlisted : res.topCarted,
            });
        } catch {
            setModalState({
                type,
                items: type === 'wishlisted' ? topProducts.topWishlisted : topProducts.topCarted,
            });
        }
    };

    const closeModal = () => setModalState(null);

    const handleDownloadRatings = async () => {
        try {
            setIsDownloadingRatings(true);
            const blob = await downloadProductRatingsExcel();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `product-ratings-${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download ratings export', err);
        } finally {
            setIsDownloadingRatings(false);
        }
    };

    // When manual refresh requested, mark refreshing (cleared in main fetch effect)
    useEffect(() => {
        setIsRefreshing(true);
    }, [refreshKey]);

    const periodOptions: { key: AnalyticsPeriod; label: string }[] = [
        { key: 'Yearly', label: 'Yearly' },
        { key: 'Monthly', label: 'Monthly' },
        { key: 'Weekly', label: 'Weekly' },
        { key: 'Daily', label: 'Daily' },
    ];

    // Using server-provided series directly

    const totalValues = useMemo(() => {
        return data.reduce((acc, curr) => {
            acc.revenue += curr.revenue;
            acc.orders += curr.orders;
            acc.wishlisted += curr.wishlisted;
            acc.inCart += curr.inCart;
            return acc;
        }, { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 });
    }, [data]);
    
    return (
        <>
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-text-primary">Detailed Analytics</h1>
                    <div className="flex items-center bg-gray-200 rounded-full p-1">
                        {periodOptions.map(option => (
                            <button
                                key={option.key}
                                onClick={() => setSelectedPeriod(option.key)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                                    selectedPeriod === option.key ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-gray-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setRefreshKey((k) => k + 1)}
                        className="ml-4 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold bg-white hover:bg-gray-100 transition flex items-center gap-2"
                        disabled={isRefreshing}
                        title="Refresh analytics data"
                    >
                        {isRefreshing ? (
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    {(Object.keys(METRIC_CONFIGS) as AnalyticsMetric[]).map(metric => {
                        // Prefer backend all-time summary, then time-series totals for selected period, then client reduce
                        const rawValue = (summaryTotals?.[metric] ?? seriesTotals?.[metric] ?? totalValues[metric]) as number;
                        return (
                            <AnalyticsKpiCard
                                key={metric}
                                title={METRIC_CONFIGS[metric].label}
                                value={METRIC_CONFIGS[metric].formatter(rawValue)}
                                icon={METRIC_CONFIGS[metric].icon}
                                color={METRIC_CONFIGS[metric].color}
                                isActive={selectedMetric === metric}
                                onClick={() => setSelectedMetric(metric)}
                            />
                        );
                    })}
                </div>
                
                <div className="bg-card p-6 rounded-xl shadow-md mb-8">
                    <AnalyticsChart
                        data={data}
                        dataKey={selectedMetric}
                        label={METRIC_CONFIGS[selectedMetric].label}
                        color={METRIC_CONFIGS[selectedMetric].color}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AnalyticsDataTable
                        data={data}
                        totals={{
                            revenue: summaryTotals?.revenue ?? seriesTotals.revenue ?? totalValues.revenue,
                            orders: summaryTotals?.orders ?? seriesTotals.orders ?? totalValues.orders,
                        }}
                        onRefresh={() => setRefreshKey((k) => k + 1)}
                        refreshing={isRefreshing}
                    />
                    <RatingAnalysis
                        data={ratingData}
                        isLoading={isLoadingRatings || isDownloadingRatings}
                        onDownloadExcel={handleDownloadRatings}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="bg-card p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold mb-4 text-text-primary">Top Wishlisted Products</h3>
                        {topProducts.topWishlisted.length > 0 && (
                            <div className="flex justify-between items-center mb-3">
                                <button
                                    onClick={() => openModal('wishlisted')}
                                    className="text-sm font-semibold text-primary hover:underline"
                                >
                                    View All
                                </button>
                                <button
                                    onClick={() => exportTopList('wishlisted')}
                                    className="text-sm font-semibold text-green-700 hover:underline"
                                >
                                    Download Excel
                                </button>
                            </div>
                        )}
                        {topProducts.topWishlisted.length === 0 ? (
                            <p className="text-text-secondary text-sm">No wishlist data yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {topProducts.topWishlisted.map((item, idx) => (
                                    <li key={`${item.productId}-${idx}`} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 border">N/A</div>
                                            )}
                                            <span className="font-semibold text-text-primary">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-pink-600">{item.count}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-card p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold mb-4 text-text-primary">Top Carted Products</h3>
                        {topProducts.topCarted.length > 0 && (
                            <div className="flex justify-between items-center mb-3">
                                <button
                                    onClick={() => openModal('carted')}
                                    className="text-sm font-semibold text-primary hover:underline"
                                >
                                    View All
                                </button>
                                <button
                                    onClick={() => exportTopList('carted')}
                                    className="text-sm font-semibold text-green-700 hover:underline"
                                >
                                    Download Excel
                                </button>
                            </div>
                        )}
                        {topProducts.topCarted.length === 0 ? (
                            <p className="text-text-secondary text-sm">No cart data yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {topProducts.topCarted.map((item, idx) => (
                                    <li key={`${item.productId}-${idx}`} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 border">N/A</div>
                                            )}
                                            <span className="font-semibold text-text-primary">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-cyan-600">{item.count}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {modalState && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <p className="text-sm text-text-secondary uppercase tracking-wide">
                                    {modalState.type === 'wishlisted' ? 'Top Wishlisted Products' : 'Top Carted Products'}
                                </p>
                                <h4 className="text-xl font-bold text-text-primary">
                                    {modalState.type === 'wishlisted' ? 'All Wishlisted Leaders' : 'All Cart Leaders'}
                                </h4>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 rounded-full hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[65vh]">
                            {modalState.items.length === 0 ? (
                                <p className="text-text-secondary text-sm">No data available.</p>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {modalState.items.map((item, idx) => (
                                        <li key={`${item.productId}-${idx}`} className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-500 w-6 text-right">{idx + 1}.</span>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-md bg-gray-100 flex itemscenter justify-center text-xs text-gray-500 border">N/A</div>
                                                )}
                                                <span className="font-semibold text-text-primary">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-bold text-primary">{item.count}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AnalyticsPage;
