

import React from 'react';
import { ICONS } from '../constants';
import { Page } from '../App';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  const commonClasses = "flex items-center px-4 py-3 text-gray-300 rounded-lg transition-colors duration-200 w-full text-left";
  const activeClasses = active ? 'bg-primary text-white font-semibold' : 'hover:bg-sidebar-hover hover:text-white';

  const content = (
    <>
      {icon}
      <span className="ml-4">{label}</span>
    </>
  );

  return (
    <button onClick={onClick} className={`${commonClasses} ${activeClasses}`}>
      {content}
    </button>
  );
};


const Sidebar: React.FC<{ 
  onNotepadClick: () => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}> = ({ onNotepadClick, currentPage, setCurrentPage }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar p-4 flex flex-col">
      <div className="flex items-center mb-10 px-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.069l-4.5 2.25L3 8.569l9 4.5 9-4.5-4.5-2.25L12 4.069zM3 8.569v6.862l9 4.5 9-4.5V8.569" /></svg>
        <h1 className="text-2xl font-bold text-white ml-2">Aura Jewels</h1>
      </div>
      <nav className="flex-1 space-y-2">
        <NavItem icon={ICONS.dashboard} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
        <NavItem icon={ICONS.analytics} label="Analytics" active={currentPage === 'analytics'} onClick={() => setCurrentPage('analytics')} />
        <NavItem icon={ICONS.products} label="Products" active={currentPage === 'inventory'} onClick={() => setCurrentPage('inventory')} />
        <NavItem icon={ICONS.orders} label="Orders" active={currentPage === 'orders'} onClick={() => setCurrentPage('orders')} />
        <NavItem icon={ICONS.customers} label="Customers" active={currentPage === 'customers'} onClick={() => setCurrentPage('customers')} />
        <NavItem icon={ICONS.discounts} label="Discounts" active={currentPage === 'discounts'} onClick={() => setCurrentPage('discounts')} />
        <NavItem icon={ICONS.banners} label="Banners" active={currentPage === 'banners'} onClick={() => setCurrentPage('banners')} />
        <NavItem icon={ICONS.richContent} label="Rich Content" active={currentPage === 'rich-content'} onClick={() => setCurrentPage('rich-content')} />
         <NavItem icon={ICONS.settings} label="Settings" active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')} />
        <NavItem icon={ICONS.logs} label="Activity Logs" active={currentPage === 'logs'} onClick={() => setCurrentPage('logs')} />
        <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center px-4 py-3 text-gray-300 rounded-lg transition-colors duration-200 w-full text-left hover:bg-sidebar-hover hover:text-white"
        >
            {ICONS.myWebsite}
            <span className="ml-4">My Website</span>
        </a>
        <NavItem icon={ICONS.notepad} label="Notepad" onClick={onNotepadClick} />
      </nav>
    </aside>
  );
};

export default Sidebar;
