


import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ICONS, LIMITED_DEAL_TAG } from '../constants';
import { Product, ProductStatus, MainCategory, Material, SubCategory, Color, Occasion, RPD, Log } from '../types';
import InventoryTable from '../components/InventoryTable';
import ProductFormPage from './ProductFormPage';
import Pagination from '../components/Pagination';
import { processFileUpload, downloadXlsxTemplate } from '../services/csvProcessor';
import Toast from '../components/Toast';
import UploadInstructionsModal from '../components/UploadInstructionsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ProductDisplayCard, { DisplayableProduct } from '../components/ProductDisplayCard';
import RPDViewerModal from '../components/RPDViewerModal';
import LimitedDealTimerModal from '../components/LimitedDealTimerModal';
import * as api from '../services/apiService';
import { InitialPageProps } from '../App';

interface InventoryPageProps {
    products: Product[];
    // Fix: Corrected the type of setProducts to allow updater functions.
    setProducts: (updater: React.SetStateAction<Product[]>) => void;
    initialProps: InitialPageProps & { onApplied: () => void; } | null;
    mainCategories: MainCategory[];
    materials: Material[];
    subCategories: SubCategory[];
    colors: Color[];
    occasions: Occasion[];
    rpds: RPD[];
    addLog: (message: string, type?: Log['type']) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ products, setProducts, initialProps, mainCategories, materials, subCategories, colors, occasions, rpds, addLog }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProductStatus | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageState, setPageState] = useState<'list' | 'form'>('list');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [pageBusy, setPageBusy] = useState(false);
    const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
    const [variantToDelete, setVariantToDelete] = useState<{ productId: number; variantId: number; variantName: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [view, setView] = useState<'list' | 'card'>('list');
    const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
    const [viewingRpd, setViewingRpd] = useState<RPD | null>(null);
    const [timerModalProductId, setTimerModalProductId] = useState<number | null>(null);
    const [pendingTags, setPendingTags] = useState<string[] | null>(null);
    const [timerDefaultValue, setTimerDefaultValue] = useState<string | null>(null);
    const [timerTargetVariantId, setTimerTargetVariantId] = useState<number | null>(null);

    useEffect(() => {
        if (initialProps) {
            if(initialProps.searchTerm) setSearchTerm(initialProps.searchTerm);
            if(initialProps.statusFilter) setStatusFilter(initialProps.statusFilter as any);
            initialProps.onApplied();
        }
    }, [initialProps]);

    const filteredProducts = useMemo(() => {
        setCurrentPage(1);
        return products.filter(product => {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();

            const nameMatch = product.name.toLowerCase().includes(lowerCaseSearchTerm);
            const variantMatch = (product.variants || []).some(v => 
                v.name.toLowerCase().includes(lowerCaseSearchTerm) ||
                `${product.name} - ${v.name}`.toLowerCase().includes(lowerCaseSearchTerm)
            );
            
            const matchesSearch = nameMatch || variantMatch;
            const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [products, searchTerm, statusFilter]);
    
    const itemsPerPageList = 10;
    const totalPagesList = Math.ceil(filteredProducts.length / itemsPerPageList);
    const currentListItems = filteredProducts.slice((currentPage - 1) * itemsPerPageList, currentPage * itemsPerPageList);

    const displayProducts = useMemo<DisplayableProduct[]>(() => {
        const groupColorsFor = (id: number) => {
            const h = id % 360; // simple deterministic hue
            const base = `hsl(${h}, 70%, 50%)`;
            const variant = `hsl(${h}, 70%, 75%)`; // lighter shade for variants
            return { base, variant };
        };
        const flattened: DisplayableProduct[] = filteredProducts.flatMap(product => {
            const { base: baseColor, variant: variantColor } = groupColorsFor(product.id);
            const baseCard: DisplayableProduct = {
                id: product.id,
                name: product.name,
                price: product.sellingPrice,
                status: product.status,
                mainCategory: product.mainCategory,
                images: product.images,
                tags: product.tags,
                rpdId: product.rpdId,
                groupColor: baseColor,
                isVariant: false,
                limitedDealEndsAt: product.limitedDealEndsAt || null,
            };
            const variantCards: DisplayableProduct[] = (product.variants || []).map(variant => ({
                id: variant.id as number,
                name: variant.name || `${product.name} Variant`,
                price: variant.sellingPrice,
                status: variant.stock > 0 ? ProductStatus.InStock : ProductStatus.OutOfStock,
                mainCategory: product.mainCategory,
                images: (Array.isArray(variant.images) && variant.images.length > 0) ? variant.images : product.images,
                tags: variant.tags,
                rpdId: product.rpdId,
                groupColor: variantColor,
                isVariant: true,
                limitedDealEndsAt: product.limitedDealEndsAt || null,
            }));
            return [baseCard, ...variantCards];
        });

        return flattened.sort((a, b) => {
            switch (sortBy) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                default: return 0;
            }
        });
    }, [filteredProducts, sortBy]);

    const itemsPerPageCard = 12;
    const totalPagesCard = Math.ceil(displayProducts.length / itemsPerPageCard);
    const currentCardItems = displayProducts.slice((currentPage - 1) * itemsPerPageCard, currentPage * itemsPerPageCard);

    useEffect(() => {
        setCurrentPage(1);
    }, [view]);

    const handleViewRPD = (rpdId: number) => {
        const rpdToShow = rpds.find(r => r.id === rpdId);
        if (rpdToShow) {
            setViewingRpd(rpdToShow);
        }
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setEditingVariantId(null);
        setPageState('form');
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setEditingVariantId(null);
        setPageState('form');
    };

    const handleCardEdit = (displayProductId: number) => {
        const productToEdit = products.find(p => p.id === displayProductId || p.variants.some(v => v.id === displayProductId));
        const variantId = productToEdit?.variants.find(v => v.id === displayProductId)?.id;
        
        if (productToEdit) {
            setEditingProduct(productToEdit);
            setEditingVariantId(variantId || null);
            setPageState('form');
        }
    };
    
    const handleEditVariant = (productId: number, variantId: number) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setEditingProduct(product);
            setEditingVariantId(variantId);
            setPageState('form');
        }
    };

    const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
        try {
            setPageBusy(true);
            if ('id' in productData && productData.id) {
                const updatedProduct = await api.updateProduct(productData);
                const __statusU = String((updatedProduct as any).status || '').toLowerCase();
                const __normU = { 
                    ...updatedProduct, 
                    status: (__statusU === 'in_stock' ? ProductStatus.InStock : (__statusU === 'out_of_stock' ? ProductStatus.OutOfStock : (updatedProduct as any).status)) as ProductStatus 
                } as Product;
                setProducts(products.map(p => p.id === __normU.id ? __normU : p));
                addLog(`Product "${updatedProduct.name}" updated.`, 'success');
                setToast({ message: 'Product updated successfully!', type: 'success' });
            } else {
                const newProduct = await api.createProduct(productData);
                const __statusN = String((newProduct as any).status || '').toLowerCase();
                const __normN = { 
                    ...newProduct, 
                    status: (__statusN === 'in_stock' ? ProductStatus.InStock : (__statusN === 'out_of_stock' ? ProductStatus.OutOfStock : (newProduct as any).status)) as ProductStatus 
                } as Product;
                setProducts([__normN, ...products]);
                addLog(`New product "${newProduct.name}" created.`, 'success');
                setToast({ message: 'New product created!', type: 'success' });
            }
            setPageState('list');
            setEditingProduct(null);
        } catch (error) {
            setToast({ message: 'Failed to save product.', type: 'error' });
        } finally {
            setPageBusy(false);
        }
    };
    
    const resetTimerModalState = () => {
        setTimerModalProductId(null);
        setPendingTags(null);
        setTimerDefaultValue(null);
        setTimerTargetVariantId(null);
    };

    const updateProductWithTags = async (
        product: Product,
        newTags: string[],
        limitedDealEndsAt: string | null,
        variantId?: number | null
    ) => {
        let nextProduct: Product = { ...product, limitedDealEndsAt: limitedDealEndsAt ?? product.limitedDealEndsAt ?? null };

        if (variantId) {
            const updatedVariants = product.variants.map(v => v.id === variantId ? { ...v, tags: newTags } : v);
            nextProduct = { ...nextProduct, variants: updatedVariants };
        } else {
            nextProduct = { ...nextProduct, tags: newTags };
        }

        const hasLimited =
            (nextProduct.tags || []).includes(LIMITED_DEAL_TAG) ||
            (nextProduct.variants || []).some(v => Array.isArray(v.tags) && v.tags.includes(LIMITED_DEAL_TAG));

        if (!hasLimited) {
            nextProduct.limitedDealEndsAt = null;
        }

        const savedProduct = await api.updateProduct(nextProduct);
        setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
    };
    
    const handleTagsChange = async (productId: number, newTags: string[]) => {
        const productToUpdate = products.find(p => p.id === productId);
        if (!productToUpdate) return;

        const addedLimited = newTags.includes(LIMITED_DEAL_TAG) && !productToUpdate.tags.includes(LIMITED_DEAL_TAG);
        if (addedLimited && !productToUpdate.limitedDealEndsAt) {
            setProducts(products.map(p => p.id === productId ? { ...p, tags: newTags } : p));
            setTimerModalProductId(productId);
            setPendingTags(newTags);
            setTimerDefaultValue(productToUpdate.limitedDealEndsAt || null);
            setTimerTargetVariantId(null);
            return;
        }

        try {
            const nextTimer = newTags.includes(LIMITED_DEAL_TAG) ? (productToUpdate.limitedDealEndsAt || null) : null;
            await updateProductWithTags(productToUpdate, newTags, nextTimer, null);
        } catch (error) {
             setToast({ message: 'Failed to update tags.', type: 'error' });
        }
    };

    const handleCardTagsChange = async (displayProductId: number, newTags: string[]) => {
        const productToUpdate = products.find(p => 
            (p.id === displayProductId && p.variants.length === 0) || 
            p.variants.some(v => v.id === displayProductId)
        );
        if (!productToUpdate) return;

        const variantIndex = productToUpdate.variants.findIndex(v => v.id === displayProductId);
        const isVariantCard = variantIndex > -1;

        if (isVariantCard) {
            const currentVariant = productToUpdate.variants[variantIndex];
            const addedLimited = newTags.includes(LIMITED_DEAL_TAG) && !(currentVariant.tags || []).includes(LIMITED_DEAL_TAG);
            if (addedLimited && !productToUpdate.limitedDealEndsAt) {
                const optimistic = products.map(p => {
                    if (p.id !== productToUpdate.id) return p;
                    const newVariants = p.variants.map(v => v.id === currentVariant.id ? { ...v, tags: newTags } : v);
                    return { ...p, variants: newVariants };
                });
                setProducts(optimistic);
                setTimerModalProductId(productToUpdate.id);
                setPendingTags(newTags);
                setTimerDefaultValue(productToUpdate.limitedDealEndsAt || null);
                setTimerTargetVariantId(currentVariant.id as number);
                return;
            }
            try {
                const nextTimer = (newTags.includes(LIMITED_DEAL_TAG) || productToUpdate.tags.includes(LIMITED_DEAL_TAG))
                    ? (productToUpdate.limitedDealEndsAt || null)
                    : null;
                await updateProductWithTags(productToUpdate, newTags, nextTimer, currentVariant.id as number);
            } catch (error) {
                setToast({ message: 'Failed to update tags.', type: 'error' });
            }
            return;
        }

        const addedLimited = newTags.includes(LIMITED_DEAL_TAG) && !productToUpdate.tags.includes(LIMITED_DEAL_TAG);
        if (addedLimited && !productToUpdate.limitedDealEndsAt) {
            setProducts(products.map(p => p.id === productToUpdate.id ? { ...p, tags: newTags } : p));
            setTimerModalProductId(productToUpdate.id);
            setPendingTags(newTags);
            setTimerDefaultValue(productToUpdate.limitedDealEndsAt || null);
            setTimerTargetVariantId(null);
            return;
        }

        try {
            const nextTimer = newTags.includes(LIMITED_DEAL_TAG) ? (productToUpdate.limitedDealEndsAt || null) : null;
            await updateProductWithTags(productToUpdate, newTags, nextTimer, null);
        } catch (error) {
            setToast({ message: 'Failed to update tags.', type: 'error' });
        }
    };

    const handleLimitedTimerSave = async (value: string) => {
        if (!timerModalProductId || !pendingTags) {
            resetTimerModalState();
            return;
        }
        const productToUpdate = products.find(p => p.id === timerModalProductId);
        if (!productToUpdate) {
            resetTimerModalState();
            return;
        }
        try {
            await updateProductWithTags(
                productToUpdate,
                pendingTags,
                new Date(value).toISOString(),
                timerTargetVariantId
            );
        } catch (error) {
            setToast({ message: 'Failed to save Limited Deal timer.', type: 'error' });
        } finally {
            resetTimerModalState();
        }
    };

    const handleLimitedTimerCancel = () => {
        resetTimerModalState();
    };
    
    const handlePriceChange = async (productId: number, newPrice: number) => {
        const productToUpdate = products.find(p => p.id === productId);
        if(productToUpdate) {
            const updatedProduct = {...productToUpdate, sellingPrice: newPrice};
            try {
                 await api.updateProduct(updatedProduct);
                 setProducts(products.map(p => p.id === productId ? updatedProduct : p));
            } catch(e) { setToast({message: 'Failed to update price.', type: 'error'}); }
        }
    };

    const handleVariantPriceChange = async(productId: number, variantId: number, newPrice: number) => {
        const productToUpdate = products.find(p => p.id === productId);
        if(productToUpdate) {
            const updatedVariants = productToUpdate.variants.map(v => v.id === variantId ? {...v, sellingPrice: newPrice} : v);
            const updatedProduct = {...productToUpdate, variants: updatedVariants};
            try {
                 await api.updateProduct(updatedProduct);
                 setProducts(products.map(p => p.id === productId ? updatedProduct : p));
            } catch(e) { setToast({message: 'Failed to update variant price.', type: 'error'}); }
        }
    };

     const handleVariantTagsChange = async(productId: number, variantId: number, newTags: string[]) => {
        const productToUpdate = products.find(p => p.id === productId);
        if(productToUpdate) {
            const updatedVariants = productToUpdate.variants.map(v => v.id === variantId ? {...v, tags: newTags} : v);
            const updatedProduct = {...productToUpdate, variants: updatedVariants};
            try {
                 await api.updateProduct(updatedProduct);
                 setProducts(products.map(p => p.id === productId ? updatedProduct : p));
            } catch(e) { setToast({message: 'Failed to update variant tags.', type: 'error'}); }
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        try {
            const productToDelete = products.find(p => p.id === productId);
            await api.deleteProduct(productId);
            setProducts(products.filter(p => p.id !== productId));
            if (productToDelete) {
                 addLog(`Product "${productToDelete.name}" deleted.`, 'warning');
            }
            setToast({ message: 'Product deleted.', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to delete product.', type: 'error' });
        }
    };
    
    const handleDeleteVariant = async () => {
        if (!variantToDelete) return;
        const { productId, variantId } = variantToDelete;
        const productToUpdate = products.find(p => p.id === productId);
        if (!productToUpdate) return;

        const updatedVariants = productToUpdate.variants.filter(v => v.id !== variantId);
        const updatedProduct = {...productToUpdate, variants: updatedVariants};
        
        try {
            await api.updateProduct(updatedProduct);
            setProducts(products.map(p => p.id === productId ? updatedProduct : p));
            addLog(`Variant "${variantToDelete.variantName}" from product "${productToUpdate.name}" deleted.`, 'warning');
            setToast({ message: 'Variant deleted.', type: 'success' });
        } catch(error) {
             setToast({ message: 'Failed to delete variant.', type: 'error' });
        } finally {
            setVariantToDelete(null);
        }
    };
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setToast(null);

        const { newProducts, error } = await processFileUpload(file);

        if (error) {
            setToast({ message: error, type: 'error' });
        } else {
            // In a real app, you'd probably send these to the backend API one by one or via a bulk endpoint.
            // For this mock, we'll just add them to the state.
            const createdProducts = await Promise.all(newProducts.map(p => api.createProduct(p)));
            setProducts(prev => [...createdProducts, ...prev]);
            addLog(`Uploaded and created ${createdProducts.length} new products via ${file.name}.`, 'success');
            setToast({ message: `Successfully added ${createdProducts.length} products!`, type: 'success' });
        }
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };


    if (pageState === 'form') {
        return (
            <ProductFormPage 
                onSave={handleSaveProduct}
                onClose={() => setPageState('list')}
                productToEdit={editingProduct}
                initialActiveVariantId={editingVariantId}
                mainCategories={mainCategories}
                materials={materials}
                subCategories={subCategories}
                colors={colors}
                occasions={occasions}
                rpds={rpds}
            />
        );
    }

    return (
        <div className="container mx-auto relative">
            {(isUploading || pageBusy) && (
                <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-lg">
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{isUploading ? 'Uploading products…' : 'Saving product…'}</span>
                    </div>
                </div>
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-text-primary mb-6">Product Inventory</h1>
            
            <div className="bg-card p-4 rounded-xl shadow-md mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setView('list')} className={`p-2 rounded-md ${view === 'list' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} title="List View">{ICONS.listView}</button>
                    <button onClick={() => setView('card')} className={`p-2 rounded-md ${view === 'card' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} title="Card View">{ICONS.cardView}</button>
                </div>

                <div className="flex items-center space-x-2 flex-grow justify-center">
                    <div className="relative w-full max-w-xs">
                        <input
                            type="text"
                            placeholder="Search by product or variant name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    {view === 'card' ? (
                         <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'default' | 'price-asc' | 'price-desc')}
                            className="px-4 py-2 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="default">Default Sort</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                        </select>
                    ) : (
                         <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'All')}
                            className="px-4 py-2 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="All">All Statuses</option>
                            <option value={ProductStatus.InStock}>In Stock</option>
                            <option value={ProductStatus.OutOfStock}>Out of Stock</option>
                        </select>
                    )}
                </div>
                
                <div className="flex items-center space-x-2">
                    <button onClick={downloadXlsxTemplate} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center">
                        {ICONS.download}
                        <span className="ml-2">Download Template</span>
                    </button>
                    <div className="relative inline-block">
                        <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center disabled:bg-gray-400">
                            {isUploading ? <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : ICONS.download}
                            <span className="ml-2">{isUploading ? 'Uploading...' : 'Upload CSV/Excel'}</span>
                        </button>
                         <button onClick={() => setIsInstructionsModalOpen(true)} className="absolute -top-2 -right-2 bg-primary text-white h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold" title="Upload Instructions">?</button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                    
                    <button onClick={handleAddProduct} className="bg-primary text-white font-semibold py-2 px-5 rounded-lg hover:bg-opacity-90 transition">
                        + Add Product
                    </button>
                </div>
            </div>

            {view === 'list' ? (
                <>
                    <InventoryTable 
                        products={currentListItems} 
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onTagsChange={handleTagsChange}
                        onPriceChange={handlePriceChange}
                        onVariantPriceChange={handleVariantPriceChange}
                        onVariantTagsChange={handleVariantTagsChange}
                        onEditVariant={handleEditVariant}
                        onDeleteVariant={(productId, variantId, variantName) => setVariantToDelete({ productId, variantId, variantName })}
                        itemOffset={(currentPage - 1) * itemsPerPageList}
                    />
                    {totalPagesList > 1 && <Pagination currentPage={currentPage} totalPages={totalPagesList} onPageChange={setCurrentPage} />}
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentCardItems.map(p => <ProductDisplayCard key={p.id} product={p} onEdit={handleCardEdit} onTagsChange={handleCardTagsChange} onViewRPD={handleViewRPD} />)}
                    </div>
                    {totalPagesCard > 1 && <div className="mt-6"><Pagination currentPage={currentPage} totalPages={totalPagesCard} onPageChange={setCurrentPage} /></div>}
                </>
            )}

            {isInstructionsModalOpen && (
                <UploadInstructionsModal onClose={() => setIsInstructionsModalOpen(false)} />
            )}
            {variantToDelete && (
                 <ConfirmationModal
                    isOpen={!!variantToDelete}
                    onClose={() => setVariantToDelete(null)}
                    onConfirm={handleDeleteVariant}
                    title="Delete Variant?"
                    message={`Are you sure you want to delete the variant "${variantToDelete.variantName}"? This action cannot be undone.`}
                    confirmButtonText="Delete"
                    confirmButtonVariant="danger"
                />
            )}
             <RPDViewerModal rpd={viewingRpd} onClose={() => setViewingRpd(null)} />
             <LimitedDealTimerModal
                isOpen={!!timerModalProductId}
                initialValue={timerDefaultValue}
                onSave={handleLimitedTimerSave}
                onCancel={handleLimitedTimerCancel}
             />
        </div>
    );
};
