import React, { useEffect, useState } from 'react';
import type { Product, WishlistItem, CartItem, RichDescriptionSection } from '../types';
import ProductImageGallery from '../components/ProductImageGallery';
import ProductInfo from '../components/ProductInfo';
import ProductDetailsTabs from '../components/ProductDetailsTabs';
import RichProductDescription from '../components/RichProductDescription';
import ProductSlider from '../components/ProductSlider';
import { ChevronLeftIcon } from '../components/Icon';
import { fetchProductDetails, fetchByTag, fetchProducts as fetchProductsApi, fetchProductReviews } from '../services/apiService';

interface ProductViewPageProps {
  product: Product;
  onBack: () => void;
  wishlistItems: WishlistItem[];
  cartItems: CartItem[];
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onSelectProduct: (selection: { product: Product; variantId?: number }) => void;
  onBuyNow: (id: number) => void;
}

const FALLBACK_FEATURE_ICON = '';

const normalizeRpdBlocks = (rpd: any): RichDescriptionSection[] | undefined => {
  const blocks = Array.isArray(rpd?.content) ? rpd.content : [];
  const sections: RichDescriptionSection[] = [];

  blocks.forEach((block: any, index: number) => {
    const layout = block?.layout;
    const props = block?.props || {};
    const id = block?.id || `rpd-${index}`;

    if (layout === 'image-text') {
      if (!props.image && !props.text && !props.title) return;
      sections.push({
        id,
        type: 'image-text',
        imageUrl: props.image || '',
        title: props.title || '',
        text: props.text || '',
        imagePosition: props.imagePosition === 'right' ? 'right' : 'left',
      });
      return;
    }

    if (layout === 'feature-list') {
      const features = Array.isArray(props.features) ? props.features : [];
      if (features.length === 0) return;
      sections.push({
        id,
        type: 'three-column',
        columns: features.slice(0, 3).map((feature: any, featureIndex: number) => ({
          iconUrl: feature?.iconUrl || feature?.icon || FALLBACK_FEATURE_ICON,
          title: feature?.title || `Feature ${featureIndex + 1}`,
          text: feature?.text || '',
        })),
      });
      return;
    }

    if (layout === 'banner') {
      if (!props.image && !props.title && !props.text) return;
      sections.push({
        id,
        type: 'banner',
        imageUrl: props.image || '',
        title: props.title || props.text || '',
      });
    }
  });

  return sections.length > 0 ? sections : undefined;
};

const ProductViewPage: React.FC<ProductViewPageProps> = (props) => {
  const { product, onBack, wishlistItems, cartItems, onToggleWishlist, onToggleCart, onBuyNow } = props;

  const [fullProduct, setFullProduct] = useState<Product>(product);
  const [suggested, setSuggested] = useState<Product[]>([]);
  const [activeVariantId, setActiveVariantId] = useState<number | undefined>(product.selectedVariantId);

  const collectAllColors = (base: any, variants: any[]): string[] => {
    const map = new Map<string, string>();
    const push = (val: any) => {
      if (!val) return;
      const label = String(val).trim();
      if (!label) return;
      const key = label.toLowerCase();
      if (!map.has(key)) map.set(key, label);
    };
    if (base) {
      (Array.isArray(base.colors) ? base.colors : []).forEach(push);
      if ((base as any).color) push((base as any).color);
    }
    (Array.isArray(variants) ? variants : []).forEach((v) => {
      (Array.isArray(v?.colors) ? v.colors : []).forEach(push);
      if ((v as any)?.color) push((v as any).color);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const api = await fetchProductDetails((product as any).parentId ?? product.id);
        if (cancelled) return;
        // Merge API detail into UI product shape
        const numOrNull = (v: any): number | null => {
          if (v === undefined || v === null || v === '') return null;
          const n = typeof v === 'number' ? v : parseFloat(String(v));
          return isNaN(n) ? null : n;
        };
        const intOrNull = (v: any): number | null => {
          if (v === undefined || v === null || v === '') return null;
          const n = typeof v === 'number' ? Math.trunc(v) : parseInt(String(v), 10);
          return isNaN(n) ? null : n;
        };
         const richDescription = normalizeRpdBlocks((api as any)?.rpd);
         const normalizeDiscounts = (incoming: any): Discount[] => {
           const raw: any[] = Array.isArray(incoming) ? incoming : [];
           return raw.map((d, idx) => {
             const type = d?.type === 'fixed' ? 'flat' : (d?.type === 'percentage' ? 'percentage' : (d?.type ?? 'percentage'));
            const valNum = (() => {
              const v = d?.value;
              const n = typeof v === 'number' ? v : parseFloat(String(v));
              return isNaN(n) ? 0 : n;
            })();
            const desc =
              type === 'flat'
                ? `Flat ₹${valNum} off`
                : `Save ${valNum}%`;
            return {
              id: Number(d?.id ?? idx),
              code: String(d?.code ?? d?.name ?? `DISC-${idx}`),
              description: String(d?.description ?? desc),
              value: valNum,
              type,
            };
          });
        };

        const reviews = await fetchProductReviews(product.id);
        const limitedEndsAt =
          (api as any)?.limited_deal_ends_at ??
          (api as any)?.limitedDealEndsAt ??
          (api as any)?.dealEndsAt ?? 
          (product as any)?.expiryDate ?? 
          (product as any)?.dealEndsAt;

        const variants = Array.isArray((api as any)?.variants)
          ? (api as any).variants
          : (Array.isArray(product.variants) ? product.variants : []);
        const allColors = collectAllColors({ ...product, ...api }, variants);
        const baseColor =
          allColors.length > 0
            ? allColors[0]
            : ((api as any)?.color ?? (product as any)?.color);

        const merged: Product = {
          ...product,
          ...api,
          variants,
          // Prefer API values; support both snake_case (DRF default) and camelCase (via camelCase renderer)
          price: Number((api as any)?.selling_price ?? (api as any)?.sellingPrice ?? product.price ?? 0),
          originalPrice: (api as any)?.mrp !== undefined ? Number((api as any).mrp) : product.originalPrice,
          imageUrl: (api?.images && api.images.length > 0) ? api.images[0] : product.imageUrl,
          category: (api as any)?.main_category ?? (api as any)?.mainCategory ?? product.category,
          subcategory: (api as any)?.sub_category ?? (api as any)?.subCategory ?? product.subcategory,
          stock: api?.stock ?? product.stock,
          images: api?.images ?? product.images,
          sizes: Array.isArray((api as any)?.sizes)
            ? (api as any).sizes
            : (api as any)?.size
              ? [(api as any).size]
              : product.sizes,
          discounts: normalizeDiscounts((api as any)?.active_discounts ?? (api as any)?.activeDiscounts ?? product.discounts),
          richDescription: richDescription,
          reviews,
          expiryDate: limitedEndsAt ? String(limitedEndsAt) : undefined,
          // Delivery info normalized from DB
          delivery_weight: numOrNull((api as any)?.delivery_weight ?? (api as any)?.deliveryWeight),
          delivery_width:  numOrNull((api as any)?.delivery_width  ?? (api as any)?.deliveryWidth),
          delivery_height: numOrNull((api as any)?.delivery_height ?? (api as any)?.deliveryHeight),
          delivery_depth:  numOrNull((api as any)?.delivery_depth  ?? (api as any)?.deliveryDepth),
          delivery_days:   intOrNull((api as any)?.delivery_days   ?? (api as any)?.deliveryDays),
          delivery_charges: numOrNull((api as any)?.delivery_charges ?? (api as any)?.deliveryCharges),
          return_charges:   numOrNull((api as any)?.return_charges   ?? (api as any)?.returnCharges),
          colors: allColors.length > 0 ? allColors : ((api as any)?.colors ?? product.colors),
          color: baseColor ? String(baseColor) : undefined,
        } as Product;

        // If a specific variant was selected, override display fields with that variant
        const selectedVariant = merged.variants?.find(v => v.id === product.selectedVariantId);
        const mergedWithVariant: Product = selectedVariant
          ? {
              ...merged,
              name: selectedVariant.name || merged.name,
              price: Number((selectedVariant as any)?.selling_price ?? (selectedVariant as any)?.sellingPrice ?? merged.price ?? 0),
              originalPrice: (selectedVariant as any)?.mrp !== undefined ? Number((selectedVariant as any).mrp) : merged.originalPrice,
              stock: (selectedVariant as any)?.stock ?? merged.stock,
              imageUrl: Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
                ? selectedVariant.images[0]
                : merged.imageUrl,
              colors: merged.colors ?? allColors,
              color: (() => {
                const variantColors = Array.isArray((selectedVariant as any).colors) ? (selectedVariant as any).colors : [];
                if (variantColors.length > 0) return String(variantColors[0]);
                if ((selectedVariant as any).color) return String((selectedVariant as any).color);
                if (merged.colors && merged.colors.length > 0) return String(merged.colors[0]);
                return merged.color;
              })(),
              sizes: Array.isArray((selectedVariant as any).sizes) ? (selectedVariant as any).sizes : merged.sizes,
              size: Array.isArray((selectedVariant as any).sizes) && (selectedVariant as any).sizes.length > 0
                ? String((selectedVariant as any).sizes[0])
                : merged.size,
              selectedVariantId: product.selectedVariantId,
            }
          : merged;

        const finalProduct: Product = {
          ...mergedWithVariant,
          colors: mergedWithVariant.colors ?? allColors,
          color: mergedWithVariant.color ?? (allColors.length > 0 ? String(allColors[0]) : undefined),
        };

        setFullProduct(finalProduct);
        setActiveVariantId(product.selectedVariantId);
        try {
          sessionStorage.setItem('lastViewedProduct', JSON.stringify(finalProduct));
          sessionStorage.setItem('lastPage', 'product');
        } catch (err) {
          console.error('Failed to persist product detail to sessionStorage', err);
        }

        // Map backend suggested products (if present) to UI Product shape
        const mapSuggested = (p: any): Product => {
          const variants = Array.isArray(p?.variants) ? [...p.variants] : [];
          const best = variants.sort((a: any, b: any) => {
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

          let selling = best && ((best as any).sellingPrice ?? (best as any).selling_price) != null
            ? parseFloat(String((best as any).sellingPrice ?? (best as any).selling_price))
            : (p?.sellingPrice != null
                ? parseFloat(String(p.sellingPrice))
                : (p?.selling_price != null ? parseFloat(String(p.selling_price)) : 0));
          let mrp = best && best.mrp != null
            ? parseFloat(String(best.mrp))
            : (p?.mrp != null ? parseFloat(String(p.mrp)) : 0);

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

          // Find the first valid image URL, or return undefined if none exist.
          const img = (best && Array.isArray(best.images) && best.images.length > 0 ? best.images[0] : null)
            || (Array.isArray(p?.images) && p.images.length > 0 ? p.images[0] : null);

          const inStock = (p?.status && p.status !== 'out_of_stock')
            || (best && typeof best.stock === 'number' && best.stock > 0)
            || (typeof p?.stock === 'number' && p.stock > 0);

          const category = String(((p as any).mainCategory ?? (p as any).main_category) || '').trim();
          const subcategory = (() => { const sc = (p as any).subCategory ?? (p as any).sub_category; return typeof sc === 'string' ? sc.trim() : undefined; })();

          return {
            id: Number(p.id),
            name: String(p.name || ''),
            category,
            subcategory,
            price: Number(selling || 0),
            originalPrice: mrp ? Number(mrp) : undefined,
            imageUrl: img || undefined, // Pass undefined if img is null or empty
            inStock: !!inStock,
            stock: typeof p?.stock === 'number' ? p.stock : undefined,
            images: Array.isArray(p?.images) ? p.images : undefined,
          } as Product;
        };

        const rawSuggested: any[] = Array.isArray((api as any)?.suggested) ? (api as any).suggested : [];
        const mappedSuggested: Product[] = rawSuggested.map(mapSuggested).filter(p => p.id !== merged.id);
        setSuggested(mappedSuggested);

        // Fallbacks if backend provides no suggestions
        if (!mappedSuggested || mappedSuggested.length === 0) {
          let fallback: any[] = [];
          const tags: string[] = Array.isArray((merged as any).tags) ? (merged as any).tags : [];
          try {
            if (tags.length > 0) {
              const byTagRes = await fetchByTag(tags[0], 12);
              fallback = Array.isArray(byTagRes) ? byTagRes : [];
            }
          } catch (_e) { /* ignore */ }

          if ((!fallback || fallback.length === 0) && merged.category) {
            try {
              const byCatRes = await fetchProductsApi({ category: merged.category });
              fallback = Array.isArray(byCatRes) ? byCatRes : [];
            } catch (_e) { /* ignore */ }
          }

          const mappedFallback: Product[] = (fallback || [])
            .filter((p: any) => p && Number(p.id) !== merged.id)
            .map(mapSuggested)
            .slice(0, 12);
          if (mappedFallback.length > 0) setSuggested(mappedFallback);
        }
      } catch (e) {
        console.warn('Failed to fetch product detail; using fallback product.', e);
        setFullProduct(product);
        setSuggested([]);
      }
    };
    load();
    return () => { cancelled = true; setActiveVariantId(undefined); };
  }, [product.id]);

  const dedupeById = (list: Product[]) => {
    const seen = new Set<number>();
    const result: Product[] = [];
    list.forEach((p) => {
      if (!p || seen.has(p.id) || p.id === fullProduct.id) return;
      seen.add(p.id);
      result.push(p);
    });
    return result;
  };

  const mergedSuggestions = dedupeById([...(suggested ?? [])]);
  const suggestedProducts = mergedSuggestions.slice(0, Math.min(20, mergedSuggestions.length)); // show all available up to 20

  return (
    <main className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ChevronLeftIcon className="w-5 h-5 mr-1" />
          Back to collections
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <ProductImageGallery product={fullProduct} activeVariantId={activeVariantId} alt={fullProduct.name} />
          </div>
          <div>
            <ProductInfo
              product={fullProduct}
              // ✅ Correctly check for the product ID within the nested product object.
              isWishlisted={wishlistItems.some(item => item.product?.id === fullProduct.id)}
              isInCart={cartItems.some(item => item.product?.id === fullProduct.id)}
              activeVariantId={activeVariantId}
              onVariantSelect={setActiveVariantId}
              onToggleWishlist={onToggleWishlist}
              onToggleCart={onToggleCart}
              onBuyNow={onBuyNow}
            />
          </div>
        </div>
      </div>
      
      {/* On mobile, show tabs below the main product section. On desktop, they are inside ProductInfo. */}
      <div className="lg:hidden py-12 bg-[#FDFBF6]">
        <ProductDetailsTabs product={fullProduct} />
      </div>

      {fullProduct.richDescription && (
        <div className="py-12 bg-white">
          <RichProductDescription sections={fullProduct.richDescription} />
        </div>
      )}

      <div className="bg-[#FDFBF6]">
         <ProductSlider
            title="You Might Also Like"
            subtitle="Complete the look with these curated pieces."
            products={suggestedProducts}
            cardSize="small"
            {...props}
         />
      </div>
    </main>
  );
};

export default ProductViewPage;
