
import React, { useEffect, useState } from 'react';
// import { newArrivals } from '../constants';
import { fetchByTag } from '../services/apiService';
import ProductSlider from './ProductSlider';
import type { Product, WishlistItem, CartItem } from '../types';

// FIX: Added 'onBuyNow' to the props interface to align with ProductSlider's requirements.
// Slider Props (same as other sliders)
interface ProductSliderContainerProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (id: number) => void;
}

const NewArrivals: React.FC<ProductSliderContainerProps> = (props) => {
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNewArrivals = async () => {
      try {
        // ✅ Fetch products having tag "New Arrival" from Django
        const items = await fetchByTag('New Arrival');
        setNewArrivalProducts(items);
      } catch (error) {
        console.error('Failed to load new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNewArrivals();
  }, []);

  return (
    <ProductSlider
      title="New Arrivals"
      subtitle="Discover our latest creations, fresh from the workshop."
      products={newArrivalProducts}
      loading={loading}
      {...props}
    />
  );
};

export default NewArrivals;
