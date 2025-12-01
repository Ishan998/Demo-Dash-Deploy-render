

import React, { useEffect, useState } from 'react';
import { MainCategory, Material, SubCategory, Color, Occasion, Log, HomeCollageItem } from '../types';
import CategoryManagerModal from '../components/CategoryManagerModal';
import HomeCollageManagerModal from '../components/HomeCollageManagerModal';
import Toast from '../components/Toast';
import { backupDatabase, listBackups, restoreDatabase, createNotification } from '../services/apiService';
import { NotificationType } from '../types';

interface SettingsPageProps {
    mainCategories: MainCategory[];
    setMainCategories: (categories: MainCategory[]) => void;
    materials: Material[];
    setMaterials: (materials: Material[]) => void;
    subCategories: SubCategory[];
    setSubCategories: (subCategories: SubCategory[]) => void;
    colors: Color[];
    setColors: (colors: Color[]) => void;
    occasions: Occasion[];
    setOccasions: (occasions: Occasion[]) => void;
    collageItems: HomeCollageItem[];
    setCollageItems: (items: HomeCollageItem[]) => void;
    addLog: (message: string, type?: Log['type']) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isCollageModalOpen, setIsCollageModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [backups, setBackups] = useState<Array<{ filename: string; url: string; size: number; modified: string }>>([]);
    const [selectedBackup, setSelectedBackup] = useState<string>('');
    const [loadingBackups, setLoadingBackups] = useState<boolean>(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoadingBackups(true);
                const items = await listBackups();
                setBackups(items);
                if (items.length && !selectedBackup) setSelectedBackup(items[0].filename);
            } catch (e) {
                // ignore
            } finally {
                setLoadingBackups(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <h1 className="text-3xl font-bold text-text-primary mb-6">Settings & Configurations</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-text-primary">Product Attributes</h2>
                    <p className="text-text-secondary mt-2 text-sm">
                        Manage main categories, sub-categories, materials, colors, and occasions for your products. This helps in organizing your store and improving product discoverability.
                    </p>
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="mt-4 bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition"
                    >
                        Manage Attributes
                    </button>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-text-primary">Homepage Collage</h2>
                    <p className="text-text-secondary mt-2 text-sm">
                        Configure the tiles for <strong>Shop by Occasion</strong> and <strong>Shop by Crystal</strong> collages shown on the storefront homepage. Add images and labels to drive customers into filtered product lists.
                    </p>
                    <button
                        onClick={() => setIsCollageModalOpen(true)}
                        className="mt-4 bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition"
                    >
                        Manage Collage Tiles
                    </button>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-text-primary">Database</h2>
                    <p className="text-text-secondary mt-2 text-sm">
                        Create a backup of your database. The backup file will be saved to the server and available to download.
                    </p>
                    <button
                        onClick={async () => {
                            try {
                                const res = await backupDatabase();
                                setToast({ message: 'Backup created successfully', type: 'success' });
                                // Update dropdown list after new backup
                                try { const items = await listBackups(); setBackups(items); if (!selectedBackup && items.length) setSelectedBackup(items[0].filename); } catch {}
                                // Create in-app notification and prepare dashboard toast
                                try { await createNotification({ title: 'Database Backup', message: `Backup created: ${res?.filename || ''}`, type: NotificationType.Info }); } catch {}
                                sessionStorage.setItem('pendingToast', JSON.stringify({ message: 'Backup created successfully', type: 'success' }));
                                sessionStorage.setItem('refreshNotifications', '1');
                                // Optional: open download URL
                                if (res?.backupUrl) { window.open(res.backupUrl, '_blank'); }
                                props.addLog?.('Database backup created', 'info');
                            } catch (e: any) {
                                const msg = e?.response?.data?.error || 'Failed to create backup';
                                setToast({ message: msg, type: 'error' });
                                try { await createNotification({ title: 'Database Backup Failed', message: msg, type: NotificationType.Info }); } catch {}
                                sessionStorage.setItem('pendingToast', JSON.stringify({ message: msg, type: 'error' }));
                                sessionStorage.setItem('refreshNotifications', '1');
                                props.addLog?.('Database backup failed', 'error');
                            }
                        }}
                        className="mt-4 bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition"
                    >
                        Backup Database
                    </button>
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-text-primary mb-2">Restore from Backup</h3>
                        {loadingBackups ? (
                            <p className="text-text-secondary text-sm">Loading backups…</p>
                        ) : backups.length === 0 ? (
                            <p className="text-text-secondary text-sm">No backups found.</p>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <select
                                    value={selectedBackup}
                                    onChange={(e) => setSelectedBackup(e.target.value)}
                                    className="w-full sm:flex-1 bg-background border border-border rounded-lg py-2 px-3 text-text-primary"
                                >
                                    {backups.map(b => {
                                        let label = b.filename;
                                        try { label = `${b.filename} (${new Date(b.modified).toLocaleString()})`; } catch {}
                                        return (
                                            <option key={b.filename} value={b.filename}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                <button
                                    onClick={async () => {
                                        if (!selectedBackup) return;
                                        try {
                                            await restoreDatabase(selectedBackup);
                                            setToast({ message: 'Database restored. Reloading…', type: 'success' });
                                            try { await createNotification({ title: 'Database Restore', message: `Restored from ${selectedBackup}`, type: NotificationType.Info }); } catch {}
                                            sessionStorage.setItem('pendingToast', JSON.stringify({ message: `Database restored from ${selectedBackup}`, type: 'success' }));
                                            sessionStorage.setItem('refreshNotifications', '1');
                                            props.addLog?.(`Database restored from ${selectedBackup}`, 'info');
                                            setTimeout(() => window.location.reload(), 1000);
                                        } catch (e: any) {
                                            const msg = e?.response?.data?.error || 'Failed to restore database';
                                            setToast({ message: msg, type: 'error' });
                                            try { await createNotification({ title: 'Database Restore Failed', message: msg, type: NotificationType.Info }); } catch {}
                                            sessionStorage.setItem('pendingToast', JSON.stringify({ message: msg, type: 'error' }));
                                            sessionStorage.setItem('refreshNotifications', '1');
                                            props.addLog?.('Database restore failed', 'error');
                                        }
                                    }}
                                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition w-full sm:w-auto"
                                >
                                    Restore
                                </button>
                                <a
                                    href={backups.find(b => b.filename === selectedBackup)?.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline text-sm text-center sm:text-left"
                                >
                                    Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isCategoryModalOpen && (
                <CategoryManagerModal
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    setToast={setToast}
                    {...props}
                />
            )}
            {isCollageModalOpen && (
                <HomeCollageManagerModal
                    isOpen={isCollageModalOpen}
                    onClose={() => setIsCollageModalOpen(false)}
                    setToast={setToast}
                    collageItems={props.collageItems}
                    setCollageItems={props.setCollageItems}
                    addLog={props.addLog}
                />
            )}
        </div>
    );
};

export default SettingsPage;
