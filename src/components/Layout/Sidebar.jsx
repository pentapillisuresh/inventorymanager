// src/components/Layout/Sidebar.jsx
import React, { useState } from 'react';
import { 
  FiHome, FiPackage, FiFileText, FiUsers, 
  FiBarChart2, FiLogOut, FiMenu, FiX,
  FiChevronRight
} from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { localStorageManager } from '../../utils/localStorage';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();
  const manager = localStorageManager.getManagerData();

  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard' },
    { 
      icon: FiPackage, 
      label: 'Inventory', 
      submenu: [
        { path: '/inventory', label: 'View Inventory' },
        { path: '/inventory/arrange', label: 'Arrange Stock' },
        { path: '/inventory/low-stock', label: 'Low Stock Alert' }
      ]
    },
    { path: '/invoices', icon: FiFileText, label: 'Invoices' },
    { path: '/outlets', icon: FiUsers, label: 'Outlets' },
    { path: '/reports', icon: FiBarChart2, label: 'Reports' },
  ];

  const handleLogout = () => {
    localStorageManager.setLoginStatus(false);
    navigate('/login');
  };

  const toggleSubmenu = (label) => {
    setActiveSubmenu(activeSubmenu === label ? null : label);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-screen bg-white shadow-lg z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 w-64
      `}>
        {/* Logo & Manager Info */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary-600">Manager Dashboard</h1>
          <div className="mt-4">
            <p className="font-semibold">{manager.name}</p>
            <p className="text-sm text-gray-600">{manager.storeName}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="text-gray-600" />
                        <span>{item.label}</span>
                      </div>
                      <FiChevronRight className={`transition-transform ${
                        activeSubmenu === item.label ? 'rotate-90' : ''
                      }`} />
                    </button>
                    
                    {activeSubmenu === item.label && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.path}>
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) =>
                                `block p-2 rounded-lg text-sm ${
                                  isActive 
                                    ? 'bg-primary-50 text-primary-600' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`
                              }
                              onClick={() => setIsOpen(false)}
                            >
                              {subItem.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary-50 text-primary-600' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;