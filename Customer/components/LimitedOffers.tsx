import React, { useEffect, useState } from 'react';
import ProductSlider from './ProductSlider';
import { fetchByTag } from '../services/apiService';
import type { Product, WishlistItem, CartItem } from '../types';

interface ProductSliderContainerProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (id: number) => void;
}

const LimitedOffers: React.FC<ProductSliderContainerProps> = (props) => {
  const [limitedOfferProducts, setLimitedOfferProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLimitedOffers = async () => {
      try {
        const items = await fetchByTag('Limited Deal');
        setLimitedOfferProducts(
          items.map((item: Product) => ({
            ...item,
            badge: 'Limited', // Add badge dynamically
            expiryDate: (item as any).dealEndsAt ?? (item as any).limited_deal_ends_at ?? (item as any).limitedDealEndsAt ?? (item as any).expiryDate,
          }))
        );
      } catch (error) {
        console.error("Error fetching limited offer products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLimitedOffers();
  }, []);

  return (
    <ProductSlider
      title="Limited Offers"
      subtitle="An exclusive opportunity to own a piece of Aura at a special price."
      products={limitedOfferProducts}
      loading={loading} // Optional if you handle loading in ProductSlider
      {...props}
    />
  );
};

export default LimitedOffers;
