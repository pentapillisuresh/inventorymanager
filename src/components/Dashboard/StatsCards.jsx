// src/components/Dashboard/StatsCards.jsx
import React from 'react';
import { FiPackage, FiFileText, FiUsers, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../../utils/helpers';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Stock Value',
      value: formatCurrency(stats.totalStockValue),
      icon: FiPackage,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: FiPackage,
      color: 'bg-red-500',
      change: `${stats.lowStockItems > 0 ? 'Need Attention' : 'All Good'}`,
      trend: stats.lowStockItems > 0 ? 'down' : 'up'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: FiFileText,
      color: 'bg-yellow-500',
      change: 'Awaiting Approval',
      trend: 'neutral'
    },
    {
      title: 'Active Outlets',
      value: stats.activeOutlets,
      icon: FiUsers,
      color: 'bg-green-500',
      change: '+2 this month',
      trend: 'up'
    },
    {
      title: 'Total Credit',
      value: formatCurrency(stats.totalCredit),
      icon: FiDollarSign,
      color: 'bg-purple-500',
      change: 'Outstanding',
      trend: stats.totalCredit > 10000 ? 'down' : 'neutral'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="card">
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

export default StatsCards;