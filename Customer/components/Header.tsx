import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, UserIcon, CartIcon, HeartIcon, BellIcon, GemIcon, MenuIcon, CloseIcon, ChevronDownIcon } from './Icon';
import { navigation, bestSellers } from '../constants';
import MegaMenu from './MegaMenu';
import NotificationPanel from './NotificationPanel';
import type { Notification, MegaMenuLink, NavItem, Product } from '../types';
import { fetchCategories, fetchMaterials, fetchColors, fetchCrystals } from '../services/apiService';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  wishlistCount: number;
  cartCount: number;
  notifications: Notification[];
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onNavigateHome: () => void;
  onNavigateToAllProducts: () => void;
  onNavigateToAboutUs: () => void;
  onNavigateToWishlist: () => void;
  onNavigateToCart: () => void;
  onNavigateToProfile: () => void;
  onNavigateWithFilter: (filter: MegaMenuLink['filter']) => void;
  onSelectProduct: (product: Product) => void;
  products: Product[];
  onNavigateToAllProductsWithSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    isLoggedIn,
    onLogout,
    wishlistCount, 
    cartCount, 
    notifications, 
    onMarkAsRead,
    onMarkAllAsRead,
    onNavigateHome, 
    onNavigateToAllProducts, 
    onNavigateToAboutUs, 
    onNavigateToWishlist, 
    onNavigateToCart,
    onNavigateToProfile,
    onNavigateWithFilter,
    onSelectProduct,
    products,
    onNavigateToAllProductsWithSearch,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSubMenu, setOpenMobileSubMenu] = useState<string | null>(null);
  const [openMobileSections, setOpenMobileSections] = useState<Record<string, boolean>>({});
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [totalResultsCount, setTotalResultsCount] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const [nav, setNav] = useState<NavItem[]>(navigation);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // Load dynamic Categories/Materials for Mega Menu
  useEffect(() => {
    const loadMenuMeta = async () => {
      try {
        const [cats, mats, cols, crystals] = await Promise.all([
          fetchCategories(),
          fetchMaterials(),
          fetchColors(),
          fetchCrystals(),
        ]);
        setNav((prev) => {
          const updated: NavItem[] = JSON.parse(JSON.stringify(prev));
          const jewellery = updated.find(i => i.name === 'Jewellery' && i.megaMenu);
          if (jewellery && jewellery.megaMenu) {
            const sections = jewellery.megaMenu.sections || [];
            const catSection = sections.find(s => s.title.toLowerCase().includes('category'));
            if (catSection && cats.length) {
              catSection.links = cats.map(c => ({
                name: c.name,
                href: '#',
                filter: { type: 'category' as const, value: c.name }
              }));
            }
            const matSection = sections.find(s => s.title.toLowerCase().includes('material'));
            if (matSection && mats.length) {
              matSection.links = mats.map(m => ({
                name: m.name,
                href: '#',
                filter: { type: 'material' as const, value: m.name }
              }));
            }
          }

          const colorItem = updated.find(i => i.name === 'Color' && i.megaMenu);
          if (colorItem && colorItem.megaMenu) {
            const sections = colorItem.megaMenu.sections || [];
            const shopByColor = sections.find(s => s.title.toLowerCase().includes('shop by color'));
            if (shopByColor && cols.length) {
              shopByColor.links = cols.map(c => ({
                name: c.name,
                href: '#',
                filter: { type: 'color' as const, value: c.name }
              }));
            }
          }

          const crystalItem = updated.find(i => i.name === 'Crystal Name' && i.megaMenu);
          if (crystalItem && crystalItem.megaMenu) {
            const sections = crystalItem.megaMenu.sections || [];
            const byCrystal = sections.find(s => s.title.toLowerCase().includes('crystal'));
            if (byCrystal && crystals.length) {
              byCrystal.links = crystals.map((name: string) => ({
                name,
                href: '#',
                filter: { type: 'gemstone' as const, value: name }
              }));
            }
          }
          return updated;
        });
      } catch (e) {
        console.error('Failed loading categories/materials for menu', e);
      }
    };
    loadMenuMeta();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isMobileSearchActive) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isMobileSearchActive]);
  
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const keywords = lowerCaseQuery.split(' ').filter(k => k.length > 1);

      const scoredProducts = products.map(product => {
        let score = 0;
        // Full query match in name has high weight
        if (product.name.toLowerCase().includes(lowerCaseQuery)) {
            score += 10;
        }
        
        keywords.forEach(keyword => {
            if (product.name.toLowerCase().includes(keyword)) score += 5;
            if (product.category.toLowerCase().includes(keyword)) score += 3;
            if (product.subcategory?.toLowerCase().includes(keyword)) score += 3;
            if (product.gemstone?.toLowerCase().includes(keyword)) score += 2;
            if (product.metal?.toLowerCase().includes(keyword)) score += 2;
            if (product.occasion?.toLowerCase().includes(keyword)) score += 1;
            if (product.color?.toLowerCase().includes(keyword)) score += 1;
        });

        return { product, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
      
      setSearchResults(scoredProducts.map(item => item.product).slice(0, 5)); // Show top 5 suggestions
      setTotalResultsCount(scoredProducts.length);
    } else {
      setSearchResults([]);
      setTotalResultsCount(0);
    }
  }, [searchQuery, products]);

  const handleMouseEnter = (itemName: string) => {
    const item = nav.find(nav => nav.name === itemName);
    if (item?.megaMenu) {
      setActiveMenu(itemName);
    } else {
      setActiveMenu(null);
    }
  };

  const handleMouseLeave = () => {
    setActiveMenu(null);
  };

  const handleMobileLinkClick = (item: NavItem, link?: MegaMenuLink) => {
    if (link?.filter) {
        onNavigateWithFilter(link.filter);
    } else if (item.name === 'All Products') {
      onNavigateToAllProducts();
    } else if (item.name === 'About Us') {
      onNavigateToAboutUs();
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileSubMenu = (itemName: string) => {
    setOpenMobileSubMenu(prev => (prev === itemName ? null : itemName));
  };

  const toggleMobileSection = (sectionKey: string) => {
    setOpenMobileSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setTotalResultsCount(0);
    setIsSearchFocused(false);
    setIsMobileSearchActive(false);
  }

  const handleProductSelectFromSearch = (product: Product) => {
    onSelectProduct(product);
    clearSearch();
  };
  
  const handleViewAll = () => {
    onNavigateToAllProductsWithSearch(searchQuery);
    clearSearch();
  };

  const activeMenuItem = nav.find(item => item.name === activeMenu);
  
  const SearchResultsList = () => (
    <div className="max-h-[70vh] overflow-y-auto">
      {searchResults.length > 0 ? (
        <>
          <ul role="listbox">
            {searchResults.map(product => (
              <li key={product.id} role="option" aria-selected="false" className="border-b last:border-b-0">
                <button onClick={() => handleProductSelectFromSearch(product)} className="w-full flex items-center p-3 hover:bg-gray-50 text-left transition-colors">
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md mr-4 flex-shrink-0" loading="lazy" />
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <p className="font-semibold text-gray-800 ml-4">₹{product.price.toLocaleString('en-IN')}</p>
                </button>
              </li>
            ))}
          </ul>
           <div className="p-3 border-t bg-gray-50 sticky bottom-0">
              <button onClick={handleViewAll} className="w-full text-center font-semibold text-sm text-[#D4AF37] hover:underline p-2 rounded-md hover:bg-gray-100 transition-colors">
                  View all {totalResultsCount} results
              </button>
          </div>
        </>
      ) : (
        <div className="p-6 text-center text-gray-500">
            <p className="font-semibold">No results found for "{searchQuery}".</p>
            <p className="text-sm mt-4 mb-4">Maybe you'll like one of our best sellers?</p>
            <div className="space-y-3">
                {bestSellers.slice(0, 2).map(product => (
                    <button key={product.id} onClick={() => handleProductSelectFromSearch(product)} className="w-full flex items-center p-2 hover:bg-gray-100 rounded-md text-left transition-colors">
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md mr-3" loading="lazy" />
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">₹{product.price.toLocaleString('en-IN')}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header
        onMouseLeave={handleMouseLeave}
        className="sticky top-0 bg-gradient-to-r from-white to-[#FAEBD7]/80 backdrop-blur-sm z-40 border-b border-gray-200"
      >
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          {isMobileSearchActive ? (
             <div className="w-full flex items-center gap-2 md:hidden">
                <div className="relative flex-grow">
                   <input 
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for jewellery..."
                    className="w-full p-2 pl-10 h-10 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                   />
                   <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <button onClick={() => { setIsMobileSearchActive(false); clearSearch(); }} className="font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
             </div>
          ) : (
            <>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="md:hidden text-gray-600 hover:text-[#D4AF37]"
                  aria-label="Open menu"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigateHome(); }} className="flex items-center space-x-3 text-gray-800">
                  <GemIcon className="w-8 h-8 md:w-10 md:h-10 text-[#D4AF37] flex-shrink-0" />
                  <div className="hidden md:block">
                    <span className="text-2xl font-bold tracking-wider block leading-tight">Blessing Ornaments</span>
                    <span className="text-xs text-gray-500 tracking-wide block">Timeless Elegance, Modern Grace</span>
                  </div>
                </a>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                {nav.map((item) => (
                  <div
                    key={item.name}
                    onMouseEnter={() => handleMouseEnter(item.name)}
                    className="py-2 relative"
                  >
                    <a
                      href={item.href || '#'}
                      onClick={(e) => {
                        e.preventDefault();
                        if (item.menuType || item.name === 'All Products') {
                          onNavigateToAllProducts();
                        } else if (item.name === 'About Us') {
                          onNavigateToAboutUs();
                        }
                      }}
                      className="text-gray-600 hover:text-[#D4AF37] transition-colors duration-300 flex items-center"
                    >
                      {item.name}
                      {item.menuType && (
                        <svg className="w-4 h-4 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </a>
                    {activeMenu === item.name && item.menuType === 'simple' && item.megaMenu && (
                      <div className="absolute top-full left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                          {item.megaMenu.sections.map(section => (
                            <div key={section.title} className="py-1">
                              {section.title && <h4 className="font-bold px-4 pt-2 pb-1 text-xs text-gray-400 uppercase tracking-wider">{section.title}</h4>}
                              {section.links.map(link => (
                                <a key={link.name} href={link.href} 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (link.filter) onNavigateWithFilter(link.filter);
                                  }}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">{link.name}</a>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="flex items-center space-x-3 md:space-x-4">
                {/* Desktop Search */}
                <div ref={searchContainerRef} className="relative hidden md:block">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder="Search..."
                      className="w-40 lg:w-56 h-10 p-2 pl-10 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {isSearchFocused && searchQuery.length > 1 && (
                     <div className="absolute top-full mt-2 w-[450px] -right-20 bg-white rounded-lg shadow-xl border z-50">
                        <SearchResultsList />
                     </div>
                  )}
                </div>

                {/* Mobile Search Icon */}
                <button onClick={() => setIsMobileSearchActive(true)} className="text-gray-600 hover:text-[#D4AF37] transition-colors duration-300 md:hidden" aria-label="Open search">
                  <SearchIcon className="w-5 h-5" />
                </button>

                <div ref={notificationRef} className="relative hidden md:block">
                    <button 
                      onClick={() => setIsNotificationsOpen(prev => !prev)}
                      className="text-gray-600 hover:text-[#D4AF37] transition-colors duration-300"
                      aria-label="Toggle notifications"
                    >
                        <BellIcon className="w-6 h-6" />
                         {unreadCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                    </button>
                    {isNotificationsOpen && (
                        <NotificationPanel
                            notifications={notifications}
                            onClose={() => setIsNotificationsOpen(false)}
                            onMarkAsRead={onMarkAsRead}
                            onMarkAllAsRead={onMarkAllAsRead}
                        />
                    )}
                </div>
                <button onClick={onNavigateToWishlist} className="relative text-gray-600 hover:text-[#D4AF37] transition-colors duration-300" aria-label="View Wishlist">
                  <HeartIcon className="w-6 h-6" />
                  {wishlistCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                <button onClick={onNavigateToCart} className="relative text-gray-600 hover:text-[#D4AF37] transition-colors duration-300" aria-label="View Cart">
                  <CartIcon className="w-6 h-6" />
                  {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>}
                </button>
                 <div ref={profileMenuRef} className="relative">
                    <button onClick={() => {
                      if (isLoggedIn) {
                        setIsProfileMenuOpen(prev => !prev)
                      } else {
                        onNavigateToProfile();
                      }
                    }} className="text-gray-600 hover:text-[#D4AF37] transition-colors duration-300" aria-label="User profile">
                        <UserIcon className="w-6 h-6" />
                    </button>
                    {isLoggedIn && isProfileMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                                <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToProfile(); setIsProfileMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                    Manage Profile
                                </a>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setIsProfileMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                                    Logout
                                </a>
                            </div>
                        </div>
                    )}
                </div>
              </div>
            </>
          )}
        </div>
         {/* Mobile Search Results */}
        {isMobileSearchActive && searchQuery.length > 1 && (
            <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t z-30">
                <SearchResultsList />
            </div>
        )}

        <div
          className={`absolute top-full left-0 w-full transition-all duration-300 ease-in-out ${activeMenu && activeMenuItem?.menuType === 'mega' ? 'opacity-100 visible' : 'opacity-0 invisible -translate-y-4'}`}
          aria-hidden={!activeMenu}
        >
          {activeMenuItem?.menuType === 'mega' && activeMenuItem.megaMenu && (
            <MegaMenu
              menu={activeMenuItem.megaMenu}
              allProducts={products}
              onNavigateWithFilter={onNavigateWithFilter}
              onSelectProduct={onSelectProduct}
            />
          )}
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMobileMenuOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
        <div
          className={`relative w-4/5 max-w-sm h-full bg-white shadow-xl transform transition-transform ease-in-out duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-between items-center p-4 border-b">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu"><CloseIcon className="w-6 h-6" /></button>
          </div>
          <nav className="p-4 overflow-y-auto h-[calc(100%-65px)]">
            <ul className="space-y-1">
              {nav.map(item => (
                <li key={item.name} className="border-b last:border-b-0">
                  {item.menuType ? (
                    <div>
                      <div className="w-full flex justify-between items-center py-3 font-semibold text-left">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigateToAllProducts();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex-grow"
                          >
                          <span>{item.name}</span>
                        </a>
                        <button
                          onClick={() => toggleMobileSubMenu(item.name)}
                          className="p-2 -mr-2 flex-shrink-0"
                          aria-label={`Toggle ${item.name} submenu`}
                        >
                          <ChevronDownIcon className={`w-5 h-5 transition-transform ${openMobileSubMenu === item.name ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <div className={`overflow-hidden transition-all duration-300 ${openMobileSubMenu === item.name ? 'max-h-[600px]' : 'max-h-0'}`}>
                        <ul className="pl-4 pt-2 pb-2 space-y-1 border-l">
                          {item.megaMenu?.sections.map(section => {
                            const sectionKey = `${item.name}-${section.title}`;
                            return (
                                <li key={section.title}>
                                    <button
                                        onClick={() => toggleMobileSection(sectionKey)}
                                        className="w-full flex justify-between items-center py-2 text-sm font-semibold text-left text-gray-700"
                                    >
                                        <span>{section.title}</span>
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${openMobileSections[sectionKey] ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${openMobileSections[sectionKey] ? 'max-h-96' : 'max-h-0'}`}>
                                        <ul className="pl-4 pt-2 pb-2 space-y-2 border-l">
                                            {section.links.map(link => (
                                                <li key={link.name}>
                                                    <a
                                                        href={link.href}
                                                        onClick={(e) => { e.preventDefault(); handleMobileLinkClick(item, link); }}
                                                        className="block py-2 text-sm text-gray-600 hover:text-[#D4AF37]"
                                                    >
                                                        {link.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>
                            );
                          })}
                          {item.megaMenu?.featured?.map(featured => (
                              <li key={featured.name} className="pt-2 mt-2 border-t">
                                <a href={featured.href} onClick={(e) => { e.preventDefault(); handleMobileLinkClick(item); }} className="block py-2 font-semibold text-sm text-gray-600 hover:text-[#D4AF37]">
                                  {featured.name}
                                </a>
                              </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <a href={item.href || '#'} onClick={(e) => { e.preventDefault(); handleMobileLinkClick(item); }} className="block py-3 font-semibold">
                      {item.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
