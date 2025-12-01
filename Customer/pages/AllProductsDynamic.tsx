import React, { useEffect, useMemo, useState } from 'react';
import type { Product, WishlistItem, CartItem, MegaMenuLink } from '../types';
import ProductCard from '../components/ProductCard';
import { SearchIcon, FilterIcon, CloseIcon } from '../components/Icon';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { fetchProducts } from '../services/apiService';
import { getBestAvailableDiscountPercent } from '../utils/pricing';

type Filter = MegaMenuLink['filter'];

interface AllProductsPageProps {
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: (id: number) => void;
  initialFilters: Filter[] | null;
  onClearInitialFilters: () => void;
  initialSearchQuery: string | null;
  onClearInitialSearchQuery: () => void;
}

// Map backend ProductList item -> UI Product card shape
const mapApiProductToUi = (p: any): Product => {
  const imageUrl = (p.images && p.images.length > 0) ? p.images[0] : '';
  const category = p.main_category || '';
  const subcategory = p.sub_category || '';
  const price = Number(p.selling_price || p.mrp || 0);
  const originalPrice = p.mrp ? Number(p.mrp) : undefined;
  const inStock = p.status !== 'out_of_stock';
  return {
    id: p.id,
    name: p.name,
    category,
    subcategory,
    price,
    originalPrice,
    imageUrl,
    inStock,
    // best-effort extras for filters/search
    metal: (p.materials && p.materials[0]) || undefined,
    gemstone: p.crystal_name || undefined,
    color: (p.colors && p.colors[0]) || undefined,
    occasion: (p.occasions && p.occasions[0]) || undefined,
    stock: p.stock,
    images: p.images,
  } as Product;
};

const AllProductsDynamic: React.FC<AllProductsPageProps> = (props) => {
  const { wishlistItems, cartItems, onToggleWishlist, onToggleCart, onSelectProduct, onBuyNow,
    initialFilters, onClearInitialFilters, initialSearchQuery, onClearInitialSearchQuery } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortOption, setSortOption] = useState<'all' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('all');
  const [items, setItems] = useState<Product[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [activeMainCategory, setActiveMainCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set()); // subcategories
  const [selectedMetals, setSelectedMetals] = useState<Set<string>>(new Set());
  const [selectedGemstones, setSelectedGemstones] = useState<Set<string>>(new Set());
  const [selectedOccasions, setSelectedOccasions] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedDiscountTier, setSelectedDiscountTier] = useState<number>(0);
  const maxPrice = useMemo(() => {
    const values = items.map(p => (p.originalPrice || p.price) || 0);
    return values.length ? Math.ceil(Math.max(...values) / 1000) * 1000 : 0;
  }, [items]);
  const [priceRange, setPriceRange] = useState<{min:number;max:number}>({ min: 0, max: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchProducts();
        const mapped = Array.isArray(res) ? res.map(mapApiProductToUi) : [];
        setItems(mapped);
      } catch (e) {
        console.error('Failed to load products', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // initialize price range when items loaded
    setPriceRange({ min: 0, max: maxPrice });
  }, [maxPrice]);

  useEffect(() => {
    if (initialSearchQuery) {
      setQuery(initialSearchQuery);
      onClearInitialSearchQuery();
    }
  }, [initialSearchQuery, onClearInitialSearchQuery]);

  useEffect(() => {
    if (initialFilters && initialFilters.length > 0) {
      initialFilters.forEach(f => {
        switch (f.type) {
          case 'category':
            setActiveMainCategory(f.value);
            break;
          case 'subcategory': {
            setSelectedCategories(prev => new Set(prev).add(f.value));
            break;
          }
          case 'material':
            setSelectedMetals(prev => new Set(prev).add(f.value));
            break;
          case 'color':
            setSelectedColors(prev => new Set(prev).add(f.value));
            break;
          case 'badge':
          default:
            setQuery(f.value);
            break;
        }
      });
      onClearInitialFilters();
    }
  }, [initialFilters, onClearInitialFilters]);

  const allMainCategories = useMemo(() => Array.from(new Set(items.map(p => p.category).filter(Boolean))).sort(), [items]);
  const allSubCategories = useMemo(() => Array.from(new Set(items
    .filter(p => !activeMainCategory || p.category === activeMainCategory)
    .map(p => p.subcategory)
    .filter(Boolean) as string[])).sort(), [items, activeMainCategory]);
  const allMetals = useMemo(() => Array.from(new Set(items.map(p => p.metal).filter(Boolean) as string[])).sort(), [items]);
  const allGemstones = useMemo(() => Array.from(new Set(items.map(p => p.gemstone).filter(Boolean) as string[])).sort(), [items]);
  const allOccasions = useMemo(() => Array.from(new Set(items.map(p => p.occasion).filter(Boolean) as string[])).sort(), [items]);
  const allColors = useMemo(() => Array.from(new Set(items.map(p => p.color).filter(Boolean) as string[])).sort(), [items]);

  const handleSetToggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items
      .filter(p => !onlyInStock || !!p.inStock)
      .filter(p => q === '' ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.metal && p.metal.toLowerCase().includes(q)) ||
        (p.gemstone && p.gemstone.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q)) ||
        (p.occasion && p.occasion.toLowerCase().includes(q))
      )
      .filter(p => !activeMainCategory || p.category === activeMainCategory)
      .filter(p => selectedCategories.size === 0 || (p.subcategory && selectedCategories.has(p.subcategory)))
      .filter(p => selectedMetals.size === 0 || (p.metal && selectedMetals.has(p.metal)))
      .filter(p => selectedGemstones.size === 0 || (p.gemstone && selectedGemstones.has(p.gemstone)))
      .filter(p => selectedOccasions.size === 0 || (p.occasion && selectedOccasions.has(p.occasion)))
      .filter(p => selectedColors.size === 0 || (p.color && selectedColors.has(p.color)))
      .filter(p => (p.originalPrice || p.price) >= priceRange.min && (p.originalPrice || p.price) <= priceRange.max)
      .filter(p => {
        if (selectedDiscountTier === 0) return true;
        const discount = getBestAvailableDiscountPercent(p);
        if (selectedDiscountTier === 1) return discount > 0;
        return discount >= selectedDiscountTier;
      });

    switch (sortOption) {
      case 'price-asc': list = list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = list.sort((a, b) => b.price - a.price); break;
      case 'name-asc': list = list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': list = list.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: list = list.sort((a, b) => a.id - b.id); break;
    }
    return list;
  }, [items, query, onlyInStock, activeMainCategory, selectedCategories, selectedMetals, selectedGemstones, selectedOccasions, selectedColors, priceRange, selectedDiscountTier, sortOption]);

  return (
    <main className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">All Products</h1>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-gray-300"
              />
              <SearchIcon className="w-5 h-5 absolute left-2 top-2.5 text-gray-400" />
            </div>
            <button className="md:hidden inline-flex items-center px-3 py-2 border rounded-md text-sm" onClick={() => setFiltersOpen(true)}>
              <FilterIcon className="w-4 h-4 mr-2" /> Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters */}
          <aside className={`md:col-span-1 ${filtersOpen ? 'block' : 'hidden md:block'}`}>
            <div className="md:sticky md:top-4 bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between md:block">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button className="md:hidden" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort by</label>
                  <select value={sortOption} onChange={e => setSortOption(e.target.value as any)} className="w-full border rounded px-2 py-1">
                    <option value="all">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">In Stock</label>
                    <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    <button onClick={() => setActiveMainCategory(null)} className={`text-sm block text-left w-full ${activeMainCategory === null ? 'font-semibold' : ''}`}>All</button>
                    {allMainCategories.map(cat => (
                      <button key={cat} onClick={() => setActiveMainCategory(cat)} className={`text-sm block text-left w-full ${activeMainCategory === cat ? 'font-semibold' : ''}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subcategory</label>
                  <div className="space-y-1 max-h-48 overflow-auto pr-1">
                    {allSubCategories.length === 0 && <div className="text-xs text-gray-500">No subcategories</div>}
                    {allSubCategories.map(sc => (
                      <label key={sc} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={selectedCategories.has(sc)} onChange={() => handleSetToggle(setSelectedCategories, sc)} />
                        <span>{sc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {allMetals.map(m => (
                      <label key={m} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={selectedMetals.has(m)} onChange={() => handleSetToggle(setSelectedMetals, m)} />
                        <span>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gemstone</label>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {allGemstones.map(g => (
                      <label key={g} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={selectedGemstones.has(g)} onChange={() => handleSetToggle(setSelectedGemstones, g)} />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Occasion</label>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {allOccasions.map(o => (
                      <label key={o} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={selectedOccasions.has(o)} onChange={() => handleSetToggle(setSelectedOccasions, o)} />
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="space-y-1 max-h-40 overflow-auto pr-1">
                    {allColors.map(c => (
                      <label key={c} className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" checked={selectedColors.has(c)} onChange={() => handleSetToggle(setSelectedColors, c)} />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <input type="number" className="w-1/2 border rounded px-2 py-1" value={priceRange.min} min={0} max={priceRange.max} onChange={e => setPriceRange(r => ({ ...r, min: Number(e.target.value || 0) }))} />
                    <span>-</span>
                    <input type="number" className="w-1/2 border rounded px-2 py-1" value={priceRange.max} min={priceRange.min} onChange={e => setPriceRange(r => ({ ...r, max: Number(e.target.value || 0) }))} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Discount</label>
                  <select className="w-full border rounded px-2 py-1" value={selectedDiscountTier} onChange={e => setSelectedDiscountTier(Number(e.target.value))}>
                    <option value={0}>Any</option>
                    <option value={1}>With discount</option>
                    <option value={20}>20% and above</option>
                    <option value={30}>30% and above</option>
                    <option value={50}>50% and above</option>
                  </select>
                </div>

                <div className="flex justify-between">
                  <button className="text-sm text-gray-600 hover:text-red-500" onClick={() => {
                    setActiveMainCategory(null);
                    setSelectedCategories(new Set());
                    setSelectedMetals(new Set());
                    setSelectedGemstones(new Set());
                    setSelectedOccasions(new Set());
                    setSelectedColors(new Set());
                    setSelectedDiscountTier(0);
                    setOnlyInStock(false);
                    setPriceRange({ min: 0, max: maxPrice });
                  }}>Reset</button>
                  <button className="md:hidden text-sm text-white bg-black px-3 py-1 rounded" onClick={() => setFiltersOpen(false)}>Apply</button>
                </div>
              </div>
            </div>
          </aside>

          {/* Products */}
          <section className="md:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlistItems.some(w => w.productId === product.id)}
                    isInCart={cartItems.some(c => c.productId === product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onToggleCart={onToggleCart}
                    onSelectProduct={onSelectProduct}
                    onBuyNow={onBuyNow}
                  />)
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default AllProductsDynamic;
