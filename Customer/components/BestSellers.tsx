import React, { useEffect, useState } from 'react';
import ProductSlider from './ProductSlider';
import type { Product, WishlistItem, CartItem } from '../types';
import { fetchByTag } from '../services/apiService';

interface ProductSliderContainerProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (id: number) => void;
}

const BestSellers: React.FC<ProductSliderContainerProps> = (props) => {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBestSellers = async () => {
      try {
        const items = await fetchByTag('Best Sellers');
        setBestSellers(items);
      } catch (err) {
        console.error('Failed to load Best Sellers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBestSellers();
  }, []);

  return (
    <ProductSlider
      title="Our Best Sellers"
      subtitle="Adored by many, chosen by you. Explore our most popular pieces."
      products={bestSellers}
      loading={loading}
      {...props}
    />
  );
};

export default BestSellers;

