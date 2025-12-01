import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RATING_COLORS = ['#22c55e', '#84cc16', '#facc15', '#f97316', '#dc2626'];

export type RatingAnalysisData = {
    summary?: { average_rating: number | null; total_reviews: number };
    products?: { product_id: number; name?: string; average_rating: number | null; review_count: number; last_reviewed_at?: string | null }[];
    recent_reviews?: { id: number; product_id: number; product_name?: string; customer_name?: string; rating: number; title?: string; comment?: string; created_at?: string }[];
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => (
                <svg
                    key={index}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${index < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

const RatingAnalysis: React.FC<{
    data?: RatingAnalysisData | null;
    isLoading?: boolean;
    onDownloadExcel?: () => void;
}> = ({ data, isLoading = false, onDownloadExcel }) => {
    const summary = data?.summary || { average_rating: null, total_reviews: 0 };
    const products = data?.products || [];
    const recentReviews = data?.recent_reviews || [];
    const numericAverage =
        typeof summary.average_rating === 'number'
            ? summary.average_rating
            : Number(summary.average_rating || 0) || 0;

    const topProducts = useMemo(() => {
        const sorted = [...products].sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        return sorted.slice(0, 5);
    }, [products]);

    return (
        <div className="bg-card rounded-xl shadow-md p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-xl font-bold text-text-primary">Customer Rating Analysis</h3>
                {onDownloadExcel && (
                    <button
                        onClick={onDownloadExcel}
                        className="text-sm font-semibold text-primary hover:underline"
                        disabled={isLoading}
                    >
                        Download Excel
                    </button>
                )}
            </div>
            {isLoading ? (
                <p className="text-text-secondary text-sm">Loading ratings...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                    {/* Left side: Stats and Reviews */}
                    <div className="flex flex-col space-y-6">
                        <div>
                            <p className="text-sm text-text-secondary">Average Rating</p>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-4xl font-bold text-text-primary">
                                    {Number.isFinite(numericAverage) ? numericAverage.toFixed(1) : '—'}
                                </span>
                                <StarRating rating={Number.isFinite(numericAverage) ? numericAverage : 0} />
                            </div>
                            <p className="text-xs text-text-secondary mt-1">
                                Based on {summary.total_reviews || 0} reviews
                            </p>
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-text-primary mb-2">Recent Reviews</h4>
                            {recentReviews.length > 0 ? (
                                <ul className="space-y-3">
                                    {recentReviews.map((r) => (
                                        <li key={r.id} className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={r.rating || 0} />
                                                <span className="text-text-primary font-semibold">{r.customer_name || 'Customer'}</span>
                                                {r.created_at && (
                                                    <span className="ml-auto text-xs text-gray-400">
                                                        {new Date(r.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            {r.product_name && (
                                                <p className="text-xs text-text-secondary mt-0.5">Product: {r.product_name}</p>
                                            )}
                                            {r.title && <p className="font-semibold text-text-primary mt-1">{r.title}</p>}
                                            {r.comment && <p className="text-text-secondary mt-1 italic">"{r.comment}"</p>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-text-secondary italic">No recent reviews yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Right side: Bar Chart of review counts by product */}
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '0.5rem',
                                    }}
                                    formatter={(value: number, _name, payload: any) => [
                                        `${value} reviews (avg ${payload?.payload?.average_rating?.toFixed?.(1) ?? '—'})`,
                                        'Review Count',
                                    ]}
                                />
                                <Bar dataKey="review_count" radius={[0, 4, 4, 0]}>
                                    {topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RATING_COLORS[index % RATING_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatingAnalysis;
