
import React from 'react';
import { ICONS } from '../constants';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, changeType, icon }) => {
  const isIncrease = changeType === 'increase';
  const changeColor = isIncrease ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-card p-6 rounded-xl shadow-md flex items-center space-x-6 hover:shadow-lg transition-shadow duration-300">
      <div className="bg-gray-100 p-4 rounded-full">{icon}</div>
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <p className="text-3xl font-bold text-text-primary">{value}</p>
        <p className={`text-sm mt-1 ${changeColor} flex items-center`}>
          {isIncrease ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          )}
          {change} vs last month
        </p>
      </div>
    </div>
  );
};

const StatsCards: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
            title="Total Revenue"
            value="$45,231.89"
            change="+20.1%"
            changeType="increase"
            icon={ICONS.revenue}
        />
        <StatsCard 
            title="Total Orders"
            value="12,543"
            change="-2.3%"
            changeType="decrease"
            icon={ICONS.totalOrders}
        />
        <StatsCard 
            title="New Customers"
            value="892"
            change="+12.5%"
            changeType="increase"
            icon={ICONS.newCustomers}
        />
    </div>
);

export default StatsCards;
