import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import Testimonials from '../components/Testimonials';
import NewArrivals from '../components/NewArrivals';
import BestSellers from '../components/BestSellers';
import FestiveSale from '../components/FestiveSale';
import LimitedOffers from '../components/LimitedOffers';
import ShopByOccasion from '../components/ShopByOccasion';
import ShopByCrystal from '../components/ShopByCrystal';
import ShopByProductType from '../components/ShopByProductType';
import WhyChooseUs from '../components/WhyChooseUs';
import type { Product, WishlistItem, CartItem, Occasion, Crystal, ProductType } from '../types';
import { fetchBanners } from '../services/apiService';
import type { Banner } from '../types';

interface HomePageProps {
  productSliderProps: {
    wishlistItems: WishlistItem[];
    cartItems: CartItem[];
    onToggleWishlist: (id: number) => void;
    onToggleCart: (id: number) => void;
    onSelectProduct: (product: Product) => void;
    onBuyNow: (id: number) => void;
  };
  onNavigateToAllProducts: () => void;
  collageOccasions?: Occasion[];
  collageCrystals?: Crystal[];
  collageProductTypes?: ProductType[];
  onSelectOccasion?: (occasionName: string) => void;
  onSelectCrystal?: (crystalName: string) => void;
  onSelectProductType?: (typeName: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  productSliderProps,
  onNavigateToAllProducts,
  collageOccasions,
  collageCrystals,
  collageProductTypes,
  onSelectOccasion,
  onSelectCrystal,
  onSelectProductType,
}) => {
  // ✅ Hooks must be inside the component
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const data = await fetchBanners();
        setBanners(data);
      } catch (err) {
        console.error("Failed to load banners:", err);
      }
    };
    loadBanners();
  }, []);

  return (
    <main>
      <Hero onNavigateToAllProducts={onNavigateToAllProducts} />
      <FeaturedProducts {...productSliderProps} />
      <NewArrivals {...productSliderProps} />
      <BestSellers {...productSliderProps} />
      <FestiveSale {...productSliderProps} banners={banners} />
      <LimitedOffers {...productSliderProps} />
      <ShopByOccasion items={collageOccasions} onSelect={onSelectOccasion} />
      <ShopByCrystal items={collageCrystals} onSelect={onSelectCrystal} />
      <ShopByProductType items={collageProductTypes} onSelect={onSelectProductType} />
      <WhyChooseUs />
      <Testimonials />
    </main>
  );
};

export default HomePage;
