

import React from 'react';
// Fix: Import ProductPerformanceData
import { Order, OrderStatus, SalesDataPoint, KpiData, TrendDataPoint, ProductItem, Product, ProductStatus, DeliveryInfo, ProductVariant, Discount, DiscountType, DiscountStatus, Banner, BannerStatus, UserProfile, Notification, NotificationType, Customer, CustomerStatus, AnalyticsDataPoint, ProductPerformanceData, OrderStatusDataPoint } from './types';


export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(value);
};

export const generateAnalyticsData = (orders: Order[], period: 'Yearly' | 'Monthly' | 'Weekly' | 'Daily'): AnalyticsDataPoint[] => {
    const now = new Date();
    let dataMap = new Map<string, { revenue: number; orders: number; wishlisted: number; inCart: number }>();

    const processOrder = (order: Order, key: string) => {
        if (!dataMap.has(key)) {
            dataMap.set(key, { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 });
        }
        const entry = dataMap.get(key)!;
        
        if (order.status === OrderStatus.Completed || order.status === OrderStatus.Dispatched) {
            entry.revenue += order.amount;
        }
        
        if (order.status !== OrderStatus.Cancelled) {
            entry.orders += 1;
        }
    };

    const addSimulatedData = (key: string, date: Date) => {
        const entry = dataMap.get(key) || { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 };
        // Simulate higher activity on weekends
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const multiplier = isWeekend ? 1.5 : 1;
        
        entry.wishlisted += Math.floor(Math.random() * 50 * multiplier) + 10;
        entry.inCart += Math.floor(Math.random() * 80 * multiplier) + 20;
        dataMap.set(key, entry);
    };

    if (period === 'Yearly') {
        const year = now.getFullYear();
        for (let i = 0; i < 12; i++) {
            const date = new Date(year, i, 1);
            const key = date.toLocaleString('default', { month: 'short' });
            dataMap.set(key, { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 });
            addSimulatedData(key, date);
        }
        orders.forEach(order => {
            const orderDate = new Date(order.date);
            if (orderDate.getFullYear() === year) {
                const key = orderDate.toLocaleString('default', { month: 'short' });
                processOrder(order, key);
            }
        });
    }

    if (period === 'Monthly') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(now.getFullYear(), now.getMonth(), i);
            const key = `${i}`;
            dataMap.set(key, { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 });
            addSimulatedData(key, date);
        }
        orders.forEach(order => {
            const orderDate = new Date(order.date);
            if (orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth()) {
                const key = `${orderDate.getDate()}`;
                processOrder(order, key);
            }
        });
    }

    if (period === 'Weekly') {
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - (6 - i));
            const key = date.toLocaleDateString('en-US', { weekday: 'short' });
            dataMap.set(key, { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 });
            addSimulatedData(key, date);
        }
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 6);
        orders.forEach(order => {
            const orderDate = new Date(order.date);
            if (orderDate >= oneWeekAgo && orderDate <= now) {
                const key = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
                processOrder(order, key);
            }
        });
    }

    if (period === 'Daily') {
        for (let i = 0; i < 24; i++) {
            const date = new Date();
            date.setHours(i);
            const key = `${String(i).padStart(2, '0')}:00`;
            dataMap.set(key, { revenue: 0, orders: 0, wishlisted: 0, inCart: 0 });
            addSimulatedData(key, date);
        }
        const oneDayAgo = new Date();
        oneDayAgo.setDate(now.getDate() - 1);
        orders.forEach(order => {
            const orderDate = new Date(order.date);
            if (orderDate >= oneDayAgo) {
                const key = `${String(orderDate.getHours()).padStart(2, '0')}:00`;
                processOrder(order, key);
            }
        });
    }

    return Array.from(dataMap.entries()).map(([name, values]) => ({ name, ...values }));
};


export const generateOrderCountDataFromOrders = (orders: Order[], period: 'Yearly' | 'Monthly' | 'Weekly' | '24h'): OrderStatusDataPoint[] => {
    const validOrders = orders.filter(o => o.status !== OrderStatus.Cancelled);
    const now = new Date();
    
    const dataMap = new Map<string, { total: number; completed: number; dispatched: number; inProgress: number }>();

    const initializePeriod = (key: string) => {
        if (!dataMap.has(key)) {
            dataMap.set(key, { total: 0, completed: 0, dispatched: 0, inProgress: 0 });
        }
    };

    const processOrder = (order: Order, key: string) => {
        const entry = dataMap.get(key);
        if (entry) {
            entry.total += 1;
            if (order.status === OrderStatus.Completed) entry.completed += 1;
            if (order.status === OrderStatus.Dispatched) entry.dispatched += 1;
            if (order.status === OrderStatus.Pending || order.status === OrderStatus.Accepted) entry.inProgress += 1;
        }
    };

    if (period === 'Yearly') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthNames.forEach(name => initializePeriod(name));
        const currentYear = now.getFullYear();
        
        validOrders.forEach(order => {
            const orderDate = new Date(order.date);
            if (orderDate.getFullYear() === currentYear) {
                const key = monthNames[orderDate.getMonth()];
                processOrder(order, key);
            }
        });
    }

    if (period === 'Monthly') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 29);
        thirtyDaysAgo.setHours(0,0,0,0);
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(thirtyDaysAgo);
            date.setDate(thirtyDaysAgo.getDate() + i);
            initializePeriod(date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
        }

        validOrders.forEach(order => {
            const orderDate = new Date(order.date);
            if (orderDate >= thirtyDaysAgo && orderDate <= now) {
                const key = orderDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                processOrder(order, key);
            }
        });
    }

    if (period === 'Weekly') {
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0,0,0,0);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(sevenDaysAgo.getDate() + i);
            initializePeriod(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }

        validOrders.forEach(order => {
            const orderDate = new Date(order.date);
            if (orderDate >= sevenDaysAgo && orderDate <= now) {
                const key = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
                processOrder(order, key);
            }
        });
    }

    if (period === '24h') {
        const twentyFourHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
        
        for(let i=0; i<24; i++) {
            const date = new Date(twentyFourHoursAgo);
            date.setHours(date.getHours() + i);
            initializePeriod(`${date.getHours().toString().padStart(2, '0')}:00`);
        }
        
        validOrders.forEach(order => {
            const orderDate = new Date(order.date);
            const oneDayAgo = new Date(now.getTime() - 24*60*60*1000);
            if (orderDate >= oneDayAgo) {
                const key = `${orderDate.getHours().toString().padStart(2, '0')}:00`;
                processOrder(order, key);
            }
        });
    }

    return Array.from(dataMap.entries()).map(([name, values]) => ({ name, ...values }));
};


export const LIMITED_DEAL_TAG = 'Limited Deal';
export const WEDDING_COLLECTION_TAG = 'Wedding Collection';

export const SPECIAL_TAGS: string[] = [
    'New Arrival',
    'Featured Products',
    'Best Sellers',
    'Festive Sale',
    LIMITED_DEAL_TAG,
    WEDDING_COLLECTION_TAG,
];

export const PREDEFINED_TAGS: string[] = [
    ...SPECIAL_TAGS,
    'Gifting',
    'Daily Wear',
];

export const ICONS = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  analytics: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>,
  orders: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  products: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  customers: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  discounts: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7l.867 12.142A2 2 0 009.862 21h4.276a2 2 0 001.995-1.858L17 7M10 5a2 2 0 012-2h0a2 2 0 012 2v2a2 2 0 01-2 2h0a2 2 0 01-2-2V5z" /></svg>,
  banners: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  richContent: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  myWebsite: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
  notepad: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  logs: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  revenue: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3h12M6 7h12M9 11h3a4 4 0 010 8h-3" /></svg>,
  newCustomers: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  totalOrders: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  aov: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  wishlist: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  inCart: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  star: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  ai: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  cardView: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  listView: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  instructions: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 1.105-.448 2.105-1.172 2.828a4.002 4.002 0 01-2.828 1.172A4.002 4.002 0 0112 15v.01M12 18h.01" /></svg>,
  user: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  edit: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  info: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  success: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  warning: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  error: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  download: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  share: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
};
