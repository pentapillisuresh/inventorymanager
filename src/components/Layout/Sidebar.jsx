import React, { useState, useEffect } from 'react';
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
  FiPlusCircle,
  FiShoppingBag,
  FiTruck,
  FiDollarSign,
  FiUserCheck,
  FiSettings
} from 'react-icons/fi';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [lowStockCount, setLowStockCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          
          // Parse permissions if they exist
          if (parsedUser.permissions) {
            const parsedPermissions = typeof parsedUser.permissions === 'string' 
              ? JSON.parse(parsedUser.permissions) 
              : parsedUser.permissions;
            setPermissions(parsedPermissions);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Load inventory data for low stock count
  useEffect(() => {
    const loadInventory = () => {
      try {
        const storedInventory = localStorage.getItem('inventory');
        if (storedInventory) {
          const inventory = JSON.parse(storedInventory);
          const count = inventory?.filter(item => item.quantity < item.minStock).length || 0;
          setLowStockCount(count);
        }
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    };

    loadInventory();
    
    // Listen for inventory updates
    const handleInventoryUpdate = () => {
      loadInventory();
    };
    
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
  }, []);

  // Menu items with permission requirements
  const menuItems = [
    { 
      path: '/', 
      icon: FiHome, 
      label: 'Dashboard',
      badge: null,
      requiredPermission: null // Always visible
    },
    { 
      path: '/inventory', 
      icon: FiPackage, 
      label: 'Inventory',
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-red-500 text-white',
      requiredPermission: null // Essential feature
    },
    { 
      path: '/invoices', 
      icon: FiFileText, 
      label: 'Invoices',
      badge: null,
      requiredPermission: 'create_invoices'
    },
    { 
      path: '/outlets', 
      icon: FiUsers, 
      label: 'Outlets',
      badge: null,
      requiredPermission: 'create_outlets'
    },
    { 
      path: '/expenditures', 
      icon: FiDollarSign, 
      label: 'Expenditures',
      badge: null,
      requiredPermission: 'expenditure_management'
    },
    { 
      path: '/reports', 
      icon: FiBarChart2, 
      label: 'Reports',
      badge: null,
      requiredPermission: null // Visible to all
    },
  ];

  // Check if user has permission to view a menu item
  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true;
    if (userData?.role === 'super_admin' || userData?.role === 'admin') return true;
    return permissions[requiredPermission] === true;
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLogin');
    localStorage.removeItem('UserFCMToken');
    navigate('/login');
  };

  // Handle add product
  const handleAddProduct = () => {
    if (location.pathname.includes('/add-product')) {
      window.dispatchEvent(new CustomEvent('openAddProductModal'));
    } else {
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
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Check if trial is expired
  const isTrialExpired = () => {
    if (!userData?.expiryDate) return false;
    const expiryDate = new Date(userData.expiryDate);
    const today = new Date();
    return expiryDate < today;
  };

  // Get user role badge color
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'manager':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get plan status
  const getPlanStatus = () => {
    if (!userData) return null;
    if (userData.planType === 'Trial') {
      const expired = isTrialExpired();
      return {
        text: expired ? 'Trial Expired' : 'Trial',
        className: expired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
      };
    }
    return {
      text: userData.planType || 'Premium',
      className: 'bg-green-100 text-green-800'
    };
  };

  const planStatus = getPlanStatus();
  const filteredMenuItems = menuItems.filter(item => hasPermission(item.requiredPermission));

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
              {/* Business Logo */}
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
                {userData?.BusinessLogo ? (
                  <img 
                    src={userData.BusinessLogo} 
                    alt="Business Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {userData?.name?.charAt(0) || 'A'}
                  </span>
                )}
              </div>
              <h1 className={`
                font-bold text-gray-800 transition-opacity duration-300
                ${!isOpen && 'lg:hidden'}
              `}>
                {userData?.businessType || 'Aqua Credit'}
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

          {/* User Info - Expanded state */}
          {userData && (
            <div className={`
              mt-4 space-y-3
              ${!isOpen && 'lg:hidden'}
            `}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {userData.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{userData.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{userData.email || 'No email'}</p>
                </div>
              </div>
              
              {/* User Details */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Role:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userData.role)}`}>
                    {userData.role?.charAt(0).toUpperCase() + userData.role?.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Plan:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${planStatus?.className}`}>
                    {planStatus?.text}
                  </span>
                </div>
                {userData.planType === 'Trial' && userData.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Expires:</span>
                    <span className={`text-xs ${isTrialExpired() ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatDate(userData.expiryDate)}
                    </span>
                  </div>
                )}
                {userData.maxStores && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Max Stores:</span>
                    <span className="text-xs font-semibold text-gray-700">{userData.maxStores}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsed user indicator */}
          {!isOpen && userData && (
            <div className="hidden lg:flex mt-4 justify-center">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {userData.name?.charAt(0) || 'U'}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Main Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => (
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
            
            {/* Add Product Button - Only show if user has create_invoices permission */}
            {hasPermission('create_invoices') && (
              <li className="pt-4 mt-4 border-t border-gray-200">
                <button
                  onClick={handleAddProduct}
                  className={`
                    flex items-center ${isOpen ? 'justify-between' : 'justify-center lg:justify-center'} 
                    w-full p-3 rounded-lg transition-all duration-200 group relative
                    text-gray-600 hover:bg-gray-100 hover:text-gray-900
                  `}
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
            )}
          </ul>
        </nav>

        {/* Business Image Section */}
        {userData?.BusinessImage && isOpen && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={userData.BusinessImage} 
                alt="Business" 
                className="w-full h-20 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

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
          
          {/* Version info */}
          <p className="text-xs text-center text-gray-400 mt-3">
            Version 1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;