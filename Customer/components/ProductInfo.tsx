import React, { useState, useMemo, useEffect } from 'react';
import type { Product, Discount } from '../types';
import { HeartIcon, ShieldCheckIcon, ShareIcon, CheckIcon } from './Icon';
import ProductDetailsTabs from './ProductDetailsTabs';

interface ProductInfoProps {
  product: Product;
  isWishlisted: boolean;
  isInCart: boolean;
  activeVariantId?: number;
  onVariantSelect?: (variantId: number | undefined) => void;
  onToggleWishlist: (id: number) => void;
  onToggleCart: (id: number) => void;
  onBuyNow: (id: number) => void;
}

const badgeColorClasses: Record<string, string> = {
  'New': 'bg-sky-500 text-white',
  'Sale': 'bg-red-500 text-white',
  'Best Seller': 'bg-indigo-600 text-white',
  'Limited': 'bg-orange-500 text-white',
  'Featured': 'bg-rose-600 text-white',
  'Festive Sale': 'bg-emerald-500 text-white',
};

const StockStatus = ({ stock = 0 }: { stock?: number }) => {
  if (stock === 0) {
    return <span className="text-sm font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">Out of Stock</span>;
  }
  if (stock <= 10) {
    return <span className="text-sm font-semibold text-red-600">Only {stock} units left!</span>;
  }
  return <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">In Stock</span>;
};


const ProductInfo: React.FC<ProductInfoProps> = ({ product, isWishlisted, isInCart, activeVariantId, onVariantSelect, onToggleWishlist, onToggleCart, onBuyNow }) => {
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [showAllDiscounts, setShowAllDiscounts] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [now, setNow] = useState<number>(Date.now());
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const normalizeString = (val?: string | null) => val ? String(val).trim().toLowerCase() : "";

  const activeVariant = useMemo(
    () => product.variants?.find(v => v.id === activeVariantId),
    [product.variants, activeVariantId]
  );
  const currentVariantId = activeVariantId ?? product.selectedVariantId;

  const colorOptions = useMemo(() => {
    const map = new Map<string, string>(); // key: normalized, value: display label (first occurrence)
    const pushColor = (val: any) => {
      if (!val) return;
      const label = String(val).trim();
      if (!label) return;
      const key = normalizeString(label);
      if (!map.has(key)) map.set(key, label);
    };
    (product.colors || []).forEach(pushColor);
    if ((product as any).color) pushColor((product as any).color);
    (product.variants || []).forEach((v) => {
      (Array.isArray(v.colors) ? v.colors : []).forEach(pushColor);
      pushColor((v as any).color);
    });
    return Array.from(map.values());
  }, [product.colors, product.variants, (product as any).color]);

  const collectSizes = (source: any) => {
    const sizes = Array.isArray(source?.sizes) ? source.sizes : [];
    const single = (source as any)?.size;
    return [...sizes, single].map((s) => String(s ?? "").trim()).filter(Boolean);
  };

  const matchesColor = (entity: any, color?: string | null) => {
    const colors = (Array.isArray(entity?.colors) ? entity.colors : []).map((c: any) =>
      normalizeString(String(c))
    );
    if ((entity as any)?.color) colors.push(normalizeString((entity as any).color));
    const target = normalizeString(color);
    return target ? colors.includes(target) : false;
  };

  const sizeOptions = useMemo(() => {
    const unique = (list: string[]) =>
      Array.from(new Set(list.map((s) => String(s).trim()).filter(Boolean)));

    const variantSizesForColor =
      selectedColor && Array.isArray(product.variants)
        ? product.variants
            .filter((v) => matchesColor(v, selectedColor))
            .flatMap((v) => collectSizes(v))
        : [];

    if (variantSizesForColor.length > 0) {
      return unique(variantSizesForColor);
    }

    if (activeVariant) {
      const sizes = collectSizes(activeVariant);
      if (sizes.length > 0) return unique(sizes);
    }

    if (selectedColor && matchesColor(product, selectedColor)) {
      const baseSizes = collectSizes(product);
      if (baseSizes.length > 0) return unique(baseSizes);
    }

    return unique(collectSizes(product));
  }, [product, activeVariant, selectedColor]);
  
  const effectiveStock = typeof activeVariant?.stock === "number" ? activeVariant.stock : product.stock;
  const isOutOfStock = effectiveStock === 0;
  const limitedEndsAt = product.expiryDate || (product as any).dealEndsAt || null;
  const isLimitedBadge = product.badge === 'Limited';
  const isLimitedExpired = isLimitedBadge && limitedEndsAt ? new Date(limitedEndsAt).getTime() <= now : false;

  useEffect(() => {
    if (!limitedEndsAt || !isLimitedBadge) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [limitedEndsAt, isLimitedBadge]);

  // Debug logs for pricing and state changes
  useEffect(() => {
    console.log('[ProductInfo] product loaded', {
      id: product.id,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
    });
  }, [product.id, product.price, product.originalPrice, product.stock]);

  useEffect(() => {
    if (activeVariant) {
      const vc = Array.isArray(activeVariant.colors) && activeVariant.colors.length > 0
        ? String(activeVariant.colors[0])
        : (activeVariant as any).color
          ? String((activeVariant as any).color)
          : null;
      const vs = Array.isArray(activeVariant.sizes) && activeVariant.sizes.length > 0
        ? String(activeVariant.sizes[0])
        : (activeVariant as any).size
          ? String((activeVariant as any).size)
          : null;
      setSelectedColor(vc);
      setSelectedSize(vs);
    } else {
      // default to base product’s first color/size if any
      const baseColor =
        Array.isArray(product.colors) && product.colors.length > 0
          ? String(product.colors[0])
          : (product as any).color
            ? String((product as any).color)
            : null;
      const baseSize =
        Array.isArray(product.sizes) && product.sizes.length > 0
          ? String(product.sizes[0])
          : (product as any).size
            ? String((product as any).size)
            : null;
      setSelectedColor(baseColor);
      setSelectedSize(baseSize);
    }
  }, [activeVariantId, product.id, activeVariant, product.colors, product.sizes, (product as any).color, (product as any).size]);

  useEffect(() => {
    console.log('[ProductInfo] quantity changed', { quantity });
  }, [quantity]);

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (typeof effectiveStock === "number" && newQuantity > effectiveStock) return effectiveStock;
      return newQuantity;
    });
  }

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleShare = () => {
    if (isLinkCopied) return; // Prevent multiple clicks while animation is running

    // Construct a clean URL without any existing query parameters
    const slug = product?.name ? toSlug(product.name) : `product-${product.id}`;
    const productUrl = `${window.location.origin}/product/${product.id}-${slug}`;
    
    navigator.clipboard.writeText(productUrl).then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy product link.');
    });
  };

  const findVariantFor = (color?: string | null, size?: string | null) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (!variants.length) return null;
    const normColor = normalizeString(color);
    const normSize = normalizeString(size);

    // Require both color and size to match when both are provided to avoid switching to incompatible variants
    if (normColor || normSize) {
      const both = variants.filter(v => {
        const colors = (Array.isArray(v.colors) ? v.colors : []).map(normalizeString);
        if ((v as any).color) colors.push(normalizeString((v as any).color));
        const sizes = (Array.isArray(v.sizes) ? v.sizes : []).map(normalizeString);
        if ((v as any).size) sizes.push(normalizeString((v as any).size));
        const colorOk = normColor ? colors.includes(normColor) : true;
        const sizeOk = normSize ? sizes.includes(normSize) : true;
        return colorOk && sizeOk;
      });
      if (both.length) return both[0];
    }

    if (normColor && !normSize) {
      const byColorOnly = variants.filter(v => {
        const colors = (Array.isArray(v.colors) ? v.colors : []).map(normalizeString);
        if ((v as any).color) colors.push(normalizeString((v as any).color));
        return colors.includes(normColor);
      });
      if (byColorOnly.length) return byColorOnly[0];
    }

    if (normSize && !normColor) {
      const bySizeOnly = variants.filter(v => {
        const sizes = (Array.isArray(v.sizes) ? v.sizes : []).map(normalizeString);
        if ((v as any).size) sizes.push(normalizeString((v as any).size));
        return sizes.includes(normSize);
      });
      if (bySizeOnly.length) return bySizeOnly[0];
    }

    // No match -> stay on base product
    return null;
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const target = findVariantFor(color, selectedSize);
    if (target?.id) {
      onVariantSelect?.(Number(target.id));
    } else {
      onVariantSelect?.(undefined);
    }
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const target = findVariantFor(selectedColor, size);
    if (target?.id) {
      onVariantSelect?.(Number(target.id));
    } else {
      onVariantSelect?.(undefined);
    }
  };

  const variantPrice = activeVariant
    ? Number((activeVariant as any).selling_price ?? (activeVariant as any).sellingPrice ?? product.price ?? 0)
    : product.price ?? 0;
  const variantMrp = activeVariant
    ? (activeVariant as any).mrp !== undefined
      ? Number((activeVariant as any).mrp)
      : product.originalPrice
    : product.originalPrice;

  const rawPrice = variantPrice || 0;
  const rawOriginal = variantMrp ?? product.originalPrice;
  const displayPrice = isLimitedExpired && rawOriginal ? rawOriginal : rawPrice;
  const displayOriginal = isLimitedExpired ? undefined : rawOriginal;
  const hasInitialDiscount = displayOriginal && displayOriginal > displayPrice;
  const initialDiscountPercent = hasInitialDiscount ? Math.round(((displayOriginal! - displayPrice) / displayOriginal!) * 100) : 0;

  const finalPrice = useMemo(() => {
    let price = displayPrice;
    if (appliedDiscount) {
      if (appliedDiscount.type === 'percentage') {
        price = price * (1 - appliedDiscount.value / 100);
      } else if (appliedDiscount.type === 'flat') {
        price = Math.max(0, price - appliedDiscount.value);
      }
    }
    return price * quantity;
  }, [displayPrice, appliedDiscount, quantity]);

  useEffect(() => {
    console.log('[ProductInfo] finalPrice recalculated', {
      finalPrice,
      quantity,
      appliedDiscount,
    });
  }, [finalPrice, quantity, appliedDiscount]);

  const badgeClass = product.badge ? badgeColorClasses[product.badge] || 'bg-gray-500 text-white' : '';
  
  const availableDiscounts = product.discounts || [];
  const canCollapseDiscounts = availableDiscounts.length > 2;
  const discountsToShow = canCollapseDiscounts && !showAllDiscounts ? availableDiscounts.slice(0, 2) : availableDiscounts;


  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-3">
        {product.badge && (
          <span className={`${badgeClass} text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider`}>
            {product.badge}
          </span>
        )}
        <span className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</span>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900">
        {currentVariantId ? (product.name || 'Variant') : product.name}
      </h1>
      
      <div className="flex items-center space-x-4">
        <StockStatus stock={effectiveStock} />
      </div>

      {colorOptions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold">Colors:</span>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((c) => (
              <button
                key={c}
                onClick={() => handleColorSelect(c)}
                className={`px-3 py-1 rounded-full text-sm border ${selectedColor === c ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-black'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
        <span className="font-semibold">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="px-3 py-2 text-lg disabled:opacity-50">-</button>
          <span className="px-4 py-2 font-bold">{quantity}</span>
          <button onClick={() => handleQuantityChange(1)} disabled={isOutOfStock || (typeof effectiveStock === "number" && quantity >= effectiveStock)} className="px-3 py-2 text-lg disabled:opacity-50">+</button>
        </div>
      </div>

      {sizeOptions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold">Sizes:</span>
          <div className="flex gap-2 flex-wrap">
            {sizeOptions.map((s) => (
              <button
                key={s}
                onClick={() => handleSizeSelect(s)}
                className={`px-3 py-1 rounded-full text-sm border ${selectedSize === s ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-black'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}


      <div className="flex items-baseline flex-wrap gap-x-3">
        <p className="text-3xl font-bold text-gray-900">₹{finalPrice.toLocaleString('en-IN')}</p>
        {hasInitialDiscount && (
          <>
            <p className="text-lg text-gray-400 line-through">MRP: ₹{(displayOriginal! * quantity).toLocaleString('en-IN')}</p>
            <p className="text-lg font-semibold text-red-500">
              ({initialDiscountPercent}% OFF)
            </p>
          </>
        )}
      </div>

      {isLimitedBadge && limitedEndsAt && (
        <div className={`p-3 rounded-md text-sm ${isLimitedExpired ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-800 border border-orange-100'}`}>
          {isLimitedExpired ? (
            <span>This limited deal has ended. Showing original MRP.</span>
          ) : (
            <Countdown expiryDate={limitedEndsAt} />
          )}
        </div>
      )}

      {appliedDiscount && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm font-semibold border border-green-200">
          Discount "{appliedDiscount.code}" applied! You saved an extra ₹{((displayPrice * quantity) - finalPrice).toLocaleString('en-IN')}.
        </div>
      )}
      
       <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
        <span className="font-semibold">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="px-3 py-2 text-lg disabled:opacity-50">-</button>
          <span className="px-4 py-2 font-bold">{quantity}</span>
          <button onClick={() => handleQuantityChange(1)} disabled={isOutOfStock || (typeof effectiveStock === "number" && quantity >= effectiveStock)} className="px-3 py-2 text-lg disabled:opacity-50">+</button>
        </div>
      </div>


      {availableDiscounts.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Available Offers</h3>
          <div className="space-y-2">
            {discountsToShow.map(d => (
              <div key={d.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                <div>
                  <p className="font-bold text-gray-700">{d.code}</p>
                  <p className="text-xs text-gray-500">{d.description}</p>
                </div>
                <button
                  onClick={() => setAppliedDiscount(appliedDiscount?.id === d.id ? null : d)}
                  className={`text-sm font-bold py-1 px-4 rounded-md transition-colors ${
                    appliedDiscount?.id === d.id
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {appliedDiscount?.id === d.id ? 'Remove' : 'Apply'}
                </button>
              </div>
            ))}
          </div>
          {canCollapseDiscounts && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowAllDiscounts(prev => !prev)}
                className="text-sm font-bold text-[#D4AF37] hover:underline"
              >
                {showAllDiscounts ? 'Show Less' : `View All ${availableDiscounts.length} Coupons`}
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-stretch space-x-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onToggleCart(product.id)}
          disabled={isOutOfStock}
          className={`flex-1 text-sm md:text-base font-bold py-4 px-4 rounded-md transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed ${
            isInCart
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {isInCart ? 'Remove from Cart' : 'Add to Cart'}
        </button>
        <button onClick={() => onBuyNow(product.id)} disabled={isOutOfStock} className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-sm md:text-base font-bold py-4 px-4 rounded-md transition-all duration-300 hover:from-amber-600 hover:to-yellow-500 hover:shadow-lg transform hover:-translate-y-px disabled:from-gray-400 disabled:to-gray-300 disabled:cursor-not-allowed">
          Buy Now
        </button>
        <button
          onClick={() => onToggleWishlist(product.id)}
          className={`p-4 rounded-md transition-colors border ${
            isWishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
          }`}
           aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <HeartIcon className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={handleShare}
          className={`px-4 py-3 rounded-md transition-all duration-300 border flex items-center gap-2 font-semibold ${
            isLinkCopied
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
           aria-label={isLinkCopied ? 'Link copied!' : 'Share product link'}
        >
          {isLinkCopied ? <CheckIcon className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
          <span>{isLinkCopied ? 'Link copied' : 'Share'}</span>
        </button>
      </div>

      <div className="flex items-center justify-center text-sm text-gray-500 space-x-2">
        <ShieldCheckIcon className="w-5 h-5 text-green-600" />
        <span>Safe and Secure Payments. 100% Authentic Products.</span>
      </div>

      {/* On desktop, show tabs here. On mobile, they are below the main product section. */}
      <div className="hidden lg:block pt-6 mt-6 border-t border-gray-200">
          <ProductDetailsTabs product={product} />
      </div>
    </div>
  );
};

const Countdown = ({ expiryDate }: { expiryDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const compute = () => {
      const diff = new Date(expiryDate).getTime() - Date.now();
      if (diff <= 0) return null;
      return {
        h: Math.floor(diff / (1000 * 60 * 60)),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(compute());
    const t = setInterval(() => setTimeLeft(compute()), 1000);
    return () => clearInterval(t);
  }, [expiryDate]);

  if (!timeLeft) return <span>Deal ended</span>;
  return (
    <div className="flex items-center space-x-3">
      <span className="font-semibold">Offer ends in:</span>
      <div className="flex space-x-2 tabular-nums font-semibold">
        <span>{String(timeLeft.h).padStart(2, '0')}h</span>
        <span>{String(timeLeft.m).padStart(2, '0')}m</span>
        <span>{String(timeLeft.s).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};

export default ProductInfo;

