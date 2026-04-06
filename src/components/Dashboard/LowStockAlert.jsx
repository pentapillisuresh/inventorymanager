// src/components/Dashboard/LowStockAlert.jsx
import React from 'react';
import { FiAlertTriangle, FiPackage } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const LowStockAlert = ({ lowStockItems }) => {
  const navigate = useNavigate();

  if (!lowStockItems || lowStockItems.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Low Stock Alert</h2>
          </div>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            0 items
          </span>
        </div>
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="text-green-600" size={24} />
            </div>
            <h3 className="font-bold text-gray-800">All Stock Levels Good</h3>
            <p className="text-gray-600 mt-1">No items below minimum stock level</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform API data to match component expectations
  const transformedItems = lowStockItems.map(item => ({
    id: item.id,
    name: item.Product?.name || 'Unknown Product',
    quantity: item.quantity,
    minStock: item.reorderLevel,
    unit: 'units',
    location: item.Room?.name || item.Freezer?.name || 'Unknown location'
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <FiAlertTriangle className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold">Low Stock Alert</h2>
        </div>
        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
          {transformedItems.length} items
        </span>
      </div>

      <div className="space-y-3">
        {transformedItems.slice(0, 4).map((item) => {
          const percentage = Math.min(100, Math.round((item.quantity / item.minStock) * 100));
          return (
            <div key={item.id} className="p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer" onClick={() => navigate(`/inventory/${item.id}`)}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{item.name}</h4>
                <div className="text-red-600 font-bold text-sm">
                  {percentage}%
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Current: {item.quantity} {item.unit} • Min: {item.minStock}
              </p>
              <div className="w-full bg-red-200 rounded-full h-1.5">
                <div 
                  className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {item.location && (
                <p className="text-xs text-gray-500 mt-2">
                  Location: {item.location}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {transformedItems.length > 4 && (
        <button 
          onClick={() => navigate('/inventory/low-stock')}
          className="w-full mt-4 p-3 text-center text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors"
        >
          View All {transformedItems.length} Items →
        </button>
      )}
    </div>
  );
};

export default LowStockAlert;