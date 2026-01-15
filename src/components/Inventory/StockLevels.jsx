// src/components/Inventory/StockLevels.jsx
import React, { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiPackage, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const StockLevels = ({ inventory }) => {
  const [viewMode, setViewMode] = useState('all'); // 'all', 'low', 'good', 'critical'
  
  const lowStockItems = inventory.filter(item => item.quantity < item.minStock);
  const criticalStockItems = inventory.filter(item => item.quantity < item.minStock * 0.5);
  const goodStockItems = inventory.filter(item => item.quantity >= item.minStock * 1.5);
  
  const getFilteredItems = () => {
    switch(viewMode) {
      case 'low': return lowStockItems;
      case 'critical': return criticalStockItems;
      case 'good': return goodStockItems;
      default: return inventory;
    }
  };

  const getStockLevel = (quantity, minStock) => {
    const percentage = (quantity / minStock) * 100;
    if (percentage < 50) return { label: 'Critical', color: 'bg-red-100 text-red-800', icon: FiAlertTriangle };
    if (percentage < 80) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: FiAlertTriangle };
    if (percentage < 120) return { label: 'Normal', color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle };
    return { label: 'Good', color: 'bg-green-100 text-green-800', icon: FiCheckCircle };
  };

  const getTrend = (quantity, minStock) => {
    const percentage = (quantity / minStock) * 100;
    if (percentage < 60) return { icon: FiTrendingDown, color: 'text-red-600', text: 'Need urgent restock' };
    if (percentage < 80) return { icon: FiTrendingDown, color: 'text-yellow-600', text: 'Need restock soon' };
    if (percentage > 150) return { icon: FiTrendingUp, color: 'text-green-600', text: 'Well stocked' };
    return { icon: FiCheckCircle, color: 'text-blue-600', text: 'Stock level normal' };
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FiPackage />
            <span>Stock Levels Analysis</span>
          </h2>
          <p className="text-gray-600">Monitor and analyze stock levels across products</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items ({inventory.length})
          </button>
          <button
            onClick={() => setViewMode('critical')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'critical' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Critical ({criticalStockItems.length})
          </button>
          <button
            onClick={() => setViewMode('low')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'low' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Low Stock ({lowStockItems.length})
          </button>
          <button
            onClick={() => setViewMode('good')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'good' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Good Stock ({goodStockItems.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Products</p>
              <p className="text-2xl font-bold">{inventory.length}</p>
            </div>
            <FiPackage className="text-blue-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
            <FiAlertTriangle className="text-yellow-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Critical Stock</p>
              <p className="text-2xl font-bold text-red-600">{criticalStockItems.length}</p>
            </div>
            <FiAlertTriangle className="text-red-600" size={24} />
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Good Stock</p>
              <p className="text-2xl font-bold text-green-600">{goodStockItems.length}</p>
            </div>
            <FiCheckCircle className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      {/* Stock Level Details */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Current Stock</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Min Required</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Stock Level</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Value</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const stockLevel = getStockLevel(item.quantity, item.minStock);
              const trend = getTrend(item.quantity, item.minStock);
              const Icon = stockLevel.icon;
              const TrendIcon = trend.icon;
              
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.sku}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-600">{item.minStock} {item.unit}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            item.quantity < item.minStock * 0.5 ? 'bg-red-500' :
                            item.quantity < item.minStock ? 'bg-yellow-500' :
                            item.quantity < item.minStock * 1.5 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((item.quantity / item.minStock) * 100, 200)}%` }}
                        />
                      </div>
                      <span className="text-sm">
                        {Math.round((item.quantity / item.minStock) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Icon className={stockLevel.color.replace('bg-', 'text-').replace(' text-', ' ')} />
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${stockLevel.color}`}>
                        {stockLevel.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1 text-xs">
                      <TrendIcon className={trend.color} />
                      <span className={trend.color}>{trend.text}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <FiCheckCircle className="mx-auto text-4xl text-green-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Items Found</h3>
          <p className="text-gray-600">No items match the selected filter criteria</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-medium mb-3">Stock Level Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Critical (&lt;50% of minimum)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Low (50-80% of minimum)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Normal (80-120% of minimum)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Good (&gt;120% of minimum)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockLevels;