

    import React, { useState, useMemo } from 'react';
    import { Banner, BannerStatus, Log } from '../types';
    import BannersTable from '../components/BannersTable';
    import BannerFormModal from '../components/BannerFormModal';
    import * as api from '../services/apiService';
    import Toast from '../components/Toast';

    interface BannersPageProps {
        banners: Banner[];
        setBanners: (banners: Banner[]) => void;
        addLog: (message: string, type?: Log['type']) => void;
    }

    const BannersPage: React.FC<BannersPageProps> = ({ banners, setBanners, addLog }) => {
        const [searchTerm, setSearchTerm] = useState('');
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
        const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

        const filteredBanners = useMemo(() => {
            return banners.filter(banner =>
                banner.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }, [banners, searchTerm]);
        
        const handleAddBanner = () => {
            setEditingBanner(null);
            setIsModalOpen(true);
        };

        const handleEditBanner = (banner: Banner) => {
            setEditingBanner(banner);
            setIsModalOpen(true);
        };

        const handleSaveBanner = async (bannerData: Omit<Banner, 'id'> | Banner) => {
            try {
                if ('id' in bannerData && bannerData.id) {
                    const updatedBanner = await api.updateBanner(bannerData as Banner);
                    setBanners(banners.map(b => b.id === updatedBanner.id ? updatedBanner : b));
                    addLog(`Banner "${updatedBanner.title}" updated.`, 'success');
                    setToast({ message: 'Banner updated!', type: 'success' });
                } else {
                    const newBanner = await api.createBanner(bannerData);
                    setBanners([newBanner, ...banners]);
                    addLog(`Banner "${newBanner.title}" created.`, 'success');
                    setToast({ message: 'Banner created!', type: 'success' });
                }
                setIsModalOpen(false);
            } catch (error) {
                setToast({ message: 'Failed to save banner.', type: 'error' });
            }
        };
        
        const handleDeleteBanner = async (bannerId: number) => {
            try {
                const bannerToDelete = banners.find(b => b.id === bannerId);
                await api.deleteBanner(bannerId);
                setBanners(banners.filter(b => b.id !== bannerId));
                if (bannerToDelete) {
                    addLog(`Banner "${bannerToDelete.title}" deleted.`, 'warning');
                }
                setToast({ message: 'Banner deleted.', type: 'success' });
            } catch (error) {
                setToast({ message: 'Failed to delete banner.', type: 'error' });
            }
        };

        const handleToggleStatus = async (banner: Banner) => {
            const newStatus = banner.status === BannerStatus.Active ? BannerStatus.Inactive : BannerStatus.Active;
            try {
                const updatedBanner = await api.updateBanner({ ...banner, status: newStatus });
                setBanners(banners.map(b => b.id === updatedBanner.id ? updatedBanner : b));
                addLog(`Banner "${banner.title}" status set to ${newStatus}.`);
                setToast({ message: `Banner status set to ${newStatus}.`, type: 'success' });
            } catch (error) {
                setToast({ message: 'Failed to update status.', type: 'error' });
            }
        };

        return (
            <div className="container mx-auto">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <h1 className="text-3xl font-bold text-text-primary mb-6">Banner Management</h1>
                
                <div className="bg-card p-4 rounded-xl shadow-md mb-6 flex items-center justify-between">
                    <div className="relative w-1/3">
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>

                    <button onClick={handleAddBanner} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition">
                        + Add Banner
                    </button>
                </div>

                <BannersTable 
                    banners={filteredBanners} 
                    onEdit={handleEditBanner}
                    onDelete={handleDeleteBanner}
                    onToggleStatus={handleToggleStatus}
                />

                {isModalOpen && (
                    <BannerFormModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveBanner}
                        bannerToEdit={editingBanner}
                    />
                )}
            </div>
        );
    };

    export default BannersPage;
