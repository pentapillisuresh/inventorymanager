// src/components/Layout/Header.jsx
import React from 'react';
import { FiBell, FiSettings, FiUser } from 'react-icons/fi';
import { localStorageManager } from '../../utils/localStorage';

const Header = () => {
  const manager = localStorageManager.getManagerData();
  const inventory = localStorageManager.getInventory();
  const lowStockCount = inventory.filter(item => item.quantity < item.minStock).length;

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {manager.name.split(' ')[0]}!</h1>
          <p className="text-gray-600">Manage your store efficiently</p>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <FiBell size={20} />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {lowStockCount}
                </span>
              )}
            </button>
          </div>

          {/* Settings */}
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FiSettings size={20} />
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <FiUser className="text-primary-600" />
            </div>
            <div>
              <p className="font-semibold">{manager.name}</p>
              <p className="text-sm text-gray-600">Store Manager</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;