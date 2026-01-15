// src/pages/Inventory.jsx
import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import InventoryTable from '../components/Inventory/InventoryTable';
import ArrangeInventory from '../components/Inventory/ArrangeInventory';
import StockLevels from '../components/Inventory/StockLevels';
import { localStorageManager } from '../utils/localStorage';
import { FiGrid, FiMapPin, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';

const Inventory = () => {
  const navigate = useNavigate();
  const inventory = localStorageManager.getInventory();
  const lowStockCount = inventory.filter(item => item.quantity < item.minStock).length;
  
  // Calculate stock level counts for badges
  const criticalStockCount = inventory.filter(item => 
    item.quantity < item.minStock * 0.5
  ).length;
  
  const goodStockCount = inventory.filter(item => 
    item.quantity >= item.minStock * 1.5
  ).length;

  const handleEditProduct = (product) => {
    // Implement edit functionality
    console.log('Edit product:', product);
  };

  const tabs = [
    { 
      id: 'view', 
      label: 'View Inventory', 
      icon: FiGrid, 
      path: '/inventory',
      badge: inventory.length,
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'arrange', 
      label: 'Arrange Stock', 
      icon: FiMapPin, 
      path: '/inventory/arrange'
    },
    { 
      id: 'low-stock', 
      label: 'Low Stock', 
      icon: FiAlertTriangle, 
      path: '/inventory/low-stock', 
      badge: lowStockCount,
      badgeColor: 'bg-red-100 text-red-800'
    },
    { 
      id: 'stock-levels', 
      label: 'Stock Levels', 
      icon: FiTrendingUp, 
      path: '/inventory/stock-levels',
      badge: `${criticalStockCount}/${goodStockCount}`,
      badgeColor: 'bg-purple-100 text-purple-800'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage and organize your store's stock</p>
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-xl font-bold">{inventory.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiGrid className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-xl font-bold text-red-600">{criticalStockCount}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Good Stock</p>
                <p className="text-xl font-bold text-green-600">{goodStockCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FiTrendingUp className="text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex items-center space-x-2 px-4 py-3 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                window.location.pathname === tab.path
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-xs px-2 py-1 rounded-full ${tab.badgeColor || 'bg-gray-100 text-gray-800'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={
          <InventoryTable 
            inventory={inventory} 
            onEdit={handleEditProduct} 
          />
        } />
        
        <Route path="/arrange" element={<ArrangeInventory />} />
        
        <Route path="/low-stock" element={
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <FiAlertTriangle className="text-red-600" />
                  <span>Low Stock Alert</span>
                </h2>
                <p className="text-gray-600">
                  {lowStockCount} items below minimum stock level
                </p>
              </div>
              {lowStockCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 font-medium">
                    Action Required: {lowStockCount} items need restocking
                  </p>
                </div>
              )}
            </div>
            
            {lowStockCount === 0 ? (
              <div className="text-center py-12 bg-green-50 rounded-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertTriangle className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">All Stock Levels Good</h3>
                <p className="text-green-700">No items below minimum stock level</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Current Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Min Required</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Difference</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Stock Level</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory
                        .filter(item => item.quantity < item.minStock)
                        .map((item) => {
                          const percentage = Math.round((item.quantity / item.minStock) * 100);
                          const getStockLevelColor = () => {
                            if (percentage < 50) return 'bg-red-100 text-red-800';
                            if (percentage < 80) return 'bg-yellow-100 text-yellow-800';
                            return 'bg-orange-100 text-orange-800';
                          };
                          
                          return (
                            <tr key={item.id} className="border-b hover:bg-red-50">
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-600">{item.category}</p>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {item.sku}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-medium">{item.quantity} {item.unit}</span>
                              </td>
                              <td className="py-4 px-4">{item.minStock} {item.unit}</td>
                              <td className="py-4 px-4">
                                <span className="text-red-600 font-medium">
                                  {item.minStock - item.quantity} {item.unit}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        percentage < 50 ? 'bg-red-500' : 'bg-yellow-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStockLevelColor()}`}>
                                    {percentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm">
                                  {item.room && <p className="text-gray-600">Room: {item.room}</p>}
                                  {item.rack && <p className="text-gray-600">Rack: {item.rack}</p>}
                                  {item.freezer && <p className="text-gray-600">Freezer: {item.freezer}</p>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-red-800 mb-1">Restock Summary</h4>
                      <p className="text-sm text-red-700">
                        Total {lowStockCount} items need immediate attention
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Generate Restock List
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        } />
        
        <Route path="/stock-levels" element={
          <StockLevels inventory={inventory} />
        } />
        
        {/* Catch-all route for inventory sub-routes */}
        <Route path="*" element={
          <div className="text-center py-12">
            <p className="text-gray-500">Page not found</p>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default Inventory;