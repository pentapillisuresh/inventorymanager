// src/pages/Inventory.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import InventoryTable from '../components/Inventory/InventoryTable';
import StockLevels from '../components/Inventory/StockLevels';
import { FiGrid, FiAlertTriangle, FiTrendingUp, FiPackage } from 'react-icons/fi';
import ApiService from '../utils/ApiService';

const Inventory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    uniqueProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    healthPercentage: 0
  });

  const clientToken = localStorage.getItem('token');
  const storeId = localStorage.getItem('storeId');

  const fetchInventorySummary = async (storeId = 1) => {
    try {
      const response = await ApiService.get(`/stores/${storeId}/inventory/summary`,{
        headers: {
          Authorization: `Bearer ${clientToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log("fetchInventorySummary::",response)
      return response;
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      throw error;
    }
  };
  

  // Update src/services/api.js to include inventory endpoints
 const fetchInventoryList = async (storeId = 1) => {
  try {
    const response = await ApiService.get(`/inventory/store/${storeId}`,{
      headers: {
        Authorization: `Bearer ${clientToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching inventory list:', error);
    throw error;
  }
};
  // Fetch inventory data
  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch inventory summary
      const summaryData = await fetchInventorySummary(storeId);
      setSummary(summaryData);
      
      // Fetch inventory list
      const inventoryData = await fetchInventoryList(storeId);
      setInventory(inventoryData);
      
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Transform API inventory data to match component expectations
  const transformedInventory = inventory.map(item => ({
    id: item.id,
    productId: item.productId,
    name: item.Product?.name || 'Unknown Product',
    sku: item.Product?.sku || 'N/A',
    category: item.Product?.Category?.name || 'Uncategorized',
    quantity: item.quantity,
    unit: 'units',
    price: parseFloat(item.Product?.price) || 0,
    minStock: item.reorderLevel,
    room: item.Room?.name || null,
    rack: item.Rack?.name || null,
    freezer: item.Freezer?.name || null,
    lastUpdated: item.lastUpdated,
    thresholdQuantity: item.Product?.thresholdQuantity
  }));

  // Calculate stock level counts
  const lowStockCount = transformedInventory.filter(item => item.quantity < item.minStock).length;
  const criticalStockCount = transformedInventory.filter(item => 
    item.quantity < item.minStock * 0.5
  ).length;
  const goodStockCount = transformedInventory.filter(item => 
    item.quantity >= item.minStock * 1.5
  ).length;

  const handleEditProduct = (product) => {
    // Implement edit functionality with API
    console.log('Edit product:', product);
  };

  const tabs = [
    { 
      id: 'view', 
      label: 'View Inventory', 
      icon: FiGrid, 
      path: '/inventory',
      badge: transformedInventory.length,
      badgeColor: 'bg-blue-100 text-blue-800'
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Error Loading Inventory</h3>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={fetchInventoryData}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage and organize your store's stock</p>
        
        {/* Quick Stats Bar from API Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-xl font-bold">{summary.totalItems}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiPackage className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="text-xl font-bold">{summary.totalQuantity}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FiPackage className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Products</p>
                <p className="text-xl font-bold">{summary.uniqueProducts}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FiGrid className="text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Health</p>
                <p className="text-xl font-bold">{summary.healthPercentage}%</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                parseFloat(summary.healthPercentage) >= 60 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <FiTrendingUp className={parseFloat(summary.healthPercentage) >= 60 ? 'text-green-600' : 'text-red-600'} />
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
            inventory={transformedInventory} 
            onEdit={handleEditProduct} 
          />
        } />
        
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
                      {transformedInventory
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
          <StockLevels inventory={transformedInventory} />
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