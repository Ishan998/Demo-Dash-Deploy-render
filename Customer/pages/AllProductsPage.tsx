import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Product, WishlistItem, CartItem, MegaMenuLink } from '../types';
import ProductCard from '../components/ProductCard';
import { SearchIcon, CloseIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icon';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { fetchProducts, fetchCategories, fetchSubcategories, fetchMaterials, fetchOccasions, fetchColors, fetchCrystals } from '../services/apiService';
import { getBestAvailableDiscountPercent } from '../utils/pricing';

// Simple in-memory cache to avoid refetching when navigating back from PDP
let cachedProducts: Product[] | null = null;
let cachedMeta:
  | {
      categories: any[];
      subcategories: any[];
      materials: any[];
      occasions: any[];
      colors: any[];
      crystals: any[];
    }
  | null = null;
let cachedBootFetched = false;

// DEBUG: Toggle console logging on All Products page.
// Enable with `?debug=1` in URL or set localStorage key `DEBUG_ALL_PRODUCTS` to '1'.
// Remove this before deployment if not needed.
const DEBUG_ALL_PRODUCTS = typeof window !== 'undefined'
  && (window.location.search.includes('debug=1')
      || window.localStorage.getItem('DEBUG_ALL_PRODUCTS') === '1');

type Filter = MegaMenuLink['filter'];

interface AllProductsPageProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (selection: { product: Product; variantId?: number }) => void;
  onBuyNow: (id: number) => void;
  onBack?: () => void;
  initialFilters: Filter[] | null;
  onClearInitialFilters: () => void;
  initialSearchQuery: string | null;
  onClearInitialSearchQuery: () => void;
}

interface FilterCheckboxProps {
  id: string;
  label: string;
  value: string;
  isChecked: boolean;
  onChange: (value: string) => void;
  isBold?: boolean;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ id, label, value, isChecked, onChange, isBold = false }) => (
      <div className="flex items-center">
        <input 
          id={id} 
          type="checkbox" 
          checked={isChecked}
          onChange={() => onChange(value)}
          className="h-4 w-4 rounded border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]"
        />
        <label htmlFor={id} className={`ml-3 text-sm text-gray-600 ${isBold ? 'font-semibold' : ''}`}>{label}</label>
      </div>
  );

const FilterSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
    <div className="border-t pt-4">
        <details className="group" {...(defaultOpen ? { open: true } : {})}>
            <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                <span>{title}</span>
                <svg className="w-4 h-4 transition-transform transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-2">
                {children}
            </div>
        </details>
    </div>
  );

interface FilterPanelProps {
  idPrefix: string;
  categories: { id: number; name: string }[];
  getSubCategoriesFor: (mainCat: string) => string[];
  selectedMainCategoryFilters: Set<string>;
  selectedSubCategoryFilters: Set<string>;
  handleClearCategoryFilters: () => void;
  handleMainCatToggle: (mainCat: string) => void;
  handleSubCatToggle: (subCat: string, mainCat: string) => void;
  handleSimpleMainCatToggle: (value: string) => void;
  priceRange: { min: number; max: number };
  maxPrice: number;
  priceStep: number;
  setPriceRange: React.Dispatch<React.SetStateAction<{ min: number; max: number }>>;
  selectedDiscountTier: number;
  discountTiers: { label: string; value: number }[];
  handleDiscountChange: (val: number) => void;
  handleDiscountReset: () => void;
  materialOptions: string[];
  selectedMetals: Set<string>;
  setSelectedMetals: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleSetChange: (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => void;
  gemstoneOptions: string[];
  selectedGemstones: Set<string>;
  setSelectedGemstones: React.Dispatch<React.SetStateAction<Set<string>>>;
  occasionOptions: string[];
  selectedOccasions: Set<string>;
  setSelectedOccasions: React.Dispatch<React.SetStateAction<Set<string>>>;
  allSizes: string[];
  selectedSizes: Set<string>;
  setSelectedSizes: React.Dispatch<React.SetStateAction<Set<string>>>;
  colorOptions: string[];
  selectedColors: Set<string>;
  setSelectedColors: React.Dispatch<React.SetStateAction<Set<string>>>;
  showInStockOnly: boolean;
  setShowInStockOnly: React.Dispatch<React.SetStateAction<boolean>>;
  resetFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  idPrefix,
  categories,
  getSubCategoriesFor,
  selectedMainCategoryFilters,
  selectedSubCategoryFilters,
  handleClearCategoryFilters,
  handleMainCatToggle,
  handleSubCatToggle,
  handleSimpleMainCatToggle,
  priceRange,
  maxPrice,
  priceStep,
  setPriceRange,
  selectedDiscountTier,
  discountTiers,
  handleDiscountChange,
  handleDiscountReset,
  materialOptions,
  selectedMetals,
  setSelectedMetals,
  handleSetChange,
  gemstoneOptions,
  selectedGemstones,
  setSelectedGemstones,
  occasionOptions,
  selectedOccasions,
  setSelectedOccasions,
  allSizes,
  selectedSizes,
  setSelectedSizes,
  colorOptions,
  selectedColors,
  setSelectedColors,
  showInStockOnly,
  setShowInStockOnly,
  resetFilters,
}) => (
    <div className="space-y-6 pr-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-sm font-semibold text-gray-600 hover:text-red-500 transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Category</h4>
        <ul className="space-y-1 text-sm">
            <li>
                <button
                    onClick={handleClearCategoryFilters}
                    className={`w-full text-left py-1 ${selectedMainCategoryFilters.size === 0 && selectedSubCategoryFilters.size === 0 ? 'font-bold text-[#D4AF37]' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    All Jewellery
                </button>
            </li>
            {categories.map(c => {
                const mainCat = c.name;
                const subCats = getSubCategoriesFor(mainCat);
                const hasSubCats = Array.isArray(subCats) && subCats.length > 0;

                if (hasSubCats) {
                    const isAnySubCatSelected = subCats.some(subCatName => selectedSubCategoryFilters.has(`${mainCat}::${subCatName}`));
                    return (
                        <li key={mainCat}>
                            <details className="group" open={selectedMainCategoryFilters.has(mainCat) || isAnySubCatSelected}>
                                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center py-1">
                                    <span>{mainCat}</span>
                                    <svg className="w-4 h-4 transition-transform transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </summary>
                                <ul className="pl-4 mt-2 space-y-2 border-l">
                                    <li>
                                        <FilterCheckbox
                                            id={`${idPrefix}-maincat-${mainCat.replace(/\s+/g, '-')}`}
                                            label={`All ${mainCat}`}
                                            value={mainCat}
                                            isChecked={selectedMainCategoryFilters.has(mainCat)}
                                            onChange={() => handleMainCatToggle(mainCat)}
                                            isBold={true}
                                        />
                                    </li>
                                    {subCats.map(subCatName => (
                                        <li key={subCatName}>
                                            <FilterCheckbox
                                                id={`${idPrefix}-subcat-${mainCat.replace(/\s+/g, '-')}-${subCatName.replace(/\s+/g, '-')}`}
                                                label={subCatName}
                                                value={subCatName}
                                                isChecked={selectedSubCategoryFilters.has(`${mainCat}::${subCatName}`)}
                                                onChange={() => handleSubCatToggle(subCatName, mainCat)}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        </li>
                    );
                } else {
                    return (
                        <li key={mainCat} className="py-1">
                            <FilterCheckbox
                                id={`${idPrefix}-maincat-${mainCat.replace(/\s+/g, '-')}`}
                                label={mainCat}
                                value={mainCat}
                                isChecked={selectedMainCategoryFilters.has(mainCat)}
                                onChange={() => handleSimpleMainCatToggle(mainCat)}
                                isBold={true}
                            />
                        </li>
                    );
                }
            })}
        </ul>
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Price Range</h4>
        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>₹{priceRange.min.toLocaleString('en-IN')}</span>
            <span>₹{priceRange.max.toLocaleString('en-IN')}</span>
        </div>
        <input
            type="range"
            min="0"
            max={maxPrice}
            value={priceRange.max}
            step={priceStep}
            onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-[#D4AF37] [&::-moz-range-thumb]:bg-[#D4AF37]"
        />
      </div>

       <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Discount</h4>
              {selectedDiscountTier !== 0 && (
                <button
                  type="button"
                  onClick={handleDiscountReset}
                  className="text-xs font-semibold text-gray-600 hover:text-red-500"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-2">
                {discountTiers.map(tier => (
                  <label
                    key={tier.value}
                    htmlFor={`${idPrefix}-discount-${tier.value}`}
                    className={`flex items-center rounded-md p-2 transition-colors cursor-pointer ${
                      Number(selectedDiscountTier) === Number(tier.value)
                        ? 'bg-[#FDFBF6] border border-[#D4AF37]'
                        : 'border border-transparent'
                    }`}
                  >
                    <input
                      id={`${idPrefix}-discount-${tier.value}`}
                      name={`${idPrefix}-discount`}
                      type="radio"
                      value={tier.value}
                      checked={Number(selectedDiscountTier) === Number(tier.value)}
                      onChange={(e) => handleDiscountChange(Number(e.target.value))}
                      className="h-4 w-4 text-[#D4AF37] border-gray-300 focus:ring-[#D4AF37]"
                    />
                    <span className="ml-3 block text-sm font-medium text-gray-700">
                      {tier.label}
                    </span>
                  </label>
                ))}
            </div>
        </div>

      <FilterSection title="Material">{materialOptions.map(material => <FilterCheckbox key={material} id={`${idPrefix}-material-${material}`} label={material} value={material} isChecked={selectedMetals.has(material)} onChange={(value) => handleSetChange(setSelectedMetals, value)} />)}</FilterSection>
      <FilterSection title="Gemstone">{gemstoneOptions.map(gem => <FilterCheckbox key={gem} id={`${idPrefix}-gem-${gem}`} label={gem} value={gem} isChecked={selectedGemstones.has(gem)} onChange={(value) => handleSetChange(setSelectedGemstones, value)} />)}</FilterSection>
      <FilterSection title="Occasion">{occasionOptions.map(occ => <FilterCheckbox key={occ} id={`${idPrefix}-occ-${occ}`} label={occ} value={occ} isChecked={selectedOccasions.has(occ)} onChange={(value) => handleSetChange(setSelectedOccasions, value)} />)}</FilterSection>
      <FilterSection title="Size">{allSizes.map(size => <FilterCheckbox key={size} id={`${idPrefix}-size-${size}`} label={size} value={size} isChecked={selectedSizes.has(size)} onChange={(value) => handleSetChange(setSelectedSizes, value)} />)}</FilterSection>
      <FilterSection title="Color">{colorOptions.map(color => <FilterCheckbox key={color} id={`${idPrefix}-color-${color}`} label={color} value={color} isChecked={selectedColors.has(color)} onChange={(value) => handleSetChange(setSelectedColors, value)} />)}</FilterSection>
    
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
            <label htmlFor={`${idPrefix}-in-stock-toggle`} className="text-sm font-medium text-gray-700">In Stock Only</label>
             <label htmlFor={`${idPrefix}-in-stock-toggle`} className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id={`${idPrefix}-in-stock-toggle`} className="sr-only peer" checked={showInStockOnly} onChange={(e) => setShowInStockOnly(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#D4AF37] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
            </label>
        </div>
      </div>
    </div>
  );

const AllProductsPage: React.FC<AllProductsPageProps> = (props) => {
  const { initialFilters, onClearInitialFilters, initialSearchQuery, onClearInitialSearchQuery } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('all');
  const [selectedMainCategoryFilters, setSelectedMainCategoryFilters] = useState<Set<string>>(new Set());
  const [selectedSubCategoryFilters, setSelectedSubCategoryFilters] = useState<Set<string>>(new Set());
  const [selectedMetals, setSelectedMetals] = useState<Set<string>>(new Set());
  const [selectedGemstones, setSelectedGemstones] = useState<Set<string>>(new Set());
  const [selectedOccasions, setSelectedOccasions] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedDiscountTier, setSelectedDiscountTier] = useState<number>(0);
  const [selectedBadges, setSelectedBadges] = useState<Set<Product['badge'] | string>>(new Set());
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const subCategorySliderRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isBootFetched, setIsBootFetched] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [subcategories, setSubcategories] = useState<{ id: number; name: string; main_category_id: number | null; main_category_name?: string | null }[]>([]);
  const [materials, setMaterials] = useState<{ id: number; name: string }[]>([]);
  const [occasions, setOccasions] = useState<{ id: number; name: string }[]>([]);
  const [colorsMeta, setColorsMeta] = useState<{ id: number; name: string; hex_code?: string }[]>([]);
  const [crystals, setCrystals] = useState<string[]>([]);
  
  const maxPrice = useMemo(() => {
    const values = (products ?? []).map(p => (typeof p.originalPrice === 'number' && p.originalPrice > 0) ? p.originalPrice : p.price);
    if (!values.length) return 0;
    const rawMax = Math.max(...values);
    return Math.ceil((rawMax || 0) / 1000) * 1000;
  }, [products]);

  const priceStep = useMemo(() => {
    if (!maxPrice || maxPrice <= 0) return 100;
    const coarse = Math.round(maxPrice / 50); // target ~50 steps for smooth dragging
    return Math.max(50, coarse);
  }, [maxPrice]);
  
  const [priceRange, setPriceRange] = useState({ min: 0, max: maxPrice });
  // Keep price range in sync with data-derived max when products load/change
  useEffect(() => {
    setPriceRange(prev => ({ min: 0, max: maxPrice }));
  }, [maxPrice]);

  const getSubCategoriesFor = (mainCat: string) => {
      // DEBUG: Backend may return camelCased keys due to camelCase renderer
      const subs = subcategories.filter((s: any) => (
        (s?.mainCategoryName ?? s?.main_category_name ?? '')
          .toLowerCase() === mainCat.toLowerCase()
      )).map((s: any) => s.name);
      return subs;
  };

  const handleMainCatToggle = (mainCat: string) => {
      const subCatsOfMain = getSubCategoriesFor(mainCat).map(s => s.name);
      setSelectedMainCategoryFilters(prev => {
          const newSet = new Set(prev);
          if (newSet.has(mainCat)) {
              newSet.delete(mainCat);
          } else {
              newSet.add(mainCat);
              // When selecting a main category, deselect its sub-categories
              setSelectedSubCategoryFilters(subPrev => {
                  const newSubSet = new Set(subPrev);
                  // Use a unique identifier for sub-categories
                  subCatsOfMain.forEach(s => newSubSet.delete(`${mainCat}::${s}`));
                  return newSubSet;
              });
          }
          return newSet;
      });
  };

  const handleSubCatToggle = (subCat: string, mainCat: string) => {
      const uniqueSubCatId = `${mainCat}::${subCat}`;
      setSelectedSubCategoryFilters(prev => {
          const newSet = new Set(prev);
          if (newSet.has(uniqueSubCatId)) {
              newSet.delete(uniqueSubCatId);
          } else {
              newSet.add(uniqueSubCatId);
              // When selecting a sub-category, deselect its parent main category
              setSelectedMainCategoryFilters(mainPrev => {
                  const newMainSet = new Set(mainPrev);
                  newMainSet.delete(mainCat);
                  return newMainSet;
              });
          }
          return newSet;
      });
  };

  const handleSimpleMainCatToggle = (value: string) => {
    setSelectedMainCategoryFilters(prev => {
        const newSet = new Set(prev);
        if (newSet.has(value)) {
            newSet.delete(value);
        } else {
            newSet.add(value);
        }
        return newSet;
    });
  };

  useEffect(() => {
    setIsLoading(true);
    if (isBootLoading || !isBootFetched) return;
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, sortOption, selectedMainCategoryFilters, selectedSubCategoryFilters, priceRange, selectedMetals, selectedGemstones, selectedOccasions, selectedSizes, selectedColors, selectedDiscountTier, showInStockOnly, isBootLoading, isBootFetched]);

  // Boot: Fetch products and settings categories/subcategories from backend
  useEffect(() => {
    const load = async () => {
      try {
        setIsBootLoading(true);

        if (cachedBootFetched && cachedProducts) {
          setProducts(cachedProducts);
          if (cachedMeta) {
            setCategories(cachedMeta.categories || []);
            setSubcategories(cachedMeta.subcategories || []);
            setMaterials(cachedMeta.materials || []);
            setOccasions(cachedMeta.occasions || []);
            setColorsMeta(cachedMeta.colors || []);
            setCrystals(cachedMeta.crystals || []);
          }
          setIsBootFetched(true);
          setIsBootLoading(false);
          return;
        }

        // Fetch all products once; we will apply client-side filters for now
        const [prodRes, cats, subs, mats, occs, cols, crysts] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchSubcategories(),
          fetchMaterials(),
          fetchOccasions(),
          fetchColors(),
          fetchCrystals(),
        ]);
        if (DEBUG_ALL_PRODUCTS) {
          console.group('AllProductsPage: API payloads');
          console.log('raw products (first 3):', Array.isArray(prodRes) ? prodRes.slice(0, 3) : prodRes);
          console.log('raw categories:', cats);
          console.log('raw subcategories (first 5):', Array.isArray(subs) ? subs.slice(0, 5) : subs);
          console.groupEnd();
        }

        // Map backend products to frontend Product card shape (including flattening variants as separate cards)
        const mapped: Product[] = [];
        (Array.isArray(prodRes) ? prodRes : []).forEach((p: any) => {
          const variants: any[] = Array.isArray(p.variants) ? [...p.variants] : [];
          const best = [...variants].sort((a: any, b: any) => {
            const av = a?.sellingPrice ?? a?.selling_price;
            const bv = b?.sellingPrice ?? b?.selling_price;
            const as = av != null ? parseFloat(String(av)) : Number.POSITIVE_INFINITY;
            const bs = bv != null ? parseFloat(String(bv)) : Number.POSITIVE_INFINITY;
            if (as !== bs) return as - bs;
            const am = a?.mrp != null ? parseFloat(String(a.mrp)) : Number.POSITIVE_INFINITY;
            const bm = b?.mrp != null ? parseFloat(String(b.mrp)) : Number.POSITIVE_INFINITY;
            if (am !== bm) return am - bm;
            const astock = typeof a?.stock === 'number' ? a.stock : -1;
            const bstock = typeof b?.stock === 'number' ? b.stock : -1;
            return bstock - astock; // desc
          })[0];

          const resolvePrice = (val: any) => (val != null ? parseFloat(String(val)) : NaN);

          // Base product price should come from the parent first, not the variant
          let selling = resolvePrice((p as any).sellingPrice ?? (p as any).selling_price ?? (p as any).price);
          let mrp = resolvePrice((p as any).mrp);

          // If parent price missing, fall back to cheapest variant
          if ((!selling || isNaN(selling) || selling <= 0) && best) {
            selling = resolvePrice(best?.sellingPrice ?? best?.selling_price);
            mrp = isNaN(mrp) || mrp === 0 ? resolvePrice(best?.mrp) : mrp;
          }

          // If selling is invalid/zero but any variant has a valid positive price, pick the cheapest positive
          if ((!selling || isNaN(selling) || selling <= 0) && Array.isArray(variants) && variants.length > 0) {
            const priced = variants
              .map((v: any) => ({ s: v?.sellingPrice ?? v?.selling_price, m: v?.mrp }))
              .map(v => ({ s: v.s != null ? parseFloat(String(v.s)) : NaN, m: v.m != null ? parseFloat(String(v.m)) : NaN }))
              .filter(v => !isNaN(v.s) && v.s > 0);
            if (priced.length > 0) {
              priced.sort((a, b) => a.s - b.s);
              selling = priced[0].s;
              if (!isNaN(priced[0].m)) {
                mrp = priced[0].m;
              }
            }
          }
          // Normalize if data entered inverted: ensure selling <= MRP when both present
          if (mrp && selling && mrp < selling) {
            const tmp = selling;
            selling = mrp;
            mrp = tmp;
          }
          const img = (best && Array.isArray(best.images) && best.images.length > 0 ? best.images[0] : undefined)
            || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '');

          const inStock = (p.status && p.status !== 'out_of_stock')
            || (best && typeof best.stock === 'number' && best.stock > 0)
            || (typeof p.stock === 'number' && p.stock > 0);

          // Best-effort mapping of optional filters
          const material = Array.isArray(p.materials) && p.materials.length > 0 ? String(p.materials[0]).trim() : undefined;
          const color = Array.isArray(p.colors) && p.colors.length > 0 ? String(p.colors[0]).trim() : undefined;
          const occasion = Array.isArray(p.occasions) && p.occasions.length > 0 ? String(p.occasions[0]).trim() : undefined;
          const sizesArr = Array.isArray((p as any).sizes) ? (p as any).sizes.map((s: any) => String(s).trim()).filter(Boolean) : [];
          const singleSize = (p as any).size ? String((p as any).size).trim() : (sizesArr[0] || undefined);
          const crystal = p.crystal_name ? String(p.crystal_name) : undefined;

          // Determine badge like homepage sliders from product/variant tags or discount
          const prodTags: string[] = Array.isArray(p.tags) ? p.tags : [];
          const variantTags: string[] = best && Array.isArray(best.tags) ? best.tags : [];
          const allTags = new Set<string>([...prodTags, ...variantTags].filter(Boolean) as string[]);
          const tagToBadge: Record<string, Product['badge']> = {
            'Featured Products': 'Featured',
            'Best Sellers': 'Best Seller',
            'New Arrival': 'New Arrivals',
            'Limited Deal': 'Limited',
            'Limited Offer': 'Limited',
            'Festive Sale': 'Festive Sale',
            'Sale': 'Sale',
          };
          let badge: Product['badge'] | undefined = undefined;
          for (const [k, v] of Object.entries(tagToBadge)) {
            if (allTags.has(k)) { badge = v; break; }
          }
          if (!badge && mrp && selling && mrp > selling) {
            badge = 'Sale';
          }
          const limitedEndsAt = (p as any).dealEndsAt ?? (p as any).limitedDealEndsAt ?? (p as any).limited_deal_ends_at ?? null;
          const isLimitedExpired = badge === 'Limited' && limitedEndsAt && new Date(limitedEndsAt).getTime() <= Date.now();
          if (isLimitedExpired) {
            if (mrp && mrp > 0) {
              selling = mrp; // show MRP as current price
              mrp = 0;
              badge = undefined;
            }
          }

          const baseProduct: Product = {
            id: Number(p.id),
            displayId: Number(p.id),
            name: String(p.name || ''),
            category: String(((p as any).mainCategory ?? (p as any).main_category) || '').trim(),
            subcategory: (() => { const sc = (p as any).subCategory ?? (p as any).sub_category; return typeof sc === 'string' ? sc.trim() : undefined; })(),
            price: Number(selling || 0),
            originalPrice: mrp ? Number(mrp) : undefined,
            imageUrl: String(img || ''),
            inStock: !!inStock,
            stock: typeof p.stock === 'number' ? p.stock : undefined,
            badge,
            metal: material,
            gemstone: crystal,
            color: color,
            colors: Array.isArray(p.colors) ? p.colors : undefined,
            size: singleSize,
            sizes: sizesArr.length ? sizesArr : undefined,
            variants: variants, // Keep variants nested
            occasion: occasion as any,
            images: Array.isArray(p.images) ? p.images : undefined,
            expiryDate: limitedEndsAt ? String(limitedEndsAt) : undefined,
          };
          mapped.push(baseProduct);

          // Flatten variants as separate cards
          variants.forEach((v: any) => {
            const variantSelling = resolvePrice(v?.sellingPrice ?? v?.selling_price);
            const variantMrp = resolvePrice(v?.mrp);
            const variantImage = Array.isArray(v?.images) && v.images.length > 0 ? v.images[0] : baseProduct.imageUrl;
            const variantBadge = badge;
            const variantColors = Array.isArray(v?.colors) ? v.colors : baseProduct.colors;
            const variantColor = Array.isArray(variantColors) && variantColors.length > 0 ? String(variantColors[0]).trim() : color;
            const variantSizes = Array.isArray(v?.sizes) ? v.sizes.map((s: any) => String(s).trim()).filter(Boolean) : baseProduct.sizes;
            mapped.push({
              ...baseProduct,
              id: Number(p.id), // keep parent id for API actions
              displayId: `v-${p.id}-${v.id ?? v.sku ?? Math.random()}`,
              parentId: Number(p.id),
              selectedVariantId: v?.id ? Number(v.id) : undefined,
              isVariantCard: true,
              name: v?.name || 'Variant',
              price: !isNaN(variantSelling) ? Number(variantSelling) : baseProduct.price,
              originalPrice: !isNaN(variantMrp) ? Number(variantMrp) : baseProduct.originalPrice,
              imageUrl: String(variantImage || baseProduct.imageUrl || ''),
              inStock: typeof v?.stock === 'number' ? v.stock > 0 : baseProduct.inStock,
              stock: typeof v?.stock === 'number' ? v.stock : baseProduct.stock,
              badge: variantBadge,
              color: variantColor,
              colors: variantColors,
              size: Array.isArray(variantSizes) && variantSizes.length > 0 ? variantSizes[0] : baseProduct.size,
              sizes: variantSizes,
              variants, // retain full list for PDP
            });
          });
        });

        // DEBUG: Inspect mapped results and key casing
        if (DEBUG_ALL_PRODUCTS) {
          console.group('AllProductsPage: mapping results');
          console.log('mapped products (first 5):', mapped.slice(0, 5));
          const sample: any = Array.isArray(prodRes) && prodRes.length > 0 ? prodRes[0] : null;
          if (sample) {
            console.log('sample raw product keys:', Object.keys(sample));
            console.log('sample variant keys:', Array.isArray(sample.variants) && sample.variants[0] ? Object.keys(sample.variants[0]) : []);
            console.log('sample mainCategory vs main_category:', sample.mainCategory, sample.main_category);
            console.log('sample sellingPrice vs selling_price:', sample.sellingPrice, sample.selling_price);
          }
          console.groupEnd();
        }

        setProducts(mapped);
        setCategories(Array.isArray(cats) ? cats : []);
        setSubcategories(Array.isArray(subs) ? subs : []);
        setMaterials(Array.isArray(mats) ? mats : []);
        setOccasions(Array.isArray(occs) ? occs : []);
        setColorsMeta(Array.isArray(cols) ? cols : []);
        setCrystals(Array.isArray(crysts) ? crysts : []);
        setIsBootFetched(true);

        // cache for future visits
        cachedProducts = mapped;
        cachedMeta = {
          categories: Array.isArray(cats) ? cats : [],
          subcategories: Array.isArray(subs) ? subs : [],
          materials: Array.isArray(mats) ? mats : [],
          occasions: Array.isArray(occs) ? occs : [],
          colors: Array.isArray(cols) ? cols : [],
          crystals: Array.isArray(crysts) ? crysts : [],
        };
        cachedBootFetched = true;
      } catch (err) {
        console.error('Failed to load products/categories:', err);
        setIsBootFetched(true);
      } finally {
        setIsBootLoading(false);
      }
    };
    load();
  }, []);


  const materialOptions = useMemo(() => Array.from(new Set(materials.map(m => m.name))).sort(), [materials]);
  const gemstoneOptions = useMemo(() => Array.from(new Set(crystals)).sort(), [crystals]);
  const occasionOptions = useMemo(() => Array.from(new Set(occasions.map(o => o.name))).sort(), [occasions]);
  const allSizes = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((p) => {
            const sizes = Array.isArray(p.sizes) ? p.sizes : [];
            const single = p.size ? [p.size] : [];
            return [...sizes, ...single].filter(Boolean);
          })
        )
      ).sort(),
    [products]
  );
  const colorOptions = useMemo(() => Array.from(new Set(colorsMeta.map(c => c.name))).sort(), [colorsMeta]);
  const discountTiers = [
      { label: 'Products With Discounts', value: 1 },
      { label: 'More than 50% off', value: 50 },
      { label: '30% off & more', value: 30 },
      { label: '20% off & more', value: 20 },
  ];
  const handleDiscountChange = (val: number) => setSelectedDiscountTier(Number(val));
  const handleDiscountReset = () => setSelectedDiscountTier(0);

  const handleClearCategoryFilters = () => {
    setSelectedMainCategoryFilters(new Set());
    setSelectedSubCategoryFilters(new Set());
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortOption('all');
    handleClearCategoryFilters();
    setSelectedMetals(new Set());
    setSelectedGemstones(new Set());
    setSelectedOccasions(new Set());
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
    setSelectedBadges(new Set());
    setSelectedDiscountTier(0);
    setShowInStockOnly(false);
    setPriceRange({ min: 0, max: maxPrice });
  };
  
  const handleSetChange = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };
  
  useEffect(() => {
    if (initialSearchQuery) {
        setSearchQuery(initialSearchQuery);
        onClearInitialSearchQuery();
    }
  }, [initialSearchQuery, onClearInitialSearchQuery]);

  useEffect(() => {
    if (initialFilters && initialFilters.length > 0) {
        resetFilters();
        initialFilters.forEach(filter => {
            if (!filter) return;
            switch(filter.type) {
                case 'category':
                    setSelectedMainCategoryFilters(prev => new Set(prev).add(filter.value));
                    break;
                case 'subcategory': 
                    setSelectedSubCategoryFilters(prev => new Set(prev).add(filter.value)); 
                    break;
                case 'material':
                    setSelectedMetals(prev => new Set(prev).add(filter.value));
                    break;
                case 'metal': setSelectedMetals(prev => new Set(prev).add(filter.value)); break;
                case 'gemstone': setSelectedGemstones(prev => new Set(prev).add(filter.value)); break;
                case 'occasion': setSelectedOccasions(prev => new Set(prev).add(filter.value)); break;
                case 'color': setSelectedColors(prev => new Set(prev).add(filter.value)); break;
                case 'badge': 
                    setSelectedBadges(prev => new Set(prev).add(filter.value));
                    if (filter.value === 'Sale') setSelectedDiscountTier(1);
                    break;
            }
        });
        onClearInitialFilters();
    }
  }, [initialFilters, onClearInitialFilters]);

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];

    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      tempProducts = tempProducts.filter(p => 
        p.name.toLowerCase().includes(lowerCaseQuery) ||
        p.category.toLowerCase().includes(lowerCaseQuery) ||
        p.subcategory?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    if (selectedMainCategoryFilters.size > 0 || selectedSubCategoryFilters.size > 0) {
        const normalize = (s: string) => s.trim().toLowerCase();
        const mainSelected = new Set(Array.from(selectedMainCategoryFilters).map(normalize));
        const subSelected = new Set(Array.from(selectedSubCategoryFilters).map(s => s.split('::')[1]).map(normalize));
        tempProducts = tempProducts.filter(p => {
            const pc = p.category ? normalize(p.category) : '';
            const ps = p.subcategory ? normalize(p.subcategory) : '';
            if (mainSelected.has(pc)) return true;
            if (ps && subSelected.has(ps)) return true;
            return false;
        });
    }

    if (showInStockOnly) tempProducts = tempProducts.filter(p => p.inStock);
    tempProducts = tempProducts.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    
    if (selectedMetals.size > 0) {
      tempProducts = tempProducts.filter((p: any) => {
        const single: string | undefined = p.metal;
        const arr: string[] = Array.isArray(p.materials) ? p.materials : [];
        if (single && selectedMetals.has(single)) return true;
        for (const m of arr) {
          if (m && selectedMetals.has(String(m))) return true;
        }
        return false;
      });
    }
    if (selectedGemstones.size > 0) tempProducts = tempProducts.filter(p => p.gemstone && selectedGemstones.has(p.gemstone));
    if (selectedOccasions.size > 0) {
      tempProducts = tempProducts.filter((p: any) => {
        const single: string | undefined = p.occasion;
        const arr: string[] = Array.isArray(p.occasions) ? p.occasions : [];
        if (single && selectedOccasions.has(single)) return true;
        for (const o of arr) {
          if (o && selectedOccasions.has(String(o))) return true;
        }
        return false;
      });
    }
    if (selectedSizes.size > 0) {
      tempProducts = tempProducts.filter((p: any) => {
        const single: string | undefined = p.size;
        const arr: string[] = Array.isArray(p.sizes) ? p.sizes : [];
        if (single && selectedSizes.has(single)) return true;
        for (const s of arr) {
          if (s && selectedSizes.has(String(s))) return true;
        }
        return false;
      });
    }
    if (selectedColors.size > 0) {
      tempProducts = tempProducts.filter((p: any) => {
        const single: string | undefined = p.color;
        const arr: string[] = Array.isArray(p.colors) ? p.colors : [];
        if (single && selectedColors.has(single)) return true;
        for (const c of arr) {
          if (c && selectedColors.has(String(c))) return true;
        }
        return false;
      });
    }

    if (selectedBadges.size > 0) {
        const wanted = new Set(Array.from(selectedBadges).map(String));
        tempProducts = tempProducts.filter(p => p.badge && wanted.has(p.badge));
    }

    if (selectedDiscountTier > 0) {
        tempProducts = tempProducts.filter(p => {
            const discount = getBestAvailableDiscountPercent(p);
            if (selectedDiscountTier === 1) return discount > 0;
            return discount >= selectedDiscountTier;
        });
    }

    switch (sortOption) {
      case 'price-asc': tempProducts.sort((a, b) => a.price - b.price); break;
      case 'price-desc': tempProducts.sort((a, b) => b.price - a.price); break;
      case 'name-asc': tempProducts.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': tempProducts.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    
    return tempProducts;
  }, [products, searchQuery, sortOption, selectedMainCategoryFilters, selectedSubCategoryFilters, showInStockOnly, priceRange, selectedMetals, selectedGemstones, selectedOccasions, selectedSizes, selectedColors, selectedBadges, selectedDiscountTier]);

  const showEmptyState = useMemo(() => {
    if (isBootLoading || !isBootFetched) return false;
    return filteredAndSortedProducts.length === 0;
  }, [isBootLoading, isBootFetched, filteredAndSortedProducts.length]);
  
  useEffect(() => {
    document.body.style.overflow = isFiltersOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isFiltersOpen]);
  
  const activeCategoryContext = useMemo(() => {
    if (selectedMainCategoryFilters.size === 1) {
      return Array.from(selectedMainCategoryFilters)[0];
    }
    if (selectedSubCategoryFilters.size > 0) {
      const firstSubCat = Array.from(selectedSubCategoryFilters)[0];
      const parts = firstSubCat.split("::");
      if (parts.length === 2) {
        return parts[0]; // stored as "<Main>::<Sub>"
      }
      const sc: any = subcategories.find(s => s.name.toLowerCase() === firstSubCat.toLowerCase());
      // Support camelCase mainCategoryName from backend renderer
      if (sc) return (sc.mainCategoryName ?? sc.main_category_name);
    }
    return null;
  }, [selectedMainCategoryFilters, selectedSubCategoryFilters, subcategories]);

  const visibleSubCategories = useMemo(() => {
    if (!activeCategoryContext) return [] as string[];
    return subcategories
      .filter((s: any) => (((s?.mainCategoryName ?? s?.main_category_name ?? '') as string).toLowerCase() === activeCategoryContext.toLowerCase()))
      .map((s: any) => s.name);
  }, [activeCategoryContext, subcategories]);

  const handleSubCatScroll = (direction: 'left' | 'right') => {
    if (subCategorySliderRef.current) {
      const { current } = subCategorySliderRef;
      const scrollAmount = current.offsetWidth * 0.7;
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const sharedFilterPanelProps: Omit<FilterPanelProps, 'idPrefix'> = {
    categories,
    getSubCategoriesFor,
    selectedMainCategoryFilters,
    selectedSubCategoryFilters,
    handleClearCategoryFilters,
    handleMainCatToggle,
    handleSubCatToggle,
    handleSimpleMainCatToggle,
    priceRange,
    maxPrice,
    priceStep,
    setPriceRange,
    selectedDiscountTier,
    discountTiers,
    handleDiscountChange,
    handleDiscountReset,
    materialOptions,
    selectedMetals,
    setSelectedMetals,
    handleSetChange,
    gemstoneOptions,
    selectedGemstones,
    setSelectedGemstones,
    occasionOptions,
    selectedOccasions,
    setSelectedOccasions,
    allSizes,
    selectedSizes,
    setSelectedSizes,
    colorOptions,
    selectedColors,
    setSelectedColors,
    showInStockOnly,
    setShowInStockOnly,
    resetFilters,
  };


  return (
    <main className="bg-white">
      <div className="bg-[#FDFBF6] border-b border-gray-200"><div className="container mx-auto px-6 py-8 text-center"><h1 className="text-4xl font-bold text-gray-800">All Jewellery</h1><p className="text-gray-600 mt-2">Explore our entire collection of exquisite, handcrafted pieces.</p></div></div>
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex">
          <aside className="hidden lg:block w-1/4 pr-8">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
              <FilterPanel idPrefix="filters-desktop" {...sharedFilterPanelProps} />
            </div>
          </aside>

          <div className="w-full lg:w-3/4">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full sm:w-auto flex items-center gap-3 flex-wrap">
                    {props.onBack && (
                      <button
                        onClick={props.onBack}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                      >
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />
                        Back to home
                      </button>
                    )}
                    <button onClick={() => setIsFiltersOpen(true)} className="lg:hidden flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-md text-sm font-semibold">
                        <FilterIcon className="w-5 h-5" />
                        <span>Filters</span>
                    </button>
                </div>
                <div className="w-full sm:w-auto flex items-center gap-4">
                    <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 sr-only sm:not-sr-only">Sort by:</label>
                    <select id="sort-by" value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-[#D4AF37] text-sm flex-grow">
                      <option value="all">Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Alphabetical: A-Z</option>
                      <option value="name-desc">Alphabetical: Z-A</option>
                    </select>
                </div>
             </div>

            {activeCategoryContext && visibleSubCategories.length > 0 && (
                <div className="relative mb-4 group">
                    <button 
                        onClick={() => handleSubCatScroll('left')} 
                        aria-label="Scroll left"
                        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div 
                        ref={subCategorySliderRef}
                        className="flex items-center space-x-3 overflow-x-auto pb-2 mx-2 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <button
                            onClick={() => handleMainCatToggle(activeCategoryContext)}
                            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                                selectedMainCategoryFilters.has(activeCategoryContext)
                                    ? 'bg-gray-800 border-gray-800 text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            All {activeCategoryContext}
                        </button>
                        {visibleSubCategories.map(subCat => (
                            <button
                                key={subCat}
                                onClick={() => handleSubCatToggle(subCat, activeCategoryContext)}
                                className={`flex-shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                                    selectedSubCategoryFilters.has(`${activeCategoryContext}::${subCat}`)
                                        ? 'bg-gray-800 border-gray-800 text-white'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {subCat}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => handleSubCatScroll('right')} 
                        aria-label="Scroll right"
                        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>
            )}

            <div className="mb-6">
                <p className="text-sm text-gray-500">
                    Showing {filteredAndSortedProducts.length} of {products.length} products
                </p>
            </div>

            {(isBootLoading || !isBootFetched || isLoading) ? (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, index) => (
                    <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map(product => (
                  <ProductCard 
                    key={product.displayId ?? product.id} 
                    product={product} 
                    isWishlisted={props.wishlistItems.some(item => item.product?.id === product.id)} 
                    isInCart={props.cartItems.some(item => item.product?.id === product.id)} 
                    onSelectProduct={props.onSelectProduct} 
                    onToggleWishlist={props.onToggleWishlist}
                    onToggleCart={props.onToggleCart}
                    onBuyNow={props.onBuyNow}
                  />
                ))}
              </div>
            ) : showEmptyState ? (
              <div className="text-center py-20 border-2 border-dashed rounded-lg bg-gray-50">
                <h3 className="text-2xl font-semibold text-gray-700">No Products Found</h3>
                <p className="text-gray-500 mt-2 mb-6">Try adjusting your search or filters to find what you're looking for.</p>
                <button onClick={resetFilters} className="bg-black text-white font-bold py-2 px-6 rounded-full hover:bg-gray-800 transition-colors">Clear Filters</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden transition-all duration-300">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity opacity-100"
            onClick={() => setIsFiltersOpen(false)}
            aria-hidden="true"
          ></div>
          <div
            className="relative w-4/5 max-w-sm h-full bg-white shadow-xl transform transition-transform ease-in-out duration-300 translate-x-0"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-lg">Filters</h2>
              <button onClick={() => setIsFiltersOpen(false)} aria-label="Close filters"><CloseIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
                <FilterPanel idPrefix="filters-mobile" {...sharedFilterPanelProps} />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-white flex gap-2">
                <button onClick={() => { resetFilters(); setIsFiltersOpen(false); }} className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md">Clear</button>
                <button onClick={() => setIsFiltersOpen(false)} className="flex-1 bg-black text-white font-bold py-2 px-4 rounded-md">Apply</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AllProductsPage;
