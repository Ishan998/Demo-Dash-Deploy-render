
import React, { useState, useMemo } from 'react';
import { Log } from '../types';
import Pagination from '../components/Pagination';
import ConfirmationModal from '../components/ConfirmationModal';

const LogTypeIndicator: React.FC<{ type: Log['type'] }> = ({ type }) => {
    const typeClasses = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    };
    return <span className={`w-3 h-3 rounded-full ${typeClasses[type]}`} title={type.charAt(0).toUpperCase() + type.slice(1)}></span>;
};

const LogRow: React.FC<{ log: Log }> = ({ log }) => (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="py-3 px-6 text-left flex items-center space-x-3">
            <LogTypeIndicator type={log.type} />
            <span>{log.message}</span>
        </td>
        <td className="py-3 px-6 text-right text-sm text-gray-500 whitespace-nowrap">
            {new Date(log.timestamp).toLocaleString()}
        </td>
    </tr>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string; }> = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-14 h-8 rounded-full transition ${checked ? 'bg-primary' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-gray-700 font-medium">{label}</div>
    </label>
);

interface LogsPageProps {
  logs: Log[];
  setLogs: (logs: Log[]) => void;
  isLoggingEnabled: boolean;
  setIsLoggingEnabled: (enabled: boolean) => void;
}

const LogsPage: React.FC<LogsPageProps> = ({ logs, setLogs, isLoggingEnabled, setIsLoggingEnabled }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const itemsPerPage = 15;

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return logs.filter(log => log.message.toLowerCase().includes(lowerCaseSearch));
    }, [logs, searchTerm]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const handleClearLogs = () => {
        setLogs([]);
        setIsClearModalOpen(false);
    };

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Activity Logs</h1>
            
            <div className="bg-card p-4 rounded-xl shadow-md mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-6">
                    <ToggleSwitch
                        checked={isLoggingEnabled}
                        onChange={setIsLoggingEnabled}
                        label="Enable Logging"
                    />
                    <button
                        onClick={() => setIsClearModalOpen(true)}
                        className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:bg-gray-400"
                        disabled={logs.length === 0}
                    >
                        Clear All Logs
                    </button>
                </div>

                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Action</th>
                                <th className="py-3 px-6 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 text-sm">
                            {currentItems.map(log => <LogRow key={log.id} log={log} />)}
                        </tbody>
                    </table>
                </div>
                 {currentItems.length === 0 && (
                    <p className="text-center text-gray-500 py-12">
                        {searchTerm ? 'No logs match your search.' : 'No activity has been logged yet.'}
                    </p>
                )}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={handleClearLogs}
                title="Clear All Logs?"
                message="Are you sure you want to permanently delete all activity logs? This action cannot be undone."
                confirmButtonText="Clear Logs"
                confirmButtonVariant="danger"
            />
        </div>
    );
};

export default LogsPage;
