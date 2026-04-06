// src/components/Dashboard/StatsCards.jsx (Alternative compact version)
import React from 'react';
import { FiPackage, FiAlertTriangle, FiFileText, FiUsers, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const StatsCards = ({ stats }) => {
  // Transform API stats to match the original card structure
  const cards = [
    {
      title: 'Total Items',
      value: stats.totalItems || 0,
      icon: FiPackage,
      color: 'bg-blue-500',
      change: `${stats.uniqueProducts || 0} unique products`,
      trend: 'neutral'
    },
    {
      title: 'Total Quantity',
      value: stats.totalQuantity || 0,
      icon: FiPackage,
      color: 'bg-green-500',
      change: 'Units in stock',
      trend: 'neutral'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockCount || 0,
      icon: FiAlertTriangle,
      color: 'bg-orange-500',
      change: stats.lowStockCount > 0 ? `${stats.lowStockCount} items need attention` : 'All good',
      trend: stats.lowStockCount > 0 ? 'down' : 'up'
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStockCount || 0,
      icon: FiPackage,
      color: 'bg-red-500',
      change: stats.outOfStockCount > 0 ? 'Critical' : 'In stock',
      trend: stats.outOfStockCount > 0 ? 'down' : 'up'
    },
    {
      title: 'Stock Health',
      value: `${stats.healthPercentage || 0}%`,
      icon: FiPackage,
      color: getHealthColor(stats.healthPercentage),
      change: getHealthStatus(stats.healthPercentage),
      trend: getHealthTrend(stats.healthPercentage)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
              <card.icon className={`text-lg ${card.color.replace('bg-', 'text-')}`} />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              card.trend === 'up' ? 'bg-green-100 text-green-800' :
              card.trend === 'down' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {card.change}
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{card.value}</h3>
          <p className="text-gray-600 text-sm">{card.title}</p>
        </div>
      ))}
    </div>
  );
};

// Helper function to determine color based on health percentage
const getHealthColor = (percentage) => {
  const health = parseFloat(percentage);
  if (health >= 80) return 'bg-green-500';
  if (health >= 60) return 'bg-blue-500';
  if (health >= 40) return 'bg-yellow-500';
  if (health >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

// Helper function to get health status text
const getHealthStatus = (percentage) => {
  const health = parseFloat(percentage);
  if (health >= 80) return 'Excellent';
  if (health >= 60) return 'Good';
  if (health >= 40) return 'Fair';
  if (health >= 20) return 'Poor';
  return 'Critical';
};

// Helper function to get trend based on health
const getHealthTrend = (percentage) => {
  const health = parseFloat(percentage);
  if (health >= 60) return 'up';
  if (health >= 40) return 'neutral';
  return 'down';
};

export default StatsCards;