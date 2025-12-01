import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../App';
import { Notification, Product, UserProfile } from '../types';
import NotificationPanel from './NotificationPanel';
import { ICONS } from '../constants';
import * as api from '../services/apiService';
import { getIntelligentSearchResult } from '../services/geminiService';
import { NavigationAction } from '../types';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    products: Product[];
    onSearchResultClick: (action: Partial<NavigationAction>) => void;
    profile: UserProfile | null;
    onLogout: () => void;
}

type SearchResultProduct = { id: number; name: string };
type SearchResults = { pages: Page[]; products: SearchResultProduct[] };

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, notifications, setNotifications, products, onSearchResultClick, profile, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({ pages: [], products: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiAction, setAiAction] = useState<NavigationAction | null>(null);
  
  const debounceTimeoutRef = useRef<number | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    setAiAction(null);
    setIsAiSearching(false);

    if (searchTerm.length > 0) {
        // Fix: Expanded pageNames to include all searchable pages, resolving type error.
        const pageNames: Page[] = ['dashboard', 'inventory', 'orders', 'customers', 'analytics', 'discounts', 'banners', 'profile', 'settings', 'rich-content', 'logs'];
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const filteredPages = pageNames.filter(p => {
            // Fix: Explicitly declare pageLabel as a string to avoid type conflicts when assigning non-Page strings.
            let pageLabel: string = p;
            if (p === 'inventory') pageLabel = 'products';
            if (p === 'rich-content') pageLabel = 'rich content';
            if (p === 'logs') pageLabel = 'activity logs';
            return pageLabel.toLowerCase().includes(lowerCaseSearchTerm);
        });

        const flattenedProducts = products.flatMap(product => {
          if (product.variants && product.variants.length > 0) {
            return product.variants.map(variant => ({ id: variant.id, name: `${product.name} - ${variant.name}` }));
          }
          return { id: product.id, name: product.name };
        });

        const filteredProducts = flattenedProducts
          .filter(p => p.name.toLowerCase().includes(lowerCaseSearchTerm))
          .slice(0, 5);
        
        const hasResults = filteredPages.length > 0 || filteredProducts.length > 0;
        setSearchResults({ pages: filteredPages, products: filteredProducts });
        setIsSearchOpen(hasResults || searchTerm.length >= 3);
    } else {
        setSearchResults({ pages: [], products: [] });
        setIsSearchOpen(false);
        return;
    }

    if (searchTerm.length >= 3) {
      setIsAiSearching(true);
      debounceTimeoutRef.current = window.setTimeout(async () => {
        const result = await getIntelligentSearchResult(searchTerm);
        setAiAction(result);
        setIsAiSearching(false);
      }, 800);
    }
    
    return () => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };

  }, [searchTerm, products]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setCurrentPage('profile');
    setIsProfileOpen(false);
  }

  const handleAiActionClick = () => {
      if (aiAction) {
          onSearchResultClick(aiAction);
          setSearchTerm('');
          setIsSearchOpen(false);
      }
  };

  const handleLocalPageResultClick = (page: Page) => {
    onSearchResultClick({ page });
    setSearchTerm('');
    setIsSearchOpen(false);
  };
  
  const handleLocalProductResultClick = (productName: string) => {
    onSearchResultClick({ page: 'inventory', searchTerm: productName });
    setSearchTerm('');
    setIsSearchOpen(false);
  };
  
  const title = currentPage === 'inventory' ? 'Products' :
              currentPage === 'rich-content' ? 'Rich Content' :
              currentPage === 'logs' ? 'Activity Logs' :
              (currentPage.charAt(0).toUpperCase() + currentPage.slice(1));
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (_) {
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  const getPageIcon = (page: Page) => {
      let iconKey: string = page;
      if (page === 'inventory') iconKey = 'products';
      if (page === 'rich-content') iconKey = 'richContent';
      const icon = ICONS[iconKey as keyof typeof ICONS];
      return icon ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5 mr-3 text-gray-400"}) : null;
  }

  const getPageLabel = (page: Page): string => {
      switch(page) {
        case 'inventory': return 'Products';
        case 'rich-content': return 'Rich Content';
        case 'logs': return 'Activity Logs';
        default: return page.charAt(0).toUpperCase() + page.slice(1);
      }
  }

  return (
    <header className="bg-card shadow-sm p-4 lg:px-8 flex justify-between items-center flex-shrink-0 z-20">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      <div className="flex items-center space-x-4">
        <div className="relative" ref={searchContainerRef}>
          <input
            type="text"
            placeholder="Search or ask me anything..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            className="pl-10 pr-4 py-2 w-72 rounded-full border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {isSearchOpen && (
            <div className="absolute top-full mt-2 w-full bg-card rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto">
                {(isAiSearching || aiAction) && (
                    <div className="border-b">
                        {isAiSearching ? (
                            <div className="px-4 py-3 flex items-center text-sm text-primary">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Intelligent search in progress...
                            </div>
                        ) : aiAction ? (
                            <>
                                <h4 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">Intelligent Action</h4>
                                <button onClick={handleAiActionClick} className="w-full text-left flex items-center px-4 py-3 text-sm text-primary font-semibold hover:bg-background">
                                    {ICONS.ai && React.cloneElement(ICONS.ai as React.ReactElement<any>, { className: "h-5 w-5 mr-3"})}
                                    <span className="capitalize">{`Go to ${aiAction.page} ${aiAction.statusFilter ? `(filter: ${aiAction.statusFilter})` : ''} ${aiAction.sortBy ? `(sort by ${aiAction.sortBy})`: ''}`}</span>
                                </button>
                            </>
                        ) : null}
                    </div>
                )}
                {searchResults.pages.length > 0 && (
                    <div>
                        <h4 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase border-t">Pages</h4>
                        <ul>
                           {searchResults.pages.map(page => (
                               <li key={page}>
                                   <button onClick={() => handleLocalPageResultClick(page)} className="w-full text-left flex items-center px-4 py-2 text-sm text-text-primary hover:bg-background">
                                       {getPageIcon(page)}
                                       <span className="capitalize">{getPageLabel(page)}</span>
                                   </button>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
                {searchResults.products.length > 0 && (
                     <div>
                        <h4 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase border-t">Products</h4>
                        <ul>
                           {searchResults.products.map(product => (
                               <li key={product.id}>
                                   <button onClick={() => handleLocalProductResultClick(product.name)} className="w-full text-left flex items-center px-4 py-2 text-sm text-text-primary hover:bg-background">
                                       {ICONS.products && React.cloneElement(ICONS.products as React.ReactElement<any>, { className: "h-5 w-5 mr-3 text-gray-400"})}
                                       <span className="truncate">{product.name}</span>
                                   </button>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
            </div>
          )}
        </div>

        <div className="relative" ref={notifDropdownRef}>
            <button onClick={() => setIsNotifOpen(prev => !prev)} className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-3 w-3 flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
            </button>
            {isNotifOpen && (
                <NotificationPanel 
                    notifications={notifications} 
                    onMarkAllRead={handleMarkAllRead} 
                    onClose={() => setIsNotifOpen(false)} 
                />
            )}
        </div>
        
        <div className="relative" ref={profileDropdownRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 cursor-pointer">
            {profile && (
              <>
                <img 
                    src={profile.avatarUrl}
                    alt={profile.name} 
                    className="w-10 h-10 rounded-full" 
                />
                <div>
                    <p className="font-semibold text-sm text-left">{profile.name}</p>
                    <p className="text-xs text-text-secondary">{profile.role}</p>
                </div>
              </>
            )}
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-xl z-50 ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button onClick={handleProfileClick} className="w-full text-left block px-4 py-2 text-sm text-text-primary hover:bg-background">Manage Profile</button>
                <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
