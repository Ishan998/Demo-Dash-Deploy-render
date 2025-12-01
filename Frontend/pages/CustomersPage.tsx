

import React, { useState, useMemo, useEffect } from 'react';
import { Customer, CustomerStatus, Log } from '../types';
import CustomersTable from '../components/CustomersTable';
import ConfirmationModal from '../components/ConfirmationModal';
import { sendAccountBlockedEmail, sendAccountRemovedEmail } from '../services/notificationService';
import Toast from '../components/Toast';
import * as api from '../services/apiService';
import { InitialPageProps } from '../App';

interface CustomersPageProps {
    customers: Customer[];
    setCustomers: (customers: Customer[]) => void;
    addLog: (message: string, type?: Log['type']) => void;
    initialProps: InitialPageProps & { onApplied: () => void; } | null;
}

type SortableKey = 'name' | 'registrationDate';

const CustomersPage: React.FC<CustomersPageProps> = ({ customers, setCustomers, addLog, initialProps }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'All'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' }>({ key: 'registrationDate', direction: 'desc' });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        customer: Customer | null;
        action: 'remove' | null;
    }>({ isOpen: false, customer: null, action: null });
    
    useEffect(() => {
        if (initialProps) {
            if(initialProps.searchTerm) setSearchTerm(initialProps.searchTerm);
            if(initialProps.statusFilter) setStatusFilter(initialProps.statusFilter as any);
            if(initialProps.sortConfig) setSortConfig(initialProps.sortConfig as any);
            initialProps.onApplied();
        }
    }, [initialProps]);

    const filteredCustomers = useMemo(() => {
        const filtered = customers.filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  customer.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        filtered.sort((a, b) => {
            const key = sortConfig.key;
            let comparison = 0;
            
            const valA = a[key];
            const valB = b[key];
            
            if (key === 'registrationDate') {
                comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                comparison = valA.localeCompare(valB);
            }
    
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [customers, searchTerm, statusFilter, sortConfig]);

    const handleSort = (key: SortableKey) => {
        setSortConfig(prevConfig => {
            if (prevConfig.key === key) {
                return { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: key === 'name' ? 'asc' : 'desc' };
        });
    };

    const openModal = (customer: Customer, action: 'remove') => {
        setModalState({ isOpen: true, customer, action });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, customer: null, action: null });
    };

    const handleConfirmAction = async () => {
        if (!modalState.customer || !modalState.action) return;
        
        const { customer, action } = modalState;

        try {
            if (action === 'remove') {
                await api.deleteCustomer(customer.id);
                await sendAccountRemovedEmail(customer);
                setCustomers(customers.filter(c => c.id !== customer.id));

                addLog(`Customer ${customer.name} has been removed.`, 'error');
                setToast({
                    message: `${customer.name} has been removed.`,
                    type: 'success',
                });
            }
        } catch (error) {
            console.error("Failed to process customer action:", error);
            setToast({
                message: `Failed to update ${customer.name}. Please try again.`,
                type: 'error',
            });
        } finally {
            closeModal();
        }
    };
    
    const getModalDetails = () => {
        if (!modalState.isOpen || !modalState.customer) return null;

        if (modalState.action === 'remove') {
            return {
                title: 'Remove Customer?',
                message: `Are you sure you want to permanently remove ${modalState.customer.name}? This action cannot be undone.`,
                confirmButtonText: 'Remove',
                confirmButtonVariant: 'danger' as 'danger' | 'primary',
            };
        }
        return null;
    };
    
    const modalDetails = getModalDetails();

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Customer Management</h1>
                <p className="text-sm text-text-secondary mt-1">
                    Showing {filteredCustomers.length} of {customers.length} total customers.
                </p>
            </div>
            
            <div className="bg-card p-4 rounded-xl shadow-md mb-6 flex items-center justify-between">
                <div className="relative w-1/3">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | 'All')}
                        className="px-4 py-2 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="All">All Statuses</option>
                        <option value={CustomerStatus.Active}>Active</option>
                        <option value={CustomerStatus.Blocked}>Blocked</option>
                    </select>
                </div>
            </div>

            <CustomersTable
                customers={filteredCustomers}
                onRemove={(customer) => openModal(customer, 'remove')}
                onSort={handleSort}
                sortConfig={sortConfig}
            />

            {modalDetails && (
                <ConfirmationModal
                    isOpen={modalState.isOpen}
                    onClose={closeModal}
                    onConfirm={handleConfirmAction}
                    title={modalDetails.title}
                    message={modalDetails.message}
                    confirmButtonText={modalDetails.confirmButtonText}
                    confirmButtonVariant={modalDetails.confirmButtonVariant}
                />
            )}
        </div>
    );
};

export default CustomersPage;
