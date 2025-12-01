
import React, { useState, useCallback, useMemo } from 'react';
import { getSalesSummary } from '../services/geminiService';
import { ICONS } from '../constants';
import { Order, OrderStatus, SalesDataPoint } from '../types';

const generateWeeklySalesData = (orders: Order[]): SalesDataPoint[] => {
    const salesByDay: { [key: string]: number } = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const relevantOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate > sevenDaysAgo && (order.status === OrderStatus.Completed || order.status === OrderStatus.Dispatched);
    });

    relevantOrders.forEach(order => {
        const dayOfWeek = weekdays[new Date(order.date).getDay()];
        salesByDay[dayOfWeek] += order.amount;
    });

    const today = new Date().getDay();
    const orderedWeekdays = [];
    for (let i = 0; i < 7; i++) {
        const dayIndex = (today - 6 + i + 7) % 7;
        orderedWeekdays.push(weekdays[dayIndex]);
    }
    
    return orderedWeekdays.map(day => ({
        name: day,
        sales: salesByDay[day] || 0
    }));
};

const AiInsights: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const weeklySalesData = useMemo(() => generateWeeklySalesData(orders), [orders]);

  const handleGenerateInsights = useCallback(async () => {
    if(weeklySalesData.every(d => d.sales === 0)) {
        setInsights("No sales data from the last 7 days to analyze. Insights can be generated once there are recent sales.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getSalesSummary(weeklySalesData);
      setInsights(result);
    } catch (err) {
      setError('Failed to generate insights. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [weeklySalesData]);
  
  const formattedInsights = insights.split('\n').map((paragraph, index) => (
    <p key={index} className="mb-4">{paragraph}</p>
  ));

  return (
    <div className="bg-card p-6 rounded-xl shadow-md flex flex-col h-full">
      <div className="flex items-center mb-4">
        {ICONS.ai}
        <h2 className="text-xl font-bold ml-3 text-text-primary">AI Business Insights</h2>
      </div>
      
      <div className="flex-grow text-text-secondary text-sm leading-relaxed">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
             <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : insights ? (
          <div>{formattedInsights}</div>
        ) : (
          <p>Click the button below to generate a summary and actionable insights from your sales data of the last 7 days using Gemini AI.</p>
        )}
      </div>

      <button
        onClick={handleGenerateInsights}
        disabled={isLoading}
        className="mt-6 w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center
                   hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                   disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          'Generate Insights'
        )}
      </button>
    </div>
  );
};

export default AiInsights;
