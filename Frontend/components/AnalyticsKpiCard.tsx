import React from 'react';

interface AnalyticsKpiCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    isActive: boolean;
    onClick: () => void;
}

const AnalyticsKpiCard: React.FC<AnalyticsKpiCardProps> = ({ title, value, icon, color, isActive, onClick }) => {
    const activeClasses = isActive 
        ? 'ring-2 ring-offset-2'
        : 'hover:shadow-lg hover:-translate-y-1';

    return (
        <button 
            onClick={onClick}
            className={`bg-card p-6 rounded-xl shadow-md flex flex-col justify-between transition-all duration-300 cursor-pointer ${activeClasses}`}
            // Fix: 'ringColor' is not a valid style property. Use '--tw-ring-color' CSS variable to set Tailwind's ring color dynamically.
            style={{ '--tw-ring-color': color } as React.CSSProperties}
        >
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <p className="text-sm font-medium text-text-secondary">{title}</p>
                    <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
                </div>
                <div style={{ color: color }}>{icon}</div>
            </div>
        </button>
    );
};

export default AnalyticsKpiCard;
