

import React, { useState } from 'react';
import { MainCategory, Material, SubCategory, Color, Occasion, Log } from '../types';
import * as api from '../services/apiService';
import ConfirmationModal from './ConfirmationModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
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
  addLog: (message: string, type?: Log['type']) => void;
}

type Item = MainCategory | Material | SubCategory | Color | Occasion;
type ItemType = 'mainCategory' | 'material' | 'subCategory' | 'color' | 'occasion';

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose, setToast, addLog, ...props }) => {
    const [newItem, setNewItem] = useState({ mainCategory: '', material: '', subCategory: '', color: '', occasion: '' });
    // Dedicated state for subcategory creation under a main category
    const [newSubName, setNewSubName] = useState('');
    const [selectedMainForSub, setSelectedMainForSub] = useState<number | ''>('');
    const [modalState, setModalState] = useState<{ isOpen: boolean; item: Item | null; itemType: ItemType | null }>({ isOpen: false, item: null, itemType: null });
    
    if (!isOpen) return null;

    const handleInputChange = (type: ItemType, value: string) => {
        setNewItem(prev => ({ ...prev, [type]: value }));
    };

    const handleAddItem = async (type: ItemType) => {
        const name = newItem[type].trim();
        if (!name) return;

        try {
            if (type === 'mainCategory') {
                const created = await api.createMainCategory(name);
                props.setMainCategories([...props.mainCategories, created]);
            } else if (type === 'material') {
                const created = await api.createMaterial(name);
                props.setMaterials([...props.materials, created]);
            } else if (type === 'subCategory') {
                // Creation of Sub-Category is only allowed under a selected Main Category via the dedicated section below.
                setToast({ message: 'Select a Main Category below and add a Sub-Category there.', type: 'error' });
                return;
            } else if (type === 'color') {
                const created = await api.createColor(name);
                props.setColors([...props.colors, created]);
            } else if (type === 'occasion') {
                const created = await api.createOccasion(name);
                props.setOccasions([...props.occasions, created]);
            }
            setNewItem(prev => ({ ...prev, [type]: '' }));
            addLog(`New ${type} "${name}" added.`, 'success');
            setToast({ message: `${name} added successfully.`, type: 'success' });
        } catch (error) {
            setToast({ message: `Failed to add ${name}.`, type: 'error' });
        }
    };

    const openDeleteModal = (item: Item, itemType: ItemType) => {
        setModalState({ isOpen: true, item, itemType });
    };

    const closeDeleteModal = () => {
        setModalState({ isOpen: false, item: null, itemType: null });
    };

    const handleConfirmDelete = async () => {
        if (!modalState.item || !modalState.itemType) return;
        const { item, itemType } = modalState;

        try {
            if (itemType === 'mainCategory') {
                await api.deleteMainCategory(item.id);
                props.setMainCategories(props.mainCategories.filter(c => c.id !== item.id));
            } else if (itemType === 'material') {
                await api.deleteMaterial(item.id);
                props.setMaterials(props.materials.filter(m => m.id !== item.id));
            } else if (itemType === 'subCategory') {
                await api.deleteSubCategory(item.id);
                props.setSubCategories(props.subCategories.filter(s => s.id !== item.id));
            } else if (itemType === 'color') {
                await api.deleteColor(item.id);
                props.setColors(props.colors.filter(c => c.id !== item.id));
            } else if (itemType === 'occasion') {
                await api.deleteOccasion(item.id);
                props.setOccasions(props.occasions.filter(o => o.id !== item.id));
            }
            addLog(`${itemType} "${item.name}" removed.`, 'warning');
            setToast({ message: `${item.name} removed successfully.`, type: 'success' });
        } catch (error) {
            setToast({ message: `Failed to remove ${item.name}.`, type: 'error' });
        } finally {
            closeDeleteModal();
        }
    };

    const renderList = (title: string, items: Item[], type: ItemType) => (
        <div className="bg-gray-50 p-4 rounded-lg flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-text-primary">{title}</h3>
            <div className="flex items-center mb-4">
                <input
                    type="text"
                    placeholder={`Add new ${title.slice(0, -1).toLowerCase()}...`}
                    value={newItem[type]}
                    onChange={(e) => handleInputChange(type, e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem(type)}
                    className="flex-grow border-gray-300 rounded-md shadow-sm text-sm"
                />
                <button onClick={() => handleAddItem(type)} className="ml-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-opacity-90">Add</button>
            </div>
            <ul className="space-y-2 flex-grow overflow-y-auto pr-2">
                {items.map(item => (
                    <li key={item.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                        <span className="text-sm">{item.name}</span>
                        <button onClick={() => openDeleteModal(item, type)} className="text-red-500 hover:text-red-700 text-lg">&times;</button>
                    </li>
                ))}
                 {items.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No items yet.</p>}
            </ul>
        </div>
    );
    
    return (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-card w-full max-w-screen-2xl h-[90vh] rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-text-primary">Manage Product Attributes</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {renderList('Main Categories', props.mainCategories, 'mainCategory')}

                    {/* Sub-Categories configured under Main Categories */}
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col overflow-hidden">
                        <h3 className="font-bold text-lg mb-4 text-text-primary">Sub-Categories</h3>

                        {/* Add subcategory under a selected main category */}
                        <div className="mb-4 space-y-2">
                            <div>
                                <select
                                    className="border-gray-300 rounded-md shadow-sm text-sm w-full"
                                    value={selectedMainForSub}
                                    onChange={(e) => setSelectedMainForSub(e.target.value ? Number(e.target.value) : '')}
                                >
                                    <option value="">Select Main Category</option>
                                    {props.mainCategories.map(mc => (
                                        <option key={mc.id} value={mc.id}>{mc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Add new sub-category..."
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    onKeyPress={async (e) => {
                                    if (e.key === 'Enter' && newSubName.trim()) {
                                        if (!selectedMainForSub) {
                                            setToast({ message: 'Please select a Main Category first', type: 'error' });
                                            return;
                                        }
                                        try {
                                            await api.createSubCategory(newSubName.trim(), Number(selectedMainForSub));
                                            // Re-fetch to ensure consistent shape from backend
                                            try {
                                                const fresh = await api.getSubCategories();
                                                props.setSubCategories(fresh as any);
                                                setToast({ message: 'Sub-category added successfully.', type: 'success' });
                                            } catch {}
                                            setNewSubName('');
                                        } catch (err) {
                                            setToast({ message: 'Failed to add sub-category', type: 'error' });
                                        }
                                    }
                                }}
                                    disabled={!selectedMainForSub}
                                    className={`flex-1 min-w-0 border-gray-300 rounded-md shadow-sm text-sm ${!selectedMainForSub ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                <button
                                    onClick={async () => {
                                        if (!newSubName.trim()) return;
                                        if (!selectedMainForSub) {
                                            setToast({ message: 'Please select a Main Category first', type: 'error' });
                                            return;
                                        }
                                        try {
                                            await api.createSubCategory(newSubName.trim(), Number(selectedMainForSub));
                                            // Re-fetch to ensure consistent shape from backend
                                        try {
                                            const fresh = await api.getSubCategories();
                                            props.setSubCategories(fresh as any);
                                            setToast({ message: 'Sub-category added successfully.', type: 'success' });
                                        } catch {}
                                            setNewSubName('');
                                        } catch (err) {
                                            setToast({ message: 'Failed to add sub-category', type: 'error' });
                                        }
                                    }}
                                    disabled={!selectedMainForSub}
                                    className={`bg-primary text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-opacity-90 ${!selectedMainForSub ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Grouped view by main category */}
                        <div className="space-y-4 overflow-y-auto overflow-x-hidden pr-2">
                            {props.mainCategories.map(mc => {
                                const subs = props.subCategories.filter(sc => {
                                    const val: any = (sc as any).main_category;
                                    const id = val && typeof val === 'object' ? Number(val.id) : Number(val);
                                    return id === Number(mc.id);
                                });
                                return (
                                    <div key={mc.id} className="bg-white p-3 rounded-md shadow-sm">
                                        <div className="font-medium text-sm mb-2">{mc.name}</div>
                                        {subs.length > 0 ? (
                                            <ul className="space-y-2">
                                                {subs.map(item => (
                                                    <li key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                                        <span className="text-sm">{item.name}</span>
                                                        <button onClick={() => openDeleteModal(item as any, 'subCategory')} className="text-red-500 hover:text-red-700 text-lg">&times;</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-gray-500">No sub-categories.</p>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Unassigned sub-categories removed by requirement */}
                        </div>
                    </div>

                    {renderList('Materials', props.materials, 'material')}
                    {renderList('Colors', props.colors, 'color')}
                    {renderList('Occasions', props.occasions, 'occasion')}
                </main>
            </div>
        </div>
        {modalState.item && (
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title={`Delete "${modalState.item.name}"?`}
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmButtonText="Delete"
                confirmButtonVariant="danger"
            />
        )}
        </>
    );
};

export default CategoryManagerModal;
