import React, { useState } from 'react';
import { 
  FiHome, 
  FiPackage, 
  FiFileText, 
  FiUsers, 
  FiBarChart2, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiChevronRight,
  FiPlusCircle
} from 'react-icons/fi';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { localStorageManager } from '../../utils/localStorage';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const manager = localStorageManager.getManagerData();
  const lowStockCount = localStorageManager.getInventory()?.filter(item => item.quantity < item.minStock).length || 0;

  const menuItems = [
    { 
      path: '/', 
      icon: FiHome, 
      label: 'Dashboard',
      badge: null
    },
    { 
      path: '/inventory', 
      icon: FiPackage, 
      label: 'Inventory',
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-red-500 text-white'
    },
    { 
      path: '/invoices', 
      icon: FiFileText, 
      label: 'Invoices',
      badge: null
    },
    { 
      path: '/outlets', 
      icon: FiUsers, 
      label: 'Outlets',
      badge: null
    },
    { 
      path: '/reports', 
      icon: FiBarChart2, 
      label: 'Reports',
      badge: null
    },
  ];

  const handleLogout = () => {
    localStorageManager.setLoginStatus(false);
    localStorageManager.clearManagerData();
    navigate('/login');
  };

  const handleAddProduct = () => {
    if (location.pathname.includes('/add-product')) {
      // If already on inventory page, trigger the add product modal
      window.dispatchEvent(new CustomEvent('openAddProductModal'));
    } else {
      // Navigate to inventory page and then open modal
      navigate('/add-product');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openAddProductModal'));
      }, 100);
    }
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FiX size={24} className="text-gray-600" /> : <FiMenu size={24} className="text-gray-600" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-screen bg-gradient-to-b from-white to-gray-50 shadow-xl z-40
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isOpen ? 'w-64' : 'lg:w-20'}
        flex flex-col
      `}>
        {/* Logo & Toggle Section */}
        <div className={`
          p-6 border-b border-gray-200 bg-white
          ${!isOpen && 'lg:px-3'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className={`
                font-bold text-gray-800 transition-opacity duration-300
                ${!isOpen && 'lg:hidden'}
              `}>
                Store Manager
              </h1>
            </div>
            
            {/* Toggle Button (Desktop only) */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <FiChevronRight className={`
                text-gray-500 transition-transform duration-300
                ${!isOpen ? 'rotate-180' : ''}
              `} size={20} />
            </button>
          </div>

          {/* Manager Info - Condensed for collapsed state */}
          {manager && (
            <div className={`
              mt-4 flex items-center space-x-3
              ${!isOpen && 'lg:hidden'}
            `}>
              <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                {manager.name?.charAt(0) || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{manager.name || 'Manager'}</p>
                <p className="text-xs text-gray-500 truncate">{manager.storeName || 'Store'}</p>
              </div>
            </div>
          )}

          {/* Collapsed manager indicator */}
          {!isOpen && (
            <div className="hidden lg:flex mt-4 justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                {manager.name?.charAt(0) || 'M'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Main Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) => {
                    const active = isActive || isActiveRoute(item.path);
                    return `
                      flex items-center ${isOpen ? 'justify-between' : 'justify-center lg:justify-center'} 
                      p-3 rounded-lg transition-all duration-200 group relative
                      ${active 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `;
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} />
                    <span className={`
                      text-sm font-medium transition-opacity duration-300
                      ${!isOpen && 'lg:hidden'}
                    `}>
                      {item.label}
                    </span>
                  </div>
                  
                  {/* Badge */}
                  {item.badge && isOpen && (
                    <span className={`text-xs px-2 py-1 rounded-full ${item.badgeColor || 'bg-gray-200 text-gray-700'}`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <span className="hidden lg:block absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.label}
                      {item.badge && ` (${item.badge})`}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
            
        
            <li className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleAddProduct}
                className={({ isActive }) => {
                  const active = location.pathname.includes('/add-product');
                  return `
                    flex items-center ${isOpen ? 'justify-between' : 'justify-center lg:justify-center'} 
                    w-full p-3 rounded-lg transition-all duration-200 group relative
                    ${active 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `;
                }}
              >
                <div className="flex items-center space-x-3">
                  <FiPlusCircle size={20} />
                  <span className={`
                    text-sm font-medium transition-opacity duration-300
                    ${!isOpen && 'lg:hidden'}
                  `}>
                    Add Product
                  </span>
                </div>
                
                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <span className="hidden lg:block absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    Add Product
                  </span>
                )}
              </button>
            </li>
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className={`
              flex items-center ${isOpen ? 'space-x-3' : 'justify-center lg:space-x-0'} 
              w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group relative
            `}
          >
            <FiLogOut size={20} />
            <span className={`
              text-sm font-medium transition-opacity duration-300
              ${!isOpen && 'lg:hidden'}
            `}>
              Logout
            </span>
            
            {/* Tooltip for collapsed state */}
            {!isOpen && (
              <span className="hidden lg:block absolute left-16 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;