
import React, { useState } from 'react';
import { Banner, BannerStatus } from '../types';
import Pagination from './Pagination';

const getStatusBadgeClass = (status: BannerStatus): string => {
  switch (status) {
    case BannerStatus.Active:
      return 'bg-green-100 text-green-800';
    case BannerStatus.Inactive:
      return 'bg-gray-100 text-gray-800';
    case BannerStatus.Scheduled:
        return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

const BannersTable: React.FC<{ 
    banners: Banner[],
    onEdit: (banner: Banner) => void,
    onDelete: (bannerId: number) => void,
    onToggleStatus: (banner: Banner) => void
}> = ({ banners, onEdit, onDelete, onToggleStatus }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = banners.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(banners.length / itemsPerPage);

    return (
        <div className="bg-card rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Image</th>
                            <th className="py-3 px-6 text-left">Title</th>
                            <th className="py-3 px-6 text-center">Active Dates</th>
                            <th className="py-3 px-6 text-center">Status</th>
                            <th className="py-3 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {currentItems.map((banner) => (
                           <tr key={banner.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-6 text-left">
                                    <img src={banner.image} alt={banner.title} className="w-48 h-16 object-cover rounded-md bg-gray-100" />
                                </td>
                                <td className="py-3 px-6 text-left font-semibold text-text-primary">{banner.title}</td>
                                <td className="py-3 px-6 text-center">
                                    {banner.startDate || 'N/A'} - {banner.endDate || 'N/A'}
                                </td>
                                <td className="py-3 px-6 text-center">
                                    <span className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(banner.status)}`}>
                                        {banner.status}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-center">
                                     <div className="flex items-center justify-center space-x-2">
                                        <button onClick={() => onEdit(banner)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => onToggleStatus(banner)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition" title={banner.status === 'Active' ? 'Deactivate' : 'Activate'}>
                                            {banner.status === 'Active' ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        </button>
                                        <button onClick={() => onDelete(banner.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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

export default BannersTable;
