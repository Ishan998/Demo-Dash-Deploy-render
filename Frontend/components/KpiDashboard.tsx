import React, { useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ICONS, formatCurrency } from "../constants";
import { KpiData, Order, OrderStatus } from "../types";

type Period = "30d" | "7d" | "24h";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const ChangeIndicator: React.FC<{ value: number }> = ({ value }) => {
  const isPositive = value >= 0;
  return (
    <span
      className={`flex items-center text-sm font-medium ${
        isPositive ? "text-green-500" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 11l5-5m0 0l5 5m-5-5v12"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 13l-5 5m0 0l-5-5m5 5V6"
          />
        </svg>
      )}
      <span className="ml-1">{Math.abs(value)}% vs prev. period</span>
    </span>
  );
};

interface KpiDashboardProps {
  orders: Order[]; // fetched from your Django API
  visitorData?: number; // optional prop if you track visitors in Django analytics
}

const KpiDashboard: React.FC<KpiDashboardProps> = ({
  orders,
  visitorData = 0,
}) => {
  const safeOrders = useMemo(() => {
    if (Array.isArray(orders)) return orders;
    if (orders && Array.isArray((orders as any).results))
      return (orders as any).results;
    return [];
  }, [orders]);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("30d");

  const data: KpiData = useMemo(() => {
    const now = new Date();
    const periodInDays =
      selectedPeriod === "30d" ? 30 : selectedPeriod === "7d" ? 7 : 1;
    const periodInMillis = periodInDays * 24 * 60 * 60 * 1000;

    const getMetricsForPeriod = (startDate: Date, endDate: Date) => {
      const allPeriodOrders = safeOrders.filter((o) => {
        const orderDate = new Date(o.date);
        return orderDate >= startDate && orderDate < endDate;
      });

      const revenueOrders = allPeriodOrders.filter(
        (o) =>
          o.status === OrderStatus.Completed ||
          o.status === OrderStatus.Dispatched
      );
      const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.amount, 0);
      const nonCancelledOrders = allPeriodOrders.filter(
        (o) => o.status !== OrderStatus.Cancelled
      );
      const totalOrders = nonCancelledOrders.length;
      const averageOrderValue =
        revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

      return { totalRevenue, totalOrders, averageOrderValue };
    };

    // Current & previous period metrics
    const currentStartDate = new Date(now.getTime() - periodInMillis);
    const { totalRevenue, totalOrders, averageOrderValue } =
      getMetricsForPeriod(currentStartDate, now);

    const previousEndDate = currentStartDate;
    const previousStartDate = new Date(
      previousEndDate.getTime() - periodInMillis
    );
    const {
      totalRevenue: prevTotalRevenue,
      totalOrders: prevTotalOrders,
      averageOrderValue: prevAverageOrderValue,
    } = getMetricsForPeriod(previousStartDate, previousEndDate);

    // Conversion rate (if visitor analytics available)
    const totalVisitors = visitorData > 0 ? visitorData : totalOrders * 3; // fallback
    const conversionRate =
      totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;

    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - prev) / prev) * 100).toFixed(1));
    };

    const revenueChange = calcChange(totalRevenue, prevTotalRevenue);
    const ordersChange = calcChange(totalOrders, prevTotalOrders);
    const aovChange = calcChange(averageOrderValue, prevAverageOrderValue);

    // Trend generation
    const generateTrend = (key: "revenue" | "orders", days: number) => {
      const trendData: { name: string; value: number }[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(
          now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000
        );
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayOrders = safeOrders.filter((o) => {
          const orderDate = new Date(o.date);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });

        let value = 0;
        if (key === "revenue") {
          value = dayOrders
            .filter(
              (o) =>
                o.status === OrderStatus.Completed ||
                o.status === OrderStatus.Dispatched
            )
            .reduce((sum, o) => sum + o.amount, 0);
        } else {
          value = dayOrders.filter(
            (o) => o.status !== OrderStatus.Cancelled
          ).length;
        }
        trendData.push({ name: `Day ${i + 1}`, value });
      }
      return trendData;
    };

    const revenueTrend =
      selectedPeriod === "24h"
        ? generateTrend("revenue", 1)
        : generateTrend("revenue", periodInDays);
    const ordersTrend =
      selectedPeriod === "24h"
        ? generateTrend("orders", 1)
        : generateTrend("orders", periodInDays);

    return {
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      averageOrderValue,
      aovChange,
      conversionRate,
      conversionRateGoal: 3.0,
      revenueTrend,
      ordersTrend,
    };
  }, [safeOrders, selectedPeriod, visitorData]);

  const periodOptions: { key: Period; label: string }[] = [
    { key: "30d", label: "Last 30 days" },
    { key: "7d", label: "Last 7 days" },
    { key: "24h", label: "Last 24h" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          Key Performance Indicators
        </h2>
        <div className="flex items-center bg-gray-200 rounded-full p-1">
          {periodOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedPeriod(option.key)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                selectedPeriod === option.key
                  ? "bg-primary text-white shadow"
                  : "text-text-secondary hover:bg-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-card p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <p className="text-sm font-medium text-text-secondary">
              Total Revenue
            </p>
            <p className="text-3xl font-bold text-text-primary my-2">
              {formatCurrency(data.totalRevenue)}
            </p>
            <ChangeIndicator value={data.revenueChange} />
          </div>
          <div className="h-16 mt-4 -mx-6 -mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.revenueTrend}
                margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
              >
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-card p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <p className="text-sm font-medium text-text-secondary">
              Total Orders
            </p>
            <p className="text-3xl font-bold text-text-primary my-2">
              {formatNumber(data.totalOrders)}
            </p>
            <ChangeIndicator value={data.ordersChange} />
          </div>
          <div className="h-16 mt-4 -mx-6 -mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.ordersTrend}
                margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
              >
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-card p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <p className="text-sm font-medium text-text-secondary">
              Average Order Value
            </p>
            <p className="text-3xl font-bold text-text-primary my-2">
              {formatCurrency(data.averageOrderValue)}
            </p>
            <ChangeIndicator value={data.aovChange} />
          </div>
          <div className="mt-4 flex justify-end opacity-50">{ICONS.aov}</div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <p className="text-sm font-medium text-text-secondary">
              Conversion Rate
            </p>
            <p className="text-3xl font-bold text-text-primary my-2">
              {data.conversionRate.toFixed(2)}%
            </p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      (data.conversionRate / data.conversionRateGoal) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-right text-xs text-text-secondary mt-1">
                {data.conversionRate.toFixed(2)}% of {data.conversionRateGoal}%
                goal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiDashboard;
