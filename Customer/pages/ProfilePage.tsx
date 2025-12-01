import React from 'react';
import type { User, Address, Order, ProductReview } from '../types';
import MyAccountTab from '../components/MyAccountTab';
import MyOrdersTab from '../components/MyOrdersTab';
import MyAddressTab from '../components/MyAddressTab';
import { UserIcon, CartIcon, HeartIcon } from '../components/Icon';

type ProfileTab = 'account' | 'orders' | 'address';

interface ProfilePageProps {
  user: User;
  addresses: Address[];
  orders: Order[];
  onUpdateUser: (user: User) => void;
  onResetPassword?: () => void;
  onUpdateAddresses: (addresses: Address[]) => void;
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
  onNavigateToAllProducts: () => void;
  onInitiateReturn: (order: Order) => void;
  onRefreshOrders?: () => void;
  onAddReview?: (order: Order, item: Order['items'][number]) => void;
  reviews?: ProductReview[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  addresses,
  orders,
  onUpdateUser,
  onResetPassword,
  onUpdateAddresses,
  activeTab,
  setActiveTab,
  onNavigateToAllProducts,
  onInitiateReturn,
  onRefreshOrders,
  onAddReview,
  reviews,
}) => {
  const tabs = [
    { id: 'account', label: 'My Account', icon: UserIcon },
    { id: 'orders', label: 'My Orders', icon: CartIcon },
    { id: 'address', label: 'My Address', icon: HeartIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <MyAccountTab
            user={user}
            onUpdateUser={onUpdateUser}
            onResetPassword={onResetPassword}
          />
        );
      case 'orders':
        return <MyOrdersTab orders={orders} onNavigateToAllProducts={onNavigateToAllProducts} onInitiateReturn={onInitiateReturn} onRefresh={onRefreshOrders} onAddReview={onAddReview} reviews={reviews} />;
      case 'address':
        return <MyAddressTab addresses={addresses} onUpdateAddresses={onUpdateAddresses} />;
      default:
        return null;
    }
  };

  return (
    <main className="bg-[#FDFBF6]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Manage Your Profile</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="md:w-1/4">
            <nav className="flex flex-col space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={`flex items-center p-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#D4AF37] text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>
          {/* Main Content */}
          <div className="md:w-3/4 bg-white p-6 md:p-8 rounded-lg shadow-sm">
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
