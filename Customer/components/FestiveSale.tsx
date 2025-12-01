import React, { useEffect, useState, useMemo } from 'react';
import ProductSlider from './ProductSlider';
import BannerCarousel from './BannerCarousel';
import { fetchByTag } from '../services/apiService';
import type { Product, WishlistItem, CartItem, Banner } from '../types';

interface ProductSliderContainerProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (id: number) => void;
  banners?: Banner[];
}

const FestiveSale: React.FC<ProductSliderContainerProps> = (props) => {
  const { banners, ...sliderProps } = props;
  const [festiveProducts, setFestiveProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const saleBanners = useMemo(() => (Array.isArray(banners) ? banners : []), [banners]);

  useEffect(() => {
    const loadFestiveProducts = async () => {
      try {
        const items = await fetchByTag('Festive Sale');
        setFestiveProducts(
          items.map((item: Product) => ({
            ...item,
            badge: 'Festive Sale',
          }))
        );
      } catch (error) {
        console.error('Error fetching Festive Sale products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFestiveProducts();
  }, []);

  return (
    <>
      <BannerCarousel banners={saleBanners} />

      <ProductSlider
        title="The Festive Sale"
        subtitle="Celebrate the season with sparkling deals on your favorite pieces."
        products={festiveProducts}
        loading={loading}
        {...sliderProps}
      />
    </>
  );
};

export default FestiveSale;
