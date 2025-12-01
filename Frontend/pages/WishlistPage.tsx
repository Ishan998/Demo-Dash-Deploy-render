import React, { useState, useEffect } from 'react';
import * as api from '../services/apiService';
import Toast from '../components/Toast';
import ProductDisplayCard from '../components/ProductDisplayCard';
import { Product, ProductStatus } from '../types';

interface WishlistItem {
    id: number;
    product: Product;
    created_at: string;
}

const WishlistPage: React.FC = () => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                setIsLoading(true);
                const items = await api.getWishlist();
                setWishlistItems(items);
            } catch (error) {
                console.error("Failed to fetch wishlist:", error);
                setToast({ message: 'Could not load your wishlist.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchWishlist();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-4 text-xl text-text-secondary">Loading Wishlist...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <h1 className="text-3xl font-bold text-text-primary mb-6">My Wishlist</h1>
            {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlistItems.map(item => {
                        // The backend serializer nests the product details.
                        const product = item.product;
                        const displayProduct = {
                            id: product.id,
                            name: product.name,
                            price: product.sellingPrice,
                            status: product.status,
                            mainCategory: product.mainCategory,
                            images: product.images,
                            tags: product.tags,
                            rpdId: product.rpdId,
                        };
                        return <ProductDisplayCard key={item.id} product={displayProduct} onEdit={() => {}} onTagsChange={() => {}} onViewRPD={() => {}} />;
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-card rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-text-primary">Your Wishlist is Empty</h2>
                    <p className="text-text-secondary mt-2">Looks like you haven't added any items yet. Start exploring!</p>
                </div>
            )}
        </div>
    );
};

export default WishlistPage;