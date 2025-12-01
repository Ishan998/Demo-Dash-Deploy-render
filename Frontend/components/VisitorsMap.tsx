import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as api from '../services/apiService';
import { VisitorRegionTimeseriesPoint } from '../types';

const COLORS = [
    '#4f46e5', '#22c55e', '#06b6d4', '#f59e0b', '#ec4899',
    '#a855f7', '#0ea5e9', '#f97316', '#10b981', '#ef4444',
];

type StackedDay = { date: string; dateLabel: string; [region: string]: string | number };

const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const VisitorsMap: React.FC = () => {
    const [rawData, setRawData] = useState<VisitorRegionTimeseriesPoint[]>([]);
    const [stackedData, setStackedData] = useState<StackedDay[]>([]);
    const [regions, setRegions] = useState<string[]>([]);
    const [period, setPeriod] = useState<"30d" | "7d" | "24h">("30d");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const visitorData = await api.getVisitorRegionTimeseries(period);
                setRawData(visitorData);
            } catch (err) {
                console.error("Failed to fetch visitor data:", err);
                setError('Could not load visitor data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [period]);

    useEffect(() => {
        if (!rawData.length) {
            setStackedData([]);
            setRegions([]);
            return;
        }

        const uniqueRegions = Array.from(new Set(rawData.map(r => r.region || 'Other')));
        const byDate = new Map<string, StackedDay>();

        rawData.forEach(({ date, timestamp, region, visitors, label }) => {
            const safeRegion = region || 'Other';
            const key = period === "24h"
                ? (timestamp ? timestamp.slice(0, 13) : date)
                : date.slice(0, 10);
            if (!byDate.has(key)) {
                const dLabel = period === "24h"
                    ? (label || new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
                    : (label || formatDateLabel(key));
                byDate.set(key, { date: key, dateLabel: dLabel });
            }
            const entry = byDate.get(key)!;
            entry[safeRegion] = (Number(entry[safeRegion] as number || 0) + visitors);
        });

        const stacked = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
        setStackedData(stacked);
        setRegions(uniqueRegions);
    }, [rawData, period]);

    const totalVisitors = useMemo(
        () => rawData.reduce((sum, row) => sum + (row.visitors || 0), 0),
        [rawData]
    );

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadError(null);
        try {
            const blob = await api.downloadVisitorRegionDataExcel();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.download = "visitor-regions.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download visitor region data:", err);
            setDownloadError("Download failed. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-full">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }

        if (error) {
            return <div className="flex justify-center items-center h-full text-red-500">{error}</div>;
        }

        if (!stackedData.length) {
            return <div className="flex justify-center items-center h-full text-text-secondary">No visitor data yet.</div>;
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={stackedData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280' }} fontSize={12} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} fontSize={12} />
                    <Tooltip
                        cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid #e0e0e0',
                            borderRadius: '0.5rem'
                        }}
                        formatter={(value: number, name) => [value.toLocaleString(), name]}
                        labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    {regions.map((region, idx) => (
                        <Bar
                            key={region}
                            dataKey={region}
                            stackId="visitors"
                            fill={COLORS[idx % COLORS.length]}
                            radius={idx === regions.length - 1 ? [4, 4, 0, 0] : 0}
                            maxBarSize={32}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-md h-96 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Visitor Regions</h2>
                    <div className="text-sm text-text-secondary">
                        {period === "24h" ? "Last 24 hours" : period === "7d" ? "Last 7 days" : "Last 30 days"}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm flex-wrap justify-end">
                    {(["24h", "7d", "30d"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 rounded-lg border transition ${
                                period === p
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white/60 text-text-secondary border-border hover:bg-white"
                            }`}
                        >
                            {p === "24h" ? "24h" : p === "7d" ? "7d" : "30d"}
                        </button>
                    ))}
                    <div className="ml-2 text-text-secondary">{totalVisitors.toLocaleString()} visitors</div>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="ml-2 px-3 py-1 rounded-lg border bg-white/60 text-text-secondary border-border hover:bg-white transition disabled:opacity-60"
                    >
                        {isDownloading ? "Preparing..." : "Download Excel"}
                    </button>
                    {downloadError && <span className="text-xs text-red-500">{downloadError}</span>}
                </div>
            </div>
            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
};

export default VisitorsMap;
