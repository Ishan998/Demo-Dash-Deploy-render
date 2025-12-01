import React, { useState } from 'react';
import { Customer, CustomerStatus } from '../types';
import Pagination from './Pagination';

const getStatusBadgeClass = (status: CustomerStatus): string => {
  switch (status) {
    case CustomerStatus.Active:
      return 'bg-green-100 text-green-800';
    case CustomerStatus.Blocked:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

type SortableKey = 'name' | 'registrationDate';

interface CustomersTableProps {
    customers: Customer[];
    onRemove: (customer: Customer) => void;
    sortConfig: { key: SortableKey; direction: 'asc' | 'desc' };
    onSort: (key: SortableKey) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ customers, onRemove, onSort, sortConfig }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = customers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(customers.length / itemsPerPage);

    const SortIcon: React.FC<{ direction: 'asc' | 'desc' }> = ({ direction }) => {
        const iconClass = "h-4 w-4";
        if (direction === 'asc') {
            return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
        }
        return <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
    };

    return (
        <div className="bg-card rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-center">S.No.</th>
                            <th className="py-3 px-6 text-left">
                                <button onClick={() => onSort('name')} className="flex items-center w-full group">
                                    <span className="group-hover:text-primary">Customer</span>
                                    <span className="ml-2 text-gray-400 group-hover:text-primary">
                                        {sortConfig.key === 'name' && <SortIcon direction={sortConfig.direction} />}
                                    </span>
                                </button>
                            </th>
                            <th className="py-3 px-6 text-left">
                                <button onClick={() => onSort('registrationDate')} className="flex items-center w-full group">
                                    <span className="group-hover:text-primary">Registration Date</span>
                                    <span className="ml-2 text-gray-400 group-hover:text-primary">
                                        {sortConfig.key === 'registrationDate' && <SortIcon direction={sortConfig.direction} />}
                                    </span>
                                </button>
                            </th>
                            <th className="py-3 px-6 text-center">Status</th>
                            <th className="py-3 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {currentItems.map((customer, index) => (
                           <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6 text-center font-semibold text-text-secondary">{indexOfFirstItem + index + 1}</td>
                                <td className="py-3 px-6 text-left">
                                    <div className="flex items-center">
                                        <img src={customer.avatarUrl} alt={customer.name} className="w-10 h-10 rounded-full mr-4" />
                                        <div>
                                            <div className="font-medium text-text-primary">{customer.name}</div>
                                            <div className="text-xs text-text-secondary">{customer.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-6 text-left">{customer.registrationDate}</td>
                                <td className="py-3 px-6 text-center">
                                    <span className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(customer.status)}`}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center">
                                     <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => onRemove(customer)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition" title="Remove">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
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

export default CustomersTable;
