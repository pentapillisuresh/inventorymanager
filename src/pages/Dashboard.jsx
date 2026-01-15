// src/pages/Dashboard.jsx
import React from 'react';
import StatsCards from '../components/Dashboard/StatsCards';
import RecentInvoices from '../components/Dashboard/RecentInvoices';
import LowStockAlert from '../components/Dashboard/LowStockAlert';
import { localStorageManager } from '../utils/localStorage';
import { calculateStats } from '../utils/helpers';

const Dashboard = () => {
  const inventory = localStorageManager.getInventory();
  const invoices = localStorageManager.getInvoices();
  const outlets = localStorageManager.getOutlets();
  
  const stats = calculateStats(inventory, invoices, outlets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your store's performance and activities</p>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentInvoices invoices={invoices} />
        </div>
        <div className="lg:col-span-1">
          <LowStockAlert inventory={inventory} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;