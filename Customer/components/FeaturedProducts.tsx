import React, { useEffect, useState } from 'react';
import { fetchByTag } from '../services/apiService';
import ProductSlider from './ProductSlider';
import type { Product, WishlistItem, CartItem } from '../types';

// FIX: Added 'onBuyNow' to the props interface to align with ProductSlider's requirements.
interface ProductSliderContainerProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (id: number) => void;
}


const FeaturedProducts: React.FC<ProductSliderContainerProps> = (props) => {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await fetchByTag('Featured Products');
        setFeatured(items);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      }
    };
    load();
  }, []);

  return (
    <ProductSlider
      title="Featured Products"
      subtitle="Handpicked pieces that define our signature style."
      products={featured}
      {...props}
    />
  );
};


export default FeaturedProducts;
