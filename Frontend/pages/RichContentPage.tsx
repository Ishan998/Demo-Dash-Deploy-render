

import React, { useState } from 'react';
import { RPD, Product, RPDContentBlock, RPDImageTextBlock, RPDBannerBlock, Log } from '../types';
import RPDEditor from '../components/RPDEditor';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import * as api from '../services/apiService';
import { ICONS } from '../constants';
import RichContentInstructionsModal from '../components/RichContentInstructionsModal';

interface RichContentPageProps {
    rpds: RPD[];
    setRpds: (rpds: RPD[]) => void;
    allProducts: Product[];
    addLog: (message: string, type?: Log['type']) => void;
}

const RPDCard: React.FC<{
    rpd: RPD;
    allProducts: Product[];
    onEdit: () => void;
    onDelete: () => void;
}> = ({ rpd, allProducts, onEdit, onDelete }) => {
    const linkedProducts = (rpd.products || [])
  .map(id => allProducts.find(p => p.id === id)?.name)
  .filter(Boolean);

    // Fix: Use a type predicate to correctly narrow the block type before accessing `text` or `image` properties.
    const getPreviewContent = (content: RPDContentBlock[]) => {
        const firstTextBlock = content.find(
            (block): block is RPDImageTextBlock | RPDBannerBlock => 
                (block.layout === 'image-text' || block.layout === 'banner') && !!block.props.text
        );
        const firstText = firstTextBlock?.props.text;
        
        const firstImageBlock = content.find(
            (block): block is RPDImageTextBlock | RPDBannerBlock => 
                (block.layout === 'image-text' || block.layout === 'banner') && !!block.props.image
        );
        const firstImage = firstImageBlock?.props.image;
        
        return { firstText, firstImage };
    };

    const { firstText, firstImage } = getPreviewContent(rpd.content);
    
    return (
        <div className="bg-card rounded-xl shadow-md p-6 flex flex-col">
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-text-primary">{rpd.title}</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={onEdit} className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full transition" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>
            
            <div className="mt-4 flex-grow flex items-start space-x-4">
                {firstImage && <img src={firstImage} alt="Preview" className="w-24 h-24 object-cover rounded-md bg-gray-100 flex-shrink-0" />}
                <p className="text-sm text-text-secondary line-clamp-4">{firstText || "This RPD contains only images."}</p>
            </div>
            
            <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-600">Linked Products ({linkedProducts.length})</h4>
                {linkedProducts.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {linkedProducts.slice(0, 3).map(name => <span key={name} className="bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">{name}</span>)}
                        {linkedProducts.length > 3 && <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">+{linkedProducts.length - 3} more</span>}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 mt-2">Not linked to any products.</p>
                )}
            </div>
        </div>
    );
};


const RichContentPage: React.FC<RichContentPageProps> = ({ rpds, setRpds, allProducts, addLog }) => {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingRpd, setEditingRpd] = useState<RPD | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [rpdToDelete, setRpdToDelete] = useState<RPD | null>(null);
    const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);

    const handleCreateNew = () => {
        setEditingRpd(null);
        setView('editor');
    };
    
    const handleEdit = (rpd: RPD) => {
        setEditingRpd(rpd);
        setView('editor');
    };
    
    const handleSave = async (rpdData: Omit<RPD, 'id'> | RPD) => {
        try {
            if ('id' in rpdData && rpdData.id) {
                const updated = await api.updateRPD(rpdData);
                setRpds(rpds.map(r => r.id === updated.id ? updated : r));
                addLog(`Rich Content "${updated.title}" updated.`, 'success');
                setToast({ message: 'RPD updated successfully!', type: 'success' });
            } else {
                const created = await api.createRPD(rpdData);
                setRpds([created, ...rpds]);
                addLog(`Rich Content "${created.title}" created.`, 'success');
                setToast({ message: 'RPD created successfully!', type: 'success' });
            }
            setView('list');
        } catch (error) {
            setToast({ message: 'Failed to save RPD.', type: 'error' });
        }
    };
    
    const handleDelete = async () => {
        if (!rpdToDelete) return;
        try {
            await api.deleteRPD(rpdToDelete.id);
            setRpds(rpds.filter(r => r.id !== rpdToDelete.id));
            addLog(`Rich Content "${rpdToDelete.title}" deleted.`, 'warning');
            setToast({ message: 'RPD deleted.', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to delete RPD.', type: 'error' });
        } finally {
            setRpdToDelete(null);
        }
    };
    
    if (view === 'editor') {
        return <RPDEditor rpdToEdit={editingRpd} onSave={handleSave} onClose={() => setView('list')} allProducts={allProducts} />;
    }

    return (
        <div className="container mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold text-text-primary">Rich Content Manager</h1>
                    <button onClick={() => setIsInstructionsModalOpen(true)} className="text-gray-400 hover:text-primary transition" title="Learn more about Rich Content">
                        {ICONS.info}
                    </button>
                </div>
                <button onClick={handleCreateNew} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition">
                    + Create New
                </button>
            </div>
            
            {rpds.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {rpds.map(rpd => (
                        <RPDCard
                            key={rpd.id}
                            rpd={rpd}
                            allProducts={allProducts}
                            onEdit={() => handleEdit(rpd)}
                            onDelete={() => setRpdToDelete(rpd)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-card rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-text-primary">No Rich Content Yet</h2>
                    <p className="text-text-secondary mt-2">Click "Create New" to build your first Rich Product Description.</p>
                </div>
            )}
            
             {rpdToDelete && (
                <ConfirmationModal
                    isOpen={!!rpdToDelete}
                    onClose={() => setRpdToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete RPD?"
                    message={`Are you sure you want to permanently delete "${rpdToDelete.title}"? This action cannot be undone.`}
                    confirmButtonText="Delete"
                    confirmButtonVariant="danger"
                />
            )}

            {isInstructionsModalOpen && (
                <RichContentInstructionsModal onClose={() => setIsInstructionsModalOpen(false)} />
            )}
        </div>
    );
};

export default RichContentPage;
