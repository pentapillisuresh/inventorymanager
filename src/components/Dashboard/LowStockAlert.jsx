// src/components/Dashboard/LowStockAlert.jsx
import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const LowStockAlert = ({ inventory }) => {
  const navigate = useNavigate();
  const lowStockItems = inventory.filter(item => item.quantity < item.minStock);

  if (lowStockItems.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="text-green-600" size={24} />
            </div>
            <h3 className="font-bold text-gray-800">All Stock Levels Good</h3>
            <p className="text-gray-600 mt-1">No items below minimum stock level</p>
          </div>
        </div>
      </div>
    );
  }

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
          {lowStockItems.length} items
        </span>
      </div>

      <div className="space-y-3">
        {lowStockItems.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium">{item.name}</h4>
              <p className="text-sm text-gray-600">
                Current: {item.quantity} {item.unit} • Min: {item.minStock}
              </p>
            </div>
            <div className="text-right">
              <div className="text-red-600 font-bold">
                {Math.round((item.quantity / item.minStock) * 100)}%
              </div>
              <p className="text-xs text-gray-600">of minimum</p>
            </div>
          </div>
        ))}
      </div>

      {lowStockItems.length > 4 && (
        <button 
          onClick={() => navigate('/inventory/low-stock')}
          className="w-full mt-4 p-3 text-center text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
        >
          View All {lowStockItems.length} Items →
        </button>
      )}
    </div>
  );
};

export default LowStockAlert;